#!/usr/bin/env python3
"""Build fast previews of original Team 7426 subsystems without changing source CAD."""
import hashlib, json, pathlib, shutil, struct, subprocess, tempfile

ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'models/preview/subsystems'
MANIFEST=ROOT/'models/preview/subsystems.json'


def info(path):
    with path.open('rb') as f:
        head=f.read(20)
        if head[:4]!=b'glTF' or struct.unpack_from('<I',head,4)[0]!=2:raise ValueError(f'Invalid GLB {path}')
        if struct.unpack_from('<I',head,8)[0]!=path.stat().st_size:raise ValueError(f'Truncated GLB {path}')
        j=json.loads(f.read(struct.unpack_from('<I',head,12)[0]))
    return {'nodes':len(j.get('nodes',[])), 'meshes':len(j.get('meshes',[])),
            'extensions':j.get('extensionsRequired',[])}


def main():
    import argparse
    ap=argparse.ArgumentParser();ap.add_argument('--gltfpack',default='gltfpack');args=ap.parse_args()
    catalog=json.loads((ROOT/'models/catalog.json').read_text())['models']
    rows={}
    OUT.mkdir(parents=True,exist_ok=True)
    failures=[]
    for model in catalog:
        if model.get('category')!='Robot Subsystems':continue
        path=ROOT/model['file']
        if not path.exists():failures.append(f'{path} missing');continue
        out=OUT/(model['id']+'-fast.glb')
        try:
            with tempfile.TemporaryDirectory(prefix='subsystem-') as d:
                tmp=pathlib.Path(d)/'fast.glb'
                subprocess.run([args.gltfpack,'-i',str(path),'-o',str(tmp),'-cc',
                  '-kn','-km','-ke','-mi','-sp','-si','0.65'],check=True,timeout=200)
                original=info(path); optimized=info(tmp)
                if not optimized['meshes'] or not optimized['nodes']:raise ValueError('Empty preview')
                if tmp.stat().st_size>=path.stat().st_size*.85:raise ValueError('No meaningful size reduction')
                shutil.copyfile(tmp,out)
            rows[model['id']]={
              'file':out.relative_to(ROOT).as_posix(),
              'bytes':out.stat().st_size,'originalBytes':path.stat().st_size,
              'ratio':round(out.stat().st_size/path.stat().st_size,4),
              'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),
              'nodes':optimized['nodes'],'meshes':optimized['meshes'],
              'originalNodes':original['nodes'],'originalMeshes':original['meshes']
            }
            print('OK',model['id'],round(path.stat().st_size/1e6,2),'MB →',round(out.stat().st_size/1e6,2),'MB',flush=True)
        except Exception as exc:
            print('FAIL',model['id'],repr(exc),flush=True);failures.append(f"{model['id']}: {exc}")
    MANIFEST.write_text(json.dumps({'previewVersion':1,'models':rows},indent=2)+'\n')
    if failures:raise SystemExit('Failed subsystem previews: '+'; '.join(failures))

if __name__=='__main__':main()