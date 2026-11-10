#!/usr/bin/env python3
"""Split and verify the Pair of Dice optimized GLBs for GitHub Pages.

Usage:
  python pack-models-for-pages.py FULL_SITE_ZIP LOCAL_GITHUB_CLONE
"""
from pathlib import Path
import sys, zipfile, hashlib, json, zlib, struct

PART_SIZE = 20 * 1024 * 1024
YEARS = ['2019','2020','2022','2023','2024','2025','2026']

class ChunkWriter:
    def __init__(self, dest, year):
        self.dest=dest
        self.year=year
        dest.mkdir(parents=True,exist_ok=True)
        self.parts=[]
        self.current=None
        self.current_bytes=0
        self.total_bytes=0
    def write(self,b):
        p=0
        while p<len(b):
            if self.current is None or self.current_bytes==PART_SIZE:
                if self.current: self.current.close()
                name=f'{self.year}.glb.gz.part{len(self.parts)+1:03d}'
                self.current=(self.dest/name).open('wb')
                self.parts.append(name)
                self.current_bytes=0
            n=min(len(b)-p,PART_SIZE-self.current_bytes)
            self.current.write(memoryview(b)[p:p+n])
            p+=n
            self.current_bytes+=n
            self.total_bytes+=n
    def close(self):
        if self.current:
            self.current.close()
            self.current=None

def pack(source,repo):
    catalog_path=repo/'models/catalog.json'
    catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
    by_id={model['id']:model for model in catalog['models']}
    with zipfile.ZipFile(source) as z:
        for year in YEARS:
            member=f'models/assemblies/{year}-optimized.glb'
            entry=z.getinfo(member)
            model=by_id[f'robot-{year}-assembly']
            dest=repo/'models'/'packed'/year
            dest.mkdir(parents=True,exist_ok=True)
            for old in dest.glob('*.glb.gz.part*'):old.unlink()
            sink=ChunkWriter(dest,year)
            if entry.compress_type == zipfile.ZIP_DEFLATED:
                # Wrap the ZIP's lossless raw-DEFLATE stream in a gzip header/footer.
                sink.write(bytes.fromhex('1f8b0800000000000003'))
                with source.open('rb') as raw:
                    raw.seek(entry.header_offset)
                    header=raw.read(30)
                    if header[:4]!=bytes.fromhex('504b0304'):
                        raise ValueError(f'Invalid ZIP local header: {member}')
                    n,e=struct.unpack_from('<HH',header,26)
                    raw.seek(n+e,1)
                    remaining=entry.compress_size
                    while remaining:
                        chunk=raw.read(min(1048576,remaining))
                        if not chunk:raise EOFError(member)
                        sink.write(chunk)
                        remaining-=len(chunk)
                sink.write(struct.pack('<II',entry.CRC,entry.file_size & 0xffffffff))
            else:
                compressor=zlib.compressobj(level=4,wbits=16+zlib.MAX_WBITS)
                with z.open(member) as stream:
                    while chunk:=stream.read(1048576):
                        sink.write(compressor.compress(chunk))
                sink.write(compressor.flush())
            sink.close()
            source_sha=hashlib.sha256()
            with z.open(member) as stream:
                while chunk:=stream.read(1048576):
                    source_sha.update(chunk)
            paths=[f'models/packed/{year}/{name}' for name in sink.parts]
            decoder=zlib.decompressobj(wbits=16+zlib.MAX_WBITS)
            recovered=hashlib.sha256()
            length=0
            for path in paths:
                with (repo/path).open('rb') as stream:
                    while chunk:=stream.read(1048576):
                        data=decoder.decompress(chunk)
                        recovered.update(data)
                        length+=len(data)
            tail=decoder.flush()
            recovered.update(tail)
            length+=len(tail)
            if not decoder.eof or recovered.digest()!=source_sha.digest() or length!=entry.file_size:
                raise ValueError(f'GLB reconstruction verification failed for {year}')
            model['packed']={'compression':'gzip','parts':paths,'bytes':entry.file_size,'compressedBytes':sink.total_bytes,'sha256':source_sha.hexdigest()}
            model['hosted']=True
            model['bytes']=entry.file_size
            print(f'{year}: {entry.file_size/1048576:.1f} MiB -> {sink.total_bytes/1048576:.1f} MiB across {len(paths)} files, SHA-256 verified')
    catalog_path.write_text(json.dumps(catalog,indent=2)+'\n',encoding='utf-8')
    print('Commit models/packed and models/catalog.json to your review branch via GitHub Desktop; then push origin.')

if __name__=='__main__':
    if len(sys.argv)!=3:
        raise SystemExit('Usage: python pack-models-for-pages.py FULL_SITE_ZIP LOCAL_GITHUB_CLONE')
    pack(Path(sys.argv[1]).resolve(),Path(sys.argv[2]).resolve())
