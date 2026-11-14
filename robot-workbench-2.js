/* Pair of Dice / Engineering Workbench 2.0
 * Progressive CAD inspection. No new 3D assets or fabricated revision meshes.
 * All dimensions below come from the rendered triangle mesh, not shop drawings.
 */
export function createWorkbench2(config) {
  const {
    host, stage, side, controlsBar, partInspector, partIsolate,
    getScene, getRoot, getSelection, onInspectPart, onChoose, onReadNotes
  } = config;
  const make=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  // Each note summarizes the supplied RICOCHET 2025–2026 technical binder.
  // Historical CAD concepts are described; this timeline does not swap meshes.
  const sourceSteps={
    full:[
      ['Kickoff','Compare strategy','Team members analyzed the game manual, potential scoring strategies, and a list of needs, wants and dislikes. Binder p. 14.'],
      ['Prototyping','Evaluate requirements','The team required 95% shot accuracy as a target, favored compact mechanisms, and considered match failure risk; the binder does not report an achieved accuracy. Binder p. 14.'],
      ['Final integration','Package all mechanisms','The 27 × 27-inch swerve chassis packages an over-bumper intake, extending hopper, feeder, turret, shooter, and compact L1 climber. Binder pp. 4–12.']
    ],
    intake:[
      ['Initial concepts','Roller and pivot geometry','The intake uses 1.5-inch polycarbonate rollers and a pivot driven by two Kraken X60 motors. Binder p. 6.'],
      ['Revision','Stability and compression','A kick plate, changed motor placement, and an upper backing plate improved the geometry and addressed trapped FUEL. Binder p. 17.'],
      ['Final changes','Dead-axle arrangement','The team changed from a live axle to a dead axle after bearings fell out, and added bearings to reduce hopper/intake friction. Binder p. 17.']
    ],
    hopper:[
      ['Capacity','Horizontal extension','The hopper extends for more FUEL capacity and retracts to fit below the trench. Binder p. 7.'],
      ['Motion','Cabinet slides and bearings','The design repurposes cabinet drawer slides; bearings along the front wall reduce friction. Binder p. 7.'],
      ['Protection','Extended front wall','The hopper front extends slightly farther than the intake to protect it near other robots and field walls. Binder p. 7.']
    ],
    'feeder-queuer':[
      ['Transfer','Five guiding belts','Five guide belts move FUEL through the robot; 1/4-inch aluminum side plates form the conveyor support. Binder p. 8.'],
      ['Indexing','Gravity and spinning blades','Angled LEXAN panels collect balls; 1/4-inch 7075-aluminum helicopter blades with 9:1 Kraken 44 drive help avoid shooter-entry jams. Binder p. 8.']
    ],
    turret:[
      ['Range','370-degree turret','Custom turret hardware allows the shooter to change direction while the chassis moves; the binder describes a 370-degree turret. Binder p. 9.'],
      ['Cable management','Custom energy chain','The turret uses a custom 3D-printed PLA Matte energy chain to accommodate movement. Binder p. 9.'],
      ['Vision','Three Limelights','Three Limelights with a custom 360-degree vision mount support field pose estimation. Binder p. 9.']
    ],
    shooter:[
      ['Initial','Adjustable hood and smaller wheel','The early shooter included an adjustable hood and a 3-inch brass wheel. Binder p. 15.'],
      ['Fixed hood','40.125-degree shot geometry','The final approach uses a fixed 40.125-degree hood, 1-inch compression, a 4-inch 8 lb brass flywheel, and direct coupling instead of pulleys. Binder pp. 10 and 15.'],
      ['Post-Arizona','Backrollers reduced backspin','After FUEL bounced into the neutral zone, the team added 1-inch aluminum backrollers to reduce backspin. The binder calls this the fourth shooter. Binder p. 18.']
    ],
    climber:[
      ['Proposed concepts','CAD alternatives only','Three prior climber designs were considered but were not fabricated. Time, resources, and packaging led to the chosen direction. Binder p. 16.'],
      ['Final design','Compact telescoping arm','The finished concept is a three-stage telescoping L1 climber with 30-inch maximum extension and a Kraken X60 at 45:1; hook and plates are 7075 aluminum. Binder pp. 11 and 16.']
    ],
    drivetrain:[
      ['Architecture','27 × 27-inch swerve chassis','SDS MK5N modules, R3 reduction, 4-inch high-grip wheels, X60 drive and X44 steering motors. Binder p. 5.'],
      ['Service','Structure and bumper brackets','2 × 1 × 1/8-inch aluminum rails, a 1/8-inch belly pan, wiring cutouts, and custom quick-swap bumper brackets. Binder p. 5.']
    ],
    bumpers:[
      ['Mounting','Custom swap brackets','Custom bumper mounts support fast bumper swaps; the binder does not provide measured bumper performance. Binder p. 5.']
    ]
  };
  const btn=(text,cls)=>{
    const b=make('button',cls,text);b.type='button';return b;
  };
  const measureButton=btn('Measure','theater-tool wb2-tool');
  const sectionButton=btn('Section view','theater-tool wb2-tool');
  measureButton.title='Select two points on the actual CAD mesh to measure their straight-line distance.';
  sectionButton.title='Clip the displayed CAD using a movable inspection plane.';
  for(const b of [measureButton,sectionButton]){
    b.disabled=true;b.setAttribute('aria-pressed','false');
    controlsBar.append(b);
  }
  const measurePanel=make('div','wb2-stage-panel');
  measurePanel.hidden=true;
  const measureText=make('output','wb2-readout','Select the first point on the CAD model.');
  measureText.setAttribute('role','status');
  const measureClear=btn('Clear points','wb2-mini-button');
  measurePanel.append(make('strong',null,'SURFACE DISTANCE'),measureText,measureClear);
  const measureHelp=make('small',null,'Straight-line distance between mesh surface points. Approximate; not a manufacturing measurement.');
  measurePanel.append(measureHelp);
  stage.append(measurePanel);
  const sectionPanel=make('div','wb2-stage-panel wb2-section-panel');
  sectionPanel.hidden=true;
  const sectionHeader=make('div','wb2-section-header');
  sectionHeader.append(make('strong',null,'SECTION PLANE'));
  const axisSelect=make('select','wb2-axis');
  axisSelect.setAttribute('aria-label','Section orientation');
  [['y','Height / Y'],['x','Left-right / X'],['z','Front-back / Z']].forEach(([value,label])=>{
    const option=new Option(label,value);axisSelect.add(option);
  });
  sectionHeader.append(axisSelect);
  const sectionRange=make('input','wb2-section-range');
  sectionRange.type='range';sectionRange.min='0';sectionRange.max='100';
  sectionRange.step='1';sectionRange.value='50';
  sectionRange.setAttribute('aria-label','Section position percentage');
  const sectionReadout=make('output','wb2-readout','Middle of mesh');
  const sectionHelp=make('small',null,'Visual clipping of the rendered mesh; no solid cut faces or manufacturing section geometry.');
  sectionPanel.append(sectionHeader,sectionRange,sectionReadout,sectionHelp);
  stage.append(sectionPanel);

  const partSpecs=make('dl','wb2-part-specs');
  partSpecs.setAttribute('aria-label','Selected CAD render properties');
  partInspector.insertBefore(partSpecs,partIsolate);

  const finder=make('div','wb2-finder');
  const finderLabel=make('label',null,'Find a system or part');
  const search=make('input','wb2-search');
  search.type='search';search.placeholder='Search the current CAD…';
  search.setAttribute('aria-label','Search subsystems and imported CAD part names');
  finderLabel.append(search);
  finder.append(finderLabel);
  const nav=side.querySelector('.theater-nav');
  side.insertBefore(finder,nav);
  const tree=make('details','wb2-tree');
  tree.append(make('summary',null,'Assembly tree'));
  const treeHint=make('p','wb2-tree-hint','Open a model to inspect its imported CAD hierarchy.');
  const treeResults=make('div','wb2-tree-results');
  tree.append(treeHint,treeResults);
  side.insertBefore(tree,side.querySelector('.theater-detail'));
  const history=make('section','wb2-history');
  history.setAttribute('aria-label','Documented engineering design history');
  const historyHeading=make('div','wb2-history-heading');
  historyHeading.append(make('strong',null,'DESIGN HISTORY'),make('small',null,'RICOCHET / 2026'));
  const historySubtitle=make('p','wb2-history-desc','Documented development stages, not separately modeled CAD revisions.');
  const historyItems=make('div','wb2-history-items');
  const historyNote=make('p','wb2-history-note');
  const historyLink=btn('Read the engineering notes','wb2-history-link');
  history.append(historyHeading,historySubtitle,historyItems,historyNote,historyLink);
  side.insertBefore(history,side.querySelector('.theater-action-panel'));

  let measureMode=false,sectionMode=false,measurePoints=[],guides=[];
  let clippingRoot=null,plane=null;
  const clippingMaterials=new Map();
  let historyIndex=0;
  let renderList=[];
  const genericName=/^(?:mesh|node|scene|primitive|object|group|root|gltf scene|default|unnamed)(?:[\s_.:-]*\d+)?$/i;
  function context(){return getScene();}
  function root(){return getRoot();}
  function setPressed(button,state){button.setAttribute('aria-pressed',String(state));button.classList.toggle('is-on',state);}
  function disposeGuide(obj){
    obj.parent?.remove(obj);obj.geometry?.dispose();
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    materials.forEach(m=>m?.dispose());
  }
  function clearPoints(){
    measurePoints=[];guides.forEach(disposeGuide);guides=[];
    measureText.textContent='Select the first point on the CAD model.';
  }
  function disableMeasure(){
    measureMode=false;measurePanel.hidden=true;setPressed(measureButton,false);clearPoints();
    delete host.dataset.workbenchMeasureMm;
  }
  function stopClip(){
    for(const [material,original] of clippingMaterials){
      material.clippingPlanes=original;
      material.needsUpdate=true;
    }
    clippingMaterials.clear();clippingRoot=null;plane=null;
    const c=context();
    if(c?.renderer)c.renderer.localClippingEnabled=false;
  }
  function disableSection(){
    sectionMode=false;sectionPanel.hidden=true;setPressed(sectionButton,false);
    stopClip();
  }
  function renderSection(){
    if(!sectionMode)return;
    const c=context(),target=root();
    if(!c?.THREE||!c.renderer||!target)return;
    if(clippingRoot!==target){
      stopClip();
      clippingRoot=target;
      plane=new c.THREE.Plane(new c.THREE.Vector3(0,1,0),0);
      target.traverse(node=>{
        if(!node.isMesh||!node.material)return;
        const mats=Array.isArray(node.material)?node.material:[node.material];
        for(const mat of mats){
          if(!mat||clippingMaterials.has(mat))continue;
          clippingMaterials.set(mat,mat.clippingPlanes||null);
          mat.clippingPlanes=[plane];mat.needsUpdate=true;
        }
      });
    }
    const bounds=new c.THREE.Box3().setFromObject(target);
    if(bounds.isEmpty())return;
    const axis=axisSelect.value;
    const index={x:0,y:1,z:2}[axis];
    const lo=bounds.min.getComponent(index),hi=bounds.max.getComponent(index);
    const fraction=Number(sectionRange.value)/100;
    const coord=lo+(hi-lo)*fraction;
    plane.normal.set(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0);
    plane.constant=-coord;
    c.renderer.localClippingEnabled=true;
    sectionReadout.textContent=Math.round(fraction*100)+'% · '+axis.toUpperCase()+' axis';
  }
  function pointSize(){
    const c=context(),target=root();
    if(!c?.THREE||!target)return .004;
    const box=new c.THREE.Box3().setFromObject(target);
    return Math.max(.003,Math.min(.02,box.getSize(new c.THREE.Vector3()).length()*.009));
  }
  function onPick(hit){
    if(!measureMode)return false;
    const c=context();
    if(!c?.THREE||!c.scene||!hit?.point)return true;
    if(measurePoints.length>=2)clearPoints();
    const pt=hit.point.clone();
    measurePoints.push(pt);
    const marker=new c.THREE.Mesh(
      new c.THREE.SphereGeometry(pointSize(),12,8),
      new c.THREE.MeshBasicMaterial({color:0xa32632,depthTest:false,depthWrite:false})
    );
    marker.position.copy(pt);
    marker.name='CAD measuring point';
    marker.userData.workbenchGuide=true;
    marker.renderOrder=1002;
    c.scene.add(marker);guides.push(marker);
    if(measurePoints.length===1){
      measureText.textContent='First point set. Select a second mesh surface point.';
    }else{
      const distance=measurePoints[0].distanceTo(measurePoints[1]);
      const line=new c.THREE.Line(
        new c.THREE.BufferGeometry().setFromPoints(measurePoints),
        new c.THREE.LineBasicMaterial({color:0xa32632,depthTest:false,depthWrite:false})
      );
      line.name='CAD measuring segment';
      line.renderOrder=1001;line.userData.workbenchGuide=true;
      c.scene.add(line);guides.push(line);
      measureText.textContent=(distance*1000).toFixed(1)+' mm / '+(distance*39.37007874).toFixed(3)+' in';
      host.dataset.workbenchMeasureMm=(distance*1000).toFixed(2);
    }
    return true;
  }
  measureButton.addEventListener('click',()=>{
    if(measureMode){disableMeasure();return}
    disableSection();measureMode=true;measurePanel.hidden=false;
    setPressed(measureButton,true);
    clearPoints();
  });
  measureClear.addEventListener('click',()=>{
    clearPoints();delete host.dataset.workbenchMeasureMm;
  });
  sectionButton.addEventListener('click',()=>{
    if(sectionMode){disableSection();return}
    disableMeasure();sectionMode=true;sectionPanel.hidden=false;
    setPressed(sectionButton,true);
    renderSection();
  });
  sectionRange.addEventListener('input',renderSection);
  axisSelect.addEventListener('change',renderSection);

  function readableName(mesh){
    const lineage=[];
    for(let node=mesh,count=0;node&&node!==root()&&count<8;node=node.parent,count++){
      const name=(node.name||'').trim();
      if(name&&!genericName.test(name)&&!/^CAD measuring/i.test(name))
        lineage.push(name.slice(0,100));
    }
    return lineage;
  }
  function onPart(mesh){
    partSpecs.replaceChildren();
    if(!mesh?.isMesh)return;
    const c=context();
    if(!c?.THREE)return;
    const bounds=new c.THREE.Box3().setFromObject(mesh);
    const size=bounds.getSize(new c.THREE.Vector3());
    const geometry=mesh.geometry;
    const triangles=geometry?.index?
      Math.floor(geometry.index.count/3):
      Math.floor((geometry?.getAttribute('position')?.count||0)/3);
    const names=readableName(mesh);
    const data=[
      ['Part hierarchy',names.length?names.slice(0,3).reverse().join(' / '):'Unnamed mesh'],
      ['Approx. mesh bounds',
        (size.x*1000).toFixed(1)+' × '+(size.y*1000).toFixed(1)+' × '+(size.z*1000).toFixed(1)+' mm'],
      ['Rendered triangles',triangles.toLocaleString()],
      ['Geometry source',getSelection()==='full'?'Robot assembly':'Isolated subsystem']
    ];
    for(const [label,value] of data){
      partSpecs.append(make('dt',null,label),make('dd',null,value));
    }
    const foot=make('p','wb2-spec-note','Bounds are world-axis-aligned mesh estimates. Do not use for tolerances, cutting, or fabrication.');
    partSpecs.append(foot);
  }

  const filterNav=()=>{
    const q=search.value.trim().toLowerCase();
    side.querySelectorAll('.theater-nav-button').forEach(button=>{
      button.hidden=Boolean(q)&&!button.textContent.toLowerCase().includes(q);
    });
  };
  function collectParts(){
    const target=root();
    if(!target)return [];
    const result=[];
    target.traverse(node=>{
      if(!node.isMesh||node.userData?.workbenchGuide||node.name==='CAD selection / visual guide')return;
      const names=readableName(node);
      if(!names.length)return;
      result.push({mesh:node,label:names[0],path:names.slice(0,4).reverse().join(' / ')});
    });
    return result;
  }
  function renderTree(){
    treeResults.replaceChildren();
    if(!tree.open)return;
    const current=root();
    if(!current){
      treeHint.textContent='Open the 3D model to browse imported CAD parts.';
      return;
    }
    renderList=collectParts();
    const q=search.value.trim().toLowerCase();
    const matched=renderList.filter(p=>!q||(p.path.toLowerCase().includes(q)));
    const shown=matched.slice(0,85);
    treeHint.textContent=matched.length?
      ('Showing '+shown.length+' of '+matched.length+' named CAD meshes'+(q?' matching your search':'')+'.'):
      ('No named meshes match. Optimized exports may remove original part labels.');
    for(const item of shown){
      const b=btn(item.label,'wb2-tree-item');
      b.title=item.path;
      b.addEventListener('click',()=>onInspectPart(item.mesh));
      treeResults.append(b);
    }
    if(matched.length>85)treeResults.append(make('p','wb2-tree-hint',
      'Showing the first 85 parts. Narrow the search to find a specific element.'));
  }
  search.addEventListener('input',()=>{filterNav();if(search.value.trim())tree.open=true;renderTree()});
  tree.addEventListener('toggle',()=>{if(tree.open)renderTree()});
  historyLink.addEventListener('click',()=>onReadNotes());
  function renderHistory(){
    const key=getSelection();
    const milestones=sourceSteps[key]||sourceSteps.full;
    historyItems.replaceChildren();
    historyIndex=0;
    const selectedStage=idx=>{
      historyIndex=idx;
      const [stageLabel,title,note]=milestones[idx];
      historyNote.textContent=title+' — '+note;
      [...historyItems.children].forEach((button,i)=>{
        button.classList.toggle('is-current',idx===i);
        button.setAttribute('aria-pressed',String(idx===i));
      });
    };
    milestones.forEach(([stageLabel,title],index)=>{
      const b=btn(String(index+1).padStart(2,'0')+'  '+stageLabel,'wb2-milestone');
      b.setAttribute('aria-pressed',String(index===0));
      b.title=title;
      b.addEventListener('click',()=>selectedStage(index));
      historyItems.append(b);
    });
    selectedStage(0);
  }
  function refresh(){
    const c=context(),loaded=!!(c?.THREE&&c?.renderer&&root());
    measureButton.disabled=!loaded;sectionButton.disabled=!loaded;
    if(sectionMode&&loaded)renderSection();
    if(tree.open)renderTree();
  }
  let lastSelection=getSelection();
  function onSelection(){
    const nextSelection=getSelection();
    // Initial CAD readiness and camera transitions must not discard a tool
    // the visitor just enabled on the same subsystem.
    if(nextSelection!==lastSelection){
      disableMeasure();disableSection();delete host.dataset.workbenchMeasureMm;
    }
    lastSelection=nextSelection;
    renderHistory();filterNav();refresh();
  }
  function beforeMotion(){
    disableMeasure();disableSection();
  }
  function dispose(){
    disableMeasure();disableSection();
    [measureButton,sectionButton,measurePanel,sectionPanel,finder,tree,history,partSpecs]
      .forEach(node=>node.remove());
    delete host.dataset.workbenchReady;
    delete host.dataset.workbenchMeasureMm;
  }
  renderHistory();
  refresh();
  host.dataset.workbenchReady='2';
  return {onPick,onPart,onSelection,refresh,beforeMotion,dispose};
}
