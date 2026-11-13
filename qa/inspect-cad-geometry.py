#!/usr/bin/env python3
"""Read raw GLB node hierarchy and accessor bounding boxes. No GPU required."""
import gzip,glob,struct,json,math

def mult(a,b):
    c=[0.0]*16
    for col in range(4):
      for row in range(4):
        c[col*4+row]=sum(a[k*4+row]*b[col*4+k] for k in range(4))
    return c
I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
def matrix(node):
    if "matrix" in node:return node["matrix"]
    t=node.get("translation",[0,0,0]);x,y,z,w=node.get("rotation",[0,0,0,1]);a,b,c=node.get("scale",[1,1,1])
    return [(1-2*(y*y+z*z))*a,2*(x*y+z*w)*a,2*(x*z-y*w)*a,0,
            2*(x*y-z*w)*b,(1-2*(x*x+z*z))*b,2*(y*z+x*w)*b,0,
            2*(x*z+y*w)*c,2*(y*z-x*w)*c,(1-2*(x*x+y*y))*c,0,*t,1]
def tf(m,p):
    x,y,z=p;return [m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]]
def union(a,b):
    if a is None:return b
    if b is None:return a
    return [[min(a[0][i],b[0][i]) for i in range(3)],
            [max(a[1][i],b[1][i]) for i in range(3)]]
def box(m,accessor):
    mi=accessor.get("min");ma=accessor.get("max")
    if not mi or not ma:return None
    corners=[[x,y,z] for x in [mi[0],ma[0]] for y in [mi[1],ma[1]] for z in [mi[2],ma[2]]]
    pts=[tf(m,c) for c in corners]
    return [[min(p[i] for p in pts) for i in range(3)],[max(p[i] for p in pts) for i in range(3)]]
def center(b):
    return [round((b[0][i]+b[1][i])/2,4) for i in range(3)] if b else None
def dims(b):
    return [round(b[1][i]-b[0][i],4) for i in range(3)] if b else None

for year in ("2026","2025"):
    paths=sorted(glob.glob("models/packed/"+year+"/*.part*"))
    if not paths:continue
    raw=gzip.decompress(b"".join(open(p,"rb").read() for p in paths))
    size=struct.unpack_from("<I",raw,12)[0];doc=json.loads(raw[20:20+size])
    nodes=doc["nodes"];meshes=doc.get("meshes",[]);acc=doc.get("accessors",[])
    parents=[None]*len(nodes)
    for i,n in enumerate(nodes):
        for child in n.get("children",[]): parents[child]=i
    world=[None]*len(nodes)
    def worldM(i):
        if world[i] is None:
            world[i]=mult(worldM(parents[i]) if parents[i] is not None else I,matrix(nodes[i]))
        return world[i]
    own=[None]*len(nodes)
    for i,n in enumerate(nodes):
        if "mesh" in n:
            for prim in meshes[n["mesh"]].get("primitives",[]):
                pos=prim.get("attributes",{}).get("POSITION")
                if pos is not None:own[i]=union(own[i],box(worldM(i),acc[pos]))
    tree=[None]*len(nodes)
    def bbox(i):
        if tree[i] is None:
          b=own[i]
          for child in nodes[i].get("children",[]):b=union(b,bbox(child))
          tree[i]=b
        return tree[i]
    for i in range(len(nodes)):bbox(i)
    print("\nYEAR",year,"nodes",len(nodes))
    terms=["shooter","turret","brass wheels","sushi roller","exit roller","roller","claw","carriage","elevator","hard stop"]
    for term in terms:
        results=[]
        for i,n in enumerate(nodes):
            label=n.get("name","")
            if term not in label.lower():continue
            b=tree[i];ifParent=nodes[parents[i]].get("name","") if parents[i] is not None else ""
            if b:results.append((i,label,ifParent,center(b),dims(b),n.get("translation")))
        print("MATCH",term,"count",len(results))
        for line in results[:18]:print("NODE",json.dumps(line))
    for term in (["Shooter <2>","Turret <1>"] if year=="2026" else ["2025Claw <1>","2025Carriage <1>"]):
        i=next((i for i,n in enumerate(nodes) if n.get("name","").lower()==term.lower()),None)
        if i is None:continue
        print("TOP",term,"parent",nodes[parents[i]].get("name","") if parents[i] is not None else None,"transforms",nodes[i])
        selected=[]
        def descendants(k,depth=0):
            if depth>3:return
            for child in nodes[k].get("children",[]):
                n=nodes[child]
                if tree[child]:selected.append((depth+1,n.get("name"),center(tree[child]),dims(tree[child])))
                descendants(child,depth+1)
        descendants(i)
        for line in selected[:35]:print("CHILD",json.dumps(line))
