#!/usr/bin/env python3
"""Create verified fast-loading CAD previews from complete source GLBs.

This intentionally never overwrites the full-resolution robot models. It emits
native, viewable GLB previews that preserve named robot components and materials
and a summary describing each preview's fidelity / compression.
"""
import argparse, gzip, hashlib, json, os, pathlib, shutil, struct, subprocess, tempfile, time
from itertools import chain

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = ROOT/'models/catalog.json'
PREVIEWS = ROOT/'models/preview'
YEARS = ('2026','2025','2022','2020','2019','2024','2023')

class PartStream:
    """Read a gzip stream split into consecutive GitHub-friendly chunks."""
    def __init__(self, paths):
        self.paths = list(paths)
        self.pos = 0
        self.current = None
    def read(self, amount=-1):
        if amount==0: return b''
        buf = bytearray()
        while amount < 0 or len(buf)<amount:
            if self.current is None:
                if self.pos>=len(self.paths): break
                self.current=open(self.paths[self.pos], 'rb'); self.pos+=1
            chunk=self.current.read(1<<20 if amount<0 else min(amount-len(buf),1<<20))
            if not chunk:
                self.current.close(); self.current=None; continue
            buf.extend(chunk)
        return bytes(buf)
    def readable(self):return True
    def close(self):
        if self.current: self.current.close(); self.current=None


def glb_summary(path):
    with path.open('rb') as fp:
        header=fp.read(20)
        assert header[:4]==b'glTF' and struct.unpack_from('<I',header,4)[0]==2, f'Bad GLB header: {path}'
        expected=struct.unpack_from('<I',header,8)[0]
        assert expected==path.stat().st_size, f'GLB truncated: {path}'
        jsonlength=struct.unpack_from('<I',header,12)[0]
        assert header[16:20]==b'JSON', 'GLB JSON chunk missing'
        data=json.loads(fp.read(jsonlength))
    return {
        'nodes': len(data.get('nodes',[])), 'meshes':len(data.get('meshes',[])),
        'materials':len(data.get('materials',[])),
        'triangles':sum(p.get('indices',-1) for m in data.get('meshes',[]) for p in m.get('primitives',[])),
        'extensions':data.get('extensionsRequired',[]),
        'nodeNames':{n.get('name') for n in data.get('nodes',[]) if n.get('name')},
        'meshNames':{n.get('name') for n in data.get('meshes',[]) if n.get('name')},
    }


def run_one(year, model, exe):
    paths=[ROOT/p for p in model['packed']['parts']]
    for p in paths:
        if not p.is_file():raise FileNotFoundError(p)
    PREVIEWS.mkdir(parents=True,exist_ok=True)
    start=time.monotonic()
    with tempfile.TemporaryDirectory(prefix=f'robot-{year}-') as d:
        raw=pathlib.Path(d)/'source.glb'
        combined=PartStream(paths)
        digest=hashlib.sha256()
        total=0
        # gzip.GzipFile uses read on PartStream. Never hold the full source in JS memory.
        try:
            with gzip.GzipFile(fileobj=combined,mode='rb') as z,raw.open('wb') as dest:
                while True:
                    block=z.read(2<<20)
                    if not block:break
                    dest.write(block);digest.update(block);total+=len(block)
        finally:combined.close()
        assert total==model['packed']['bytes'], f'{year} unpacked length mismatch'
        assert digest.hexdigest()==model['packed']['sha256'], f'{year} SHA mismatch'
        source=glb_summary(raw)
        out=PREVIEWS/f'{year}-fast.glb'
        tmp=pathlib.Path(d)/'preview.glb'
        # gltfpack optimizes vertex-cache ordering, quantization and repeated geometry.
        # Named nodes are REQUIRED by interactive subsystems; -kn keeps them intact.
        # 0.38 targets 62% triangle reduction, but structural details may limit it.
        cmd=[exe,'-i',str(raw),'-o',str(tmp),'-cc','-si','0.38','-sp','-kn','-km','-ke','-mi']
        subprocess.run(cmd,check=True,timeout=750)
        preview=glb_summary(tmp)
        if preview['meshes']==0 or preview['nodes']==0:raise ValueError(f'{year} preview is empty')
        # Too-aggressive flattening would break selections and original CAD animation.
        if len(preview['nodeNames'])<max(5,min(20,len(source['nodeNames'])//20)):
            raise ValueError(f'{year}: too many named nodes removed')
        # Keep previews materially smaller than originals or do not publish.
        if tmp.stat().st_size>=raw.stat().st_size*.90:
            raise ValueError(f'{year} failed to reduce model size')
        shutil.copyfile(tmp,out)
        return {
            'year':year,'file':out.relative_to(ROOT).as_posix(),
            'bytes':out.stat().st_size, 'originalBytes':total,
            'originalCompressedBytes':model['packed']['compressedBytes'],
            'ratioToOriginal':round(out.stat().st_size/total,4),
            'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),
            'nodes':preview['nodes'],'meshes':preview['meshes'],
            'sourceNodes':source['nodes'],'sourceMeshes':source['meshes'],
            'meshopt': 'EXT_meshopt_compression' in preview['extensions'],
            'seconds':round(time.monotonic()-start,1)
        }


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--years',nargs='+',default=list(YEARS));ap.add_argument('--gltfpack',default='gltfpack')
    a=ap.parse_args()
    models={m['id']:m for m in json.loads(CATALOG.read_text())['models']}
    manifest=PREVIEWS/'catalog.json'
    info=json.loads(manifest.read_text()) if manifest.exists() else {'previewVersion':1,'models':{}}
    errors=[]
    for year in a.years:
        if year not in YEARS:raise ValueError(year)
        try:
            row=run_one(year,models[f'robot-{year}-assembly'],a.gltfpack)
            info['models'][year]=row
            manifest.write_text(json.dumps(info,indent=2)+'\n')
            print('OK',year,round(row['originalBytes']/1e6,2),'MB ->',round(row['bytes']/1e6,2),'MB',row['seconds'],'s',flush=True)
        except Exception as e:
            errors.append(f'{year}: {e}')
            print('FAILED',year,str(e),flush=True)
    print('Summary:',json.dumps(info,indent=2),flush=True)
    if errors:raise SystemExit('Some previews failed: '+', '.join(errors))

if __name__=='__main__':main()