/* PAIR OF DICE | IMMERSIVE ROBOT THEATER
   A single Three.js WebGL scene for model, camera, highlighting and gamepiece
   animations. The moves are educational visualizations, not measured physics
   or kinematically verified robot mechanism animations. */
(() => {
"use strict";
const seasons={
  "2026":{
    name:"RICOCHET", season:"REBUILT", hero:"assets/document-image-2.png",
    intro:"The 2026 REBUILT robot. Select a subsystem to inspect its CAD and design notes.",
    pieces:[
      ["drivetrain","Swerve drivetrain","A low four-module chassis with SDS MK5N modules and a 27 × 27-inch frame."],
      ["intake","Over-bumper intake","The pivoting roller intake collects FUEL and transfers it toward storage. Its geometry evolved through testing."],
      ["hopper","Extending hopper","A storage mechanism that extends for capacity and retracts for field clearance."],
      ["feeder-queuer","Feeder / queuer","The compact belt-guided path transports FUEL toward the scoring system."],
      ["turret","Turret","Independent aiming packages the scoring assembly above the robot chassis."],
      ["shooter","Shooter","The high-inertia flywheel and fixed-geometry hood support consistent scoring."],
      ["climber","Climber","The endgame climbing structure is packaged within a compact robot envelope."],
      ["bumpers","Bumpers","A separate protective structure with mounting interfaces for easier service."]
    ],
    actionName:"Watch RICOCHET drive & shoot", actionSubsystem:"shooter", actionTitle:"FUEL / SCORING SEQUENCE"
  },
  "2025":{
    name:"DEADPOOL", season:"REEFSCAPE", hero:"",
    intro:"The 2025 REEFSCAPE robot. Select a subsystem to inspect its CAD and design notes.",
    pieces:[
      ["drivetrain","Drivetrain","View the full drive chassis independently. Detailed motor and gearing specifications remain to be verified."],
      ["elevator","Elevator","The upright mechanism positions the manipulator across different vertical levels."],
      ["carriage","Carriage","A moving mounting structure connecting the elevator with the scoring mechanism."],
      ["claw","Claw","The game-piece interface, isolated for close CAD inspection."],
      ["climber","Climber","A dedicated endgame mechanism separated from the main assembly."],
      ["bumpers","Bumpers","Chassis-protection geometry and structural mounting interfaces."]
    ],
    actionName:"Watch DEADPOOL place CORAL",actionSubsystem:"claw",actionTitle:"CORAL / PLACEMENT SEQUENCE"
  }
};
const e=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
};
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
// Deterministic unit-safe kinematics shared by the interactive viewer and
// the automated browser regression. Distances are meters; times are seconds.
const SCORING_G=9.81;
const SCORING_QA=new URLSearchParams(window.location.search).has("qa");
const deriveBallisticShot=(horizontalMeters,riseMeters,pitchRadians)=>{
  const d=horizontalMeters,angle=pitchRadians;
  const cosine=Math.cos(angle);
  const clearance=d*Math.tan(angle)-riseMeters;
  if(!(d>0 && cosine>.01 && clearance>.015))
    throw new Error("Shooter aim cannot clear the target under gravity");
  const speed=Math.sqrt(SCORING_G*d*d/(2*cosine*cosine*clearance));
  const seconds=d/(speed*cosine);
  const verticalAtTarget=speed*Math.sin(angle)-SCORING_G*seconds;
  return {speed,seconds,verticalAtTarget,gravity:SCORING_G};
};
const branchGravity=(angleRadians,friction=.26)=>Math.max(
  0,SCORING_G*(Math.sin(angleRadians)-friction*Math.cos(angleRadians))
);
// Keeping this math inspectable makes it possible to test trajectory/support
// constraints independently of WebGL rendering and animation frame rate.
window.RobotScoringPhysics={deriveBallisticShot,branchGravity};

const ease=t=>t*t*(3-2*t);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
let enginePromise=null;
function getEngine(){
  if(!enginePromise){
    enginePromise=Promise.all([
      import("three"),
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/controls/OrbitControls.js"),
      import("three/addons/environments/RoomEnvironment.js"),
      import("three/addons/libs/meshopt_decoder.module.js")
    ]).then(([THREE,loader,orbit,room,meshopt])=>({
      THREE,GLTFLoader:loader.GLTFLoader,OrbitControls:orbit.OrbitControls,
      RoomEnvironment:room.RoomEnvironment,MeshoptDecoder:meshopt.MeshoptDecoder
    }))
      .catch(err=>{enginePromise=null;throw err;});
  }
  return enginePromise;
}
function mount(host,year,models,loadPackedModel){
  const def=seasons[String(year)];
  if(!def)return;
  const byId=new Map(models.map(m=>[m.id,m]));
  const fullModel=byId.get("robot-"+year+"-assembly");
  const fastSource=fullModel?.fastPreview?.file || "";
  if(!fullModel)return;

  host.className="robot-theater";
  host.id="robot-explorer";
  host.dataset.year=String(year);
  const titleBand=e("div","theater-heading");
  const headingCopy=e("div","theater-heading-copy");
  headingCopy.append(e("span","theater-eyebrow","FRC 7426  /  "+year+"  /  "+def.season),
    e("h2",null,def.name),e("p",null,def.intro));
  titleBand.append(headingCopy);

  const shell=e("div","theater-shell");
  const stage=e("div","theater-stage");
  const viewport=e("div","theater-viewport");
  const canvasHome=e("div","theater-canvas-home");
  const poster=e("div","theater-poster");
  if(def.hero){
    const img=e("img");
    img.src=def.hero;
    img.alt="CAD rendering of "+def.name;
    poster.append(img);
  }else poster.append(e("div","theater-poster-word",def.name));
  const posterShade=e("div","theater-poster-shade");
  const launch=e("button","theater-launch","Open 3D model");
  launch.type="button";
  const posterCaption=e("div","theater-poster-caption");
  posterCaption.append(e("strong",null,"Explore the robot"),launch);
  posterShade.append(posterCaption);
  poster.append(posterShade);
  const graphic=e("div","theater-visual-grid");
  const hotspots=e("div","theater-hotspots");
  const hudTop=e("div","theater-hud-top");
  hudTop.append(e("span","theater-top-year","CAD / "+year));
  const hudBottom=e("div","theater-hud-bottom");
  const hudLabel=e("div","theater-hud-label");
  const sceneStep=e("span","theater-hud-step","01 / FULL ROBOT");
  const sceneTitle=e("strong",null,def.name+" / COMPLETE ASSEMBLY");
  hudLabel.append(sceneStep,sceneTitle);
  const hudOrbit=e("div","theater-hud-orbit","Drag to rotate · Scroll to zoom");
  hudBottom.append(hudLabel,hudOrbit);
  const loader=e("div","theater-loading");
  loader.hidden=true;
  const loaderBar=e("span","theater-loading-bar");
  const loaderText=e("strong",null,"Preparing the robot...");
  loader.append(loaderBar,loaderText);
  const demoHud=e("div","theater-demo-hud");
  demoHud.hidden=true;
  const demoTitle=e("strong",null,def.actionTitle);
  const demoStep=e("span",null,"ILLUSTRATIVE 3D SEQUENCE");
  const demoTrack=e("div","theater-demo-track");
  const demoFill=e("span");
  demoTrack.append(demoFill);
  const phaseRail=e("div","theater-phase-rail");
  const phaseLabels=year==="2026"
    ?["Approach","Aim","Score","Complete"]
    :["Approach","Lift","Place","Complete"];
  const phasePills=phaseLabels.map(label=>{
    const part=e("span",null,label);
    phaseRail.append(part);
    return part;
  });
  const setPhase=index=>{
    phasePills.forEach((node,i)=>{
      node.classList.toggle("is-current",i===index);
      node.classList.toggle("is-complete",i<index);
    });
  };
  setPhase(0);
  demoHud.append(demoStep,demoTitle,demoTrack,phaseRail);
  const partInspector=e("aside","theater-part-inspector");
  partInspector.hidden=true;
  partInspector.setAttribute("aria-label","CAD part inspector");
  const partHeader=e("div","theater-part-header");
  const partKicker=e("span",null,"DIRECTLY FROM THE TEAM CAD");
  const partClose=e("button","theater-part-close","×");
  partClose.type="button"; partClose.setAttribute("aria-label","Close part inspector");
  partHeader.append(partKicker,partClose);
  const partTitle=e("strong","theater-part-name","Selected CAD object");
  const partSource=e("p","theater-part-source","A part name from the imported CAD.");
  const partIsolate=e("button","theater-part-isolate","Isolate selected geometry");
  partIsolate.type="button";
  partInspector.append(partHeader,partTitle,partSource,partIsolate);
  const perfEnabled=new URLSearchParams(location.search).has("perf");
  const perfHud=e("output","theater-perf-hud","Calculating frame timings…");
  perfHud.hidden=!perfEnabled;
  perfHud.setAttribute("aria-label","Live WebGL render measurements");
  viewport.append(canvasHome,graphic,poster,hotspots,hudTop,hudBottom,loader,demoHud,partInspector,perfHud);
  const controlsBar=e("div","theater-controls");
  const btnFull=e("button","theater-tool","← Full robot");
  const btnReset=e("button","theater-tool","Reset view");
  const btnSpin=e("button","theater-tool","Rotate");
  const btnExpand=e("button","theater-tool","Expand");
  const btnExplode=e("button","theater-tool theater-explode","Explode parts");
  btnExplode.type="button";
  btnExplode.disabled=true;
  btnExplode.title="Exploded assembly inspection; separation is visual, not mechanical travel.";
  btnExplode.setAttribute("aria-pressed","false");
  const btnOriginal=e("button","theater-tool theater-original-detail","Inspect original CAD");
  btnOriginal.type="button";
  btnOriginal.hidden=!fastSource;
  btnOriginal.disabled=true;
  btnOriginal.title="Load the complete high-resolution CAD model only when needed.";
  const btnSlowDemo=e("button","theater-tool theater-slow-motion","Slow motion · ½×");
  btnSlowDemo.type="button";btnSlowDemo.hidden=true;
  btnSlowDemo.setAttribute("aria-pressed","false");
  const btnPauseDemo=e("button","theater-tool theater-pause-motion","Pause");
  btnPauseDemo.type="button";
  btnPauseDemo.hidden=true;
  btnPauseDemo.addEventListener("click",()=>{
    if(!action)return;
    action._paused=!action._paused;
    btnPauseDemo.textContent=action._paused?"Resume":"Pause";
    btnPauseDemo.setAttribute("aria-pressed",String(action._paused));
  });
  [btnFull,btnReset,btnSpin,btnExpand].forEach(x=>x.type="button");
  btnFull.disabled=true;
  const controlNote=e("span","theater-controls-note","");
  controlsBar.append(btnFull,btnReset,btnExpand,btnExplode,btnOriginal,btnPauseDemo,btnSlowDemo);
  stage.append(viewport,controlsBar);

  const side=e("aside","theater-side");
  const sideHeader=e("div","theater-side-title");
  sideHeader.append(e("h3",null,"Subsystems"),e("p",null,"Choose a mechanism to inspect."));
  const nav=e("div","theater-nav");
  nav.setAttribute("role","group");
  nav.setAttribute("aria-label","Robot systems");
  const navButtons=new Map();
  const fullNav=e("button","theater-nav-button is-selected","00   /   Complete robot");
  fullNav.type="button";
  fullNav.setAttribute("aria-pressed","true");
  nav.append(fullNav);
  def.pieces.forEach((p,i)=>{
    const b=e("button","theater-nav-button",String(i+1).padStart(2,"0")+"   /   "+p[1]);
    b.type="button";
    b.setAttribute("aria-pressed","false");
    navButtons.set(p[0],b);
    nav.append(b);
  });
  const detail=e("div","theater-detail");
  const detailKicker=e("span","theater-detail-kicker","SYSTEM / 00");
  const detailTitle=e("h4",null,"Complete robot");
  const detailCopy=e("p",null,def.intro);
  const evidenceTabs=e("div","theater-evidence-tabs");
  evidenceTabs.setAttribute("role","group");
  evidenceTabs.setAttribute("aria-label","Engineering explanation topics");
  const evidenceModes=[
    ["design","How it works"],
    ["cad","CAD source"],
    ["verification","Evidence"]
  ];
  const evidenceButtons=new Map();
  const evidenceView=e("p","theater-evidence-copy",def.intro);
  for(const [id,label] of evidenceModes){
    const button=e("button","theater-evidence-tab",label);
    button.type="button";
    button.setAttribute("aria-pressed",String(id==="design"));
    button.classList.toggle("is-current",id==="design");
    evidenceButtons.set(id,button);
    evidenceTabs.append(button);
  }
  const deeper=e("a","theater-read-more","Read the design notes ↗");
  deeper.href="#robot-explorer";
  detail.append(detailKicker,detailTitle,evidenceTabs,evidenceView,deeper);
  const actionPanel=e("div","theater-action-panel");
  const actionMeta=e("span",null,"Motion preview");
  const actionButton=e("button","theater-action-button",def.actionName);
  actionButton.type="button";
  const actionDisclaimer=e("p",null,"Drive paths, joint movement and game-piece motion are illustrative, not measured match data.");
  const aimControls=e("div","theater-aim-controls");
  const aimCaption=e("label","theater-aim-caption","Turret angle");
  const aimValue=e("output","theater-aim-value","0°");
  const aimInput=e("input","theater-aim-slider");
  aimInput.type="range";
  aimInput.min="-65";aimInput.max="65";aimInput.step="1";aimInput.value="0";
  aimInput.setAttribute("aria-label","Illustrative turret yaw angle in degrees");
  aimControls.append(aimCaption,aimValue,aimInput);
  aimControls.hidden=true;
  actionPanel.append(actionMeta,aimControls,actionButton,actionDisclaimer);
  actionPanel.hidden=true;
  side.append(sideHeader,nav,detail,actionPanel);
  shell.append(stage,side);
  host.replaceChildren(titleBand,shell);
  const footnote=e("p","theater-footnote",
    "3D previews are optimized directly from our original CAD. Select Original CAD for complete model detail. Game-piece motion is illustrative.");
  host.append(footnote);

  let mod=null,THREE=null,renderer=null,scene=null,camera=null,orbit=null,gltfLoader=null,studioEnv=null,floorShadow=null;
  let full=null,fullLoad=null,fullBounds=null,active=null;
  let fullIsOriginal=false, originalRequest=null;
  const subsystemCache=new Map(), subsystemLoading=new Map();
  let fullUrl=null,seq=0,visibility=true, destroyed=false,clock=0;
  let autoSpin=false, showHotspots=false, cameraTween=null, fades=[], action=null;
  let playbackRate=1;
  btnSlowDemo.addEventListener("click",()=>{
    if(!action)return;
    playbackRate=playbackRate===1?.5:1;
    btnSlowDemo.textContent=playbackRate===1?"Slow motion · ½×":"Normal speed · 1×";
    btnSlowDemo.setAttribute("aria-pressed",String(playbackRate!==1));
  });
  let explodeTargets=[],explodeT=0,explodeGoal=0;
  const clearExplodedInspection=()=>{
    for(const t of explodeTargets)t.node.position.copy(t.base);
    explodeTargets=[];explodeT=0;explodeGoal=0;
    btnExplode.disabled=true;
    btnExplode.textContent="Explode parts";
    btnExplode.setAttribute("aria-pressed","false");
  };
  const setupExplodedInspection=(item)=>{
    clearExplodedInspection();
    if(!THREE||!item?.group)return;
    let group=item.group,targets=[];
    const hasGeometry=obj=>{
      if(obj.isMesh)return true;
      let found=false;
      obj.traverse(node=>{if(node.isMesh)found=true;});
      return found;
    };
    for(let depth=0;depth<7;depth++){
      const present=group.children.filter(hasGeometry);
      if(present.length>=2 && present.length<=60){targets=present;break;}
      if(present.length!==1)break;
      group=present[0];
    }
    if(targets.length<2)return;
    const whole=new THREE.Box3().setFromObject(item.group);
    const center=whole.getCenter(new THREE.Vector3());
    const distance=Math.max(.04,Math.min(.16,whole.getSize(new THREE.Vector3()).length()*.11));
    group.updateMatrixWorld(true);
    explodeTargets=targets.map((node,i)=>{
      const partCenter=new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
      const worldDirection=partCenter.sub(center);
      if(worldDirection.lengthSq()<.0001)
        worldDirection.set(Math.cos(i*2.399),.35*Math.sin(i*.91),Math.sin(i*2.399));
      const parentRotation=new THREE.Quaternion();
      node.parent.getWorldQuaternion(parentRotation);
      const localDirection=worldDirection.normalize().applyQuaternion(parentRotation.invert());
      return {node,base:node.position.clone(),offset:localDirection.multiplyScalar(distance)};
    });
    btnExplode.disabled=false;
  };
  btnExplode.addEventListener("click",()=>{
    if(!active||action||!explodeTargets.length)return;
    explodeGoal=explodeGoal>.5?0:1;
    btnExplode.textContent=explodeGoal?"Assemble parts":"Explode parts";
    btnExplode.setAttribute("aria-pressed",String(!!explodeGoal));
  });
  let pickedMesh=null, pickedHelper=null, pickedBounds=null;
  let isolatedParts=[],partIsolation=false;
  let automaticDemoPlayed=false;
  let turretRig=null, turretGoal=0, turretTargetAngle=0, turretUserAdjusted=false;
  // Pivot measured from the 2026 turret's top mounting plate in Z-up CAD
  // coordinates, converted here to Three.js Y-up world space.
  const TURRET_PIVOT=[0,0.3048,-0.1841];
  let lastTime=0,stageSize={w:800,h:530};
  const hotspotsByKey=new Map();
  const cleanupObjects=[];
  const vectorFrom=(p)=>new THREE.Vector3(p[0],p[1],p[2]);
  const setMessage=(message,show=true)=>{
    loaderText.textContent=message;
    loader.hidden=!show;
  };
  // The inspector reads actual imported GLB names, not invented hardware labels.
  // Box3 is used for a graphic highlight only: no fabricated part dimensions.
  const clearPickedPart=()=>{
    for(const [mesh,wasVisible] of isolatedParts)mesh.visible=wasVisible;
    isolatedParts=[];partIsolation=false;
    partIsolate.textContent="Isolate selected geometry";
    if(pickedHelper){
      pickedHelper.parent?.remove(pickedHelper);
      pickedHelper.geometry?.dispose();
      pickedHelper.material?.dispose();
    }
    pickedHelper=null;pickedBounds=null;pickedMesh=null;
    partInspector.hidden=true;
  };
  const inspectPart=(mesh)=>{
    if(!mesh||!THREE)return;
    clearPickedPart();
    pickedMesh=mesh;
    pickedBounds=new THREE.Box3().setFromObject(mesh);
    pickedHelper=new THREE.Box3Helper(pickedBounds,0x9c2937);
    pickedHelper.name="CAD selection / visual guide";
    pickedHelper.renderOrder=999;
    scene.add(pickedHelper);
    const label=([mesh.name,mesh.parent?.name,mesh.geometry?.name]
      .find(value=>typeof value==='string'&&value.trim()&&!/^(mesh|node|scene)\d*$/i.test(value.trim()))||"Unnamed CAD mesh")
      .replace(/[<>]/g,"").slice(0,145);
    partTitle.textContent=label;
    partSource.textContent=fullIsOriginal
      ?"Selected geometry in the complete original CAD. Component identity comes from the model's imported labels."
      :"Selected geometry in the optimized original-CAD preview. Complete source geometry is available using Inspect original CAD.";
    partInspector.hidden=false;
  };
  partClose.addEventListener("click",clearPickedPart);
  partIsolate.addEventListener("click",()=>{
    if(!pickedMesh)return;
    if(partIsolation){
      for(const [mesh,visible] of isolatedParts)mesh.visible=visible;
      isolatedParts=[];partIsolation=false;
      partIsolate.textContent="Isolate selected geometry";
      return;
    }
    const root=active?.alpha>.5?active?.group:full?.group;
    if(!root)return;
    root.traverse(node=>{
      if(!node.isMesh||node===pickedMesh)return;
      isolatedParts.push([node,node.visible]);
      node.visible=false;
    });
    partIsolation=true;
    partIsolate.textContent="Show all geometry";
  });
  const onInspectKey=event=>{if(event.key==='Escape'&&!partInspector.hidden)clearPickedPart();};
  document.addEventListener("keydown",onInspectKey);
  cleanupObjects.push(()=>document.removeEventListener("keydown",onInspectKey));
  let evidenceMode="design";
  let detailSlug="full";
  const renderEvidence=()=>{
    evidenceButtons.forEach((btn,key)=>{
      btn.setAttribute("aria-pressed",String(evidenceMode===key));
      btn.classList.toggle("is-current",evidenceMode===key);
    });
    const key=detailSlug;
    const index=def.pieces.findIndex(part=>part[0]===key);
    const source=byId.get("robot-"+year+(key==="full"?"-assembly":"-"+key));
    const speed=source?.fastPreview;
    const part=index>=0?def.pieces[index]:null;
    if(evidenceMode==="design"){
      evidenceView.textContent=part?.[2] || def.intro;
      return;
    }
    if(evidenceMode==="cad"){
      const size=source?.bytes;
      const sizes=speed?.bytes && size
        ?("Optimized interactive geometry: "+(speed.bytes/1e6).toFixed(2)+" MB; original CAD: "+(size/1e6).toFixed(2)+" MB. ")
        :"";
      evidenceView.textContent=sizes+
        "Both models come from the team's CAD, but the fast version simplifies geometry. "+
        "Click a visible part to inspect its imported name. Use original CAD for precise visual details; these models do not establish manufacturing tolerances.";
      return;
    }
    const base=year==="2025"
      ?"Team-specific joint limits, materials, performance tests and mechanism timing have not been verified from a 2025 technical binder."
      :"The team design notes on this page provide context, but joint travel limits, measured shot statistics and calibration are not independently validated in this visualization.";
    const mechanics=key==="shooter"
      ?" The animated FUEL path uses ideal gravity-based kinematics; air drag and real shot variability are not modeled."
      :key==="claw"
      ?" The CORAL path is illustrative until claw-joint telemetry and a verified reef collision mesh are available."
      :" Only CAD geometry and documented design descriptions are shown as sourced evidence.";
    evidenceView.textContent=base+mechanics;
  };
  evidenceButtons.forEach((button,id)=>button.addEventListener("click",()=>{
    evidenceMode=id;
    renderEvidence();
  }));
  const selectNav=slug=>{
    fullNav.classList.toggle("is-selected",slug==="full");
    fullNav.setAttribute("aria-pressed",String(slug==="full"));
    navButtons.forEach((b,key)=>{
      const on=key===slug;
      b.classList.toggle("is-selected",on);
      b.setAttribute("aria-pressed",String(on));
    });
    btnFull.disabled=slug==="full";
    const index=def.pieces.findIndex(p=>p[0]===slug);
    if(index<0){
      detailKicker.textContent="SYSTEM / 00";
      detailTitle.textContent="Complete robot";
      detailCopy.textContent=def.intro;
      detailSlug="full";
      renderEvidence();
      sceneStep.textContent="Full robot";
      sceneTitle.textContent=def.name+" / Complete robot";
    }else{
      const p=def.pieces[index];
      detailKicker.textContent="SYSTEM / "+String(index+1).padStart(2,"0");
      detailTitle.textContent=p[1];
      detailCopy.textContent=p[2];
      detailSlug=slug;
      renderEvidence();
      sceneStep.textContent="Subsystem";
      sceneTitle.textContent=p[1];
    }
  };
  const cancelCamera=()=>{
    if(cameraTween){
      cameraTween.resolve();
      cameraTween=null;
    }
  };
  const applyFade=(item,alpha)=>{
    if(!item)return;
    alpha=clamp(alpha,0,1);
    item.alpha=alpha;
    item.group.visible=alpha>.006;
    for(const pair of item.materials){
      const m=pair.material;
      m.opacity=pair.base*alpha;
      const transparent=pair.transparent||alpha<.995;
      if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}
      m.depthWrite=alpha>.97&&!pair.transparent;
    }
  };
  const collectFade=(root)=>{
    const unique=new Map();
    root.traverse(node=>{
      if(!node.isMesh || !node.material)return;
      const cloneMat=mat=>{
        if(!mat)return mat;
        if(!unique.has(mat)){
          const clone=mat.clone();
          unique.set(mat,clone);
        }
        return unique.get(mat);
      };
      node.material=Array.isArray(node.material)?node.material.map(cloneMat):cloneMat(node.material);
      // Preserve frustum culling; large GLBs can contain hundreds of parts.
    });
    return {group:root,alpha:1,materials:[...unique.values()].map(m=>({material:m,base:m.opacity,transparent:m.transparent}))};
  };
  const cameraTo=(pos,target,duration=1100)=>{
    cancelCamera();
    if(reduced()||!duration){
      camera.position.copy(pos);orbit.target.copy(target);orbit.update();
      return Promise.resolve();
    }
    return new Promise(resolve=>{
      cameraTween={start:performance.now(),duration,
        fromP:camera.position.clone(),toP:pos.clone(),
        fromT:orbit.target.clone(),toT:target.clone(),resolve};
    });
  };
  const fadeTo=(item,value,duration=660)=>{
    if(!item)return Promise.resolve();
    if(reduced()||!duration){applyFade(item,value);return Promise.resolve();}
    fades=fades.filter(t=>{if(t.item===item){t.resolve();return false;}return true;});
    return new Promise(resolve=>{
      fades.push({item,from:item.alpha,to:value,start:performance.now(),duration,resolve});
    });
  };
  const homePose=()=>{
    const box=fullBounds;
    const center=box.getCenter(new THREE.Vector3());
    const extent=box.getSize(new THREE.Vector3()).length();
    return {target:center,position:center.clone().add(new THREE.Vector3(1.18,.86,1.5).normalize().multiplyScalar(Math.max(extent*1.22,1.6)))};
  };
  const focusPose=(item,wide=false)=>{
    const box=new THREE.Box3().setFromObject(item.group);
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const diameter=Math.max(size.length(),.3);
    const dir=new THREE.Vector3(1.15,.85,1.5).normalize();
    return {target:center,position:center.clone().add(dir.multiplyScalar(clamp(diameter*(wide?1.7:1.22),wide?1.3:.65,wide?3.9:2.5)))};
  };
  const setAllHotspots=()=>{
    if(!camera||!full)return;
    hotspotsByKey.forEach((el,key)=>{
      el.hidden=!showHotspots;
      if(!showHotspots)return;
      const item=subsystemCache.get(key);
      // A named subsystem's actual GLB bounding center is more reliable than
      // a generic camera target. Before it's loaded use its observed CAD bounds.
      let world;
      if(item)world=new THREE.Box3().setFromObject(item.group).getCenter(new THREE.Vector3());
      else{
        const hints={
          "2026":{drivetrain:[0,.035,0],intake:[0,.248,.217],hopper:[0,.273,.199],"feeder-queuer":[0,.206,0],turret:[-.049,.344,-.153],shooter:[0,.405,-.182],climber:[.263,.248,-.159],bumpers:[0,.06,0]},
          "2025":{drivetrain:[.248,.094,.356],elevator:[.248,.498,.225],carriage:[.305,.889,.375],claw:[.248,.99,.716],climber:[-.114,.298,.355],bumpers:[.248,.06,.356]}
        };
        world=vectorFrom(hints[year]?.[key]||[0,0,0]);
      }
      const clip=world.clone().project(camera);
      const visible=clip.z<1&&clip.z>-1&&clip.x>-1&&clip.x<1&&clip.y>-1&&clip.y<1;
      el.hidden=!visible;
      if(!visible)return;
      const i=def.pieces.findIndex(p=>p[0]===key);
      el.style.left=(50+clip.x*50+(i%3-1)*2.5)+"%";
      el.style.top=(50-clip.y*50+(i%2?2:-2))+"%";
    });
  };
  const configureScene=async()=>{
    if(scene)return;
    mod=await getEngine();
    THREE=mod.THREE;
    const {GLTFLoader,OrbitControls,RoomEnvironment}=mod;
    scene=new THREE.Scene();
    // High-key white CAD studio. The page background and lighting now agree.
    const ambient=new THREE.HemisphereLight(0xffffff,0xe7e3df,2.25);
    scene.add(ambient);
    const key=new THREE.DirectionalLight(0xffffff,3.5);
    key.position.set(3,6,7);scene.add(key);
    const fill=new THREE.DirectionalLight(0xf1f5ff,1.2);
    fill.position.set(-4,2,-5);scene.add(fill);

    const ground=new THREE.GridHelper(8,24,0xd3c4c5,0xe4e4e7);
    ground.position.y=-.10;
    ground.material.transparent=true;
    ground.material.opacity=.20;
    scene.add(ground);
    // A soft studio contact shadow adds physical depth without expensive
    // realtime shadow maps (important for large CAD scenes on mobile).
    const shadowCanvas=document.createElement("canvas");
    shadowCanvas.width=256;shadowCanvas.height=256;
    const shadowCtx=shadowCanvas.getContext("2d");
    if(shadowCtx){
      const gradient=shadowCtx.createRadialGradient(128,128,12,128,128,124);
      gradient.addColorStop(0,"rgba(45,42,45,.3)");
      gradient.addColorStop(.48,"rgba(57,54,58,.12)");
      gradient.addColorStop(1,"rgba(64,58,63,0)");
      shadowCtx.fillStyle=gradient;
      shadowCtx.fillRect(0,0,256,256);
      const texture=new THREE.CanvasTexture(shadowCanvas);
      floorShadow=new THREE.Mesh(
        new THREE.PlaneGeometry(1.95,1.95),
        new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,opacity:.86,side:THREE.DoubleSide})
      );
      floorShadow.rotation.x=-Math.PI/2;
      floorShadow.position.y=-.089;
      floorShadow.renderOrder=-1;
      scene.add(floorShadow);
    }
    // Keep the scene focused on real CAD geometry rather than decorative props.
    camera=new THREE.PerspectiveCamera(42,1,.025,150);
    camera.position.set(1.7,1.4,2.3);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
    // The visual benefit of 1.65 DPR is small compared with the fill-rate cost.
    const lowPower=/Mobi|Android/i.test(navigator.userAgent) || (navigator.deviceMemory||8)<=4;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,lowPower?1.15:1.35));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.AgXToneMapping || THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.12;
    renderer.setClearColor(0x000000,0);
    // PMREM studio environment gives metal and painted CAD surfaces real
    // image-based reflections instead of flat, unlit imported materials.
    try{
      const pmrem=new THREE.PMREMGenerator(renderer);
      const room=new RoomEnvironment();
      studioEnv=pmrem.fromScene(room,.03).texture;
      scene.environment=studioEnv;
      room.dispose();
      pmrem.dispose();
    }catch(err){console.warn("Studio reflections unavailable",err);}
    canvasHome.append(renderer.domElement);
    renderer.domElement.title="Tap or click real CAD geometry to inspect its imported part label";
    const picker=new THREE.Raycaster();
    const pointer=new THREE.Vector2();
    let down=null;
    renderer.domElement.addEventListener('pointerdown',event=>{
      down={x:event.clientX,y:event.clientY};
    },{passive:true});
    renderer.domElement.addEventListener('pointerup',event=>{
      if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7){down=null;return;}
      down=null;
      if(!full||destroyed)return;
      const rect=renderer.domElement.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      pointer.set(((event.clientX-rect.left)/rect.width)*2-1,
        -((event.clientY-rect.top)/rect.height)*2+1);
      picker.setFromCamera(pointer,camera);
      const root=active?.alpha>.5?active.group:full.group;
      const hit=picker.intersectObject(root,true).find(entry=>
        entry.object.isMesh && entry.object.visible &&
        entry.object.parent?.visible!==false);
      if(hit)inspectPart(hit.object);
    },{passive:true});
    orbit=new OrbitControls(camera,renderer.domElement);
    orbit.enableDamping=true;orbit.dampingFactor=.075;
    orbit.minDistance=.22;orbit.maxDistance=14;
    orbit.maxPolarAngle=Math.PI*.92;
    orbit.enablePan=true;
    orbit.addEventListener("start",()=>{
      cancelCamera();
      autoSpin=false;
      btnSpin.classList.remove("is-on");
      if(action)action._manualCamera=true;
    });
    gltfLoader=new GLTFLoader().setMeshoptDecoder(mod.MeshoptDecoder);
    const resize=()=>{
      if(!renderer||destroyed)return;
      const rect=viewport.getBoundingClientRect();
      stageSize.w=Math.max(rect.width,150);stageSize.h=Math.max(rect.height,150);
      camera.aspect=stageSize.w/stageSize.h;
      camera.updateProjectionMatrix();
      renderer.setSize(stageSize.w,stageSize.h,false);
    };
    if(window.ResizeObserver){
      const ro=new ResizeObserver(resize);ro.observe(viewport);cleanupObjects.push(()=>ro.disconnect());
    }else{
      window.addEventListener("resize",resize);
      cleanupObjects.push(()=>window.removeEventListener("resize",resize));
    }
    resize();
    const observer=new IntersectionObserver(entries=>{visibility=entries.some(x=>x.isIntersecting);},{threshold:.01});
    observer.observe(viewport);cleanupObjects.push(()=>observer.disconnect());
    let frames=0;
    let lastVisualFrame=-Infinity;
    let lastMeasuredFrame=0;
    const sampleFrameMs=[];
    const updatePerformanceReadout=now=>{
      if(!perfEnabled)return;
      if(lastMeasuredFrame && now-lastMeasuredFrame<180)
        sampleFrameMs.push(now-lastMeasuredFrame);
      lastMeasuredFrame=now;
      if(sampleFrameMs.length>120)sampleFrameMs.shift();
      if(sampleFrameMs.length<8 || ++frames%20!==0)return;
      const sorted=[...sampleFrameMs].sort((a,b)=>a-b);
      const med=sorted[Math.floor(sorted.length*.5)];
      const p95=sorted[Math.floor(sorted.length*.95)];
      const stats={
        year,avgFps:Math.round(1000/(sampleFrameMs.reduce((a,b)=>a+b,0)/sampleFrameMs.length)),
        medianMs:+med.toFixed(1),p95Ms:+p95.toFixed(1),
        drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
        geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
        pixelRatio:renderer.getPixelRatio()
      };
      window.__pairOfDicePerformance=window.__pairOfDicePerformance||{};
      window.__pairOfDicePerformance[year]=stats;
      perfHud.textContent=stats.avgFps+' FPS · p95 '+stats.p95Ms+' ms · '+
        stats.drawCalls+' calls · '+(stats.triangles/1000).toFixed(0)+'k triangles';
    };
    // QA has to render the real CAD on a CPU-only GitHub runner.
    // Slow its visual frames without affecting the interactive site.
    const qaSoftwareRenderer=new URLSearchParams(window.location.search).has("qa");
    const tick=now=>{
      if(destroyed||!host.isConnected){destroy();return;}
      requestAnimationFrame(tick);
      clock=now;
      // Animation promises must resolve even if the viewer is scrolled away
      // (especially when a mobile user taps a subsystem tab below the stage).
      if(cameraTween){
        const t=clamp((now-cameraTween.start)/cameraTween.duration,0,1);
        const c=ease(t);
        camera.position.lerpVectors(cameraTween.fromP,cameraTween.toP,c);
        orbit.target.lerpVectors(cameraTween.fromT,cameraTween.toT,c);
        if(t>=1){const done=cameraTween.resolve;cameraTween=null;done();}
      }
      fades=fades.filter(f=>{
        const t=clamp((now-f.start)/f.duration,0,1);
        applyFade(f.item,f.from+(f.to-f.from)*ease(t));
        if(t>=1){f.resolve();return false;}return true;
      });
      if(explodeTargets.length){
        const delta=clamp((now-lastTime)/1000,0,.06);
        explodeT+=(explodeGoal-explodeT)*Math.min(1,delta*7);
        const blend=ease(clamp(explodeT,0,1));
        for(const part of explodeTargets)
          part.node.position.copy(part.base).addScaledVector(part.offset,blend);
      }
      if(autoSpin && !cameraTween && !action){
        const delta=(now-lastTime)/1000;
        const a=Math.min(Math.max(delta,0),.06)*.12;
        const dir=camera.position.clone().sub(orbit.target).applyAxisAngle(new THREE.Vector3(0,1,0),a);
        camera.position.copy(orbit.target).add(dir);
      }
      if(action){
        // Keep a faulty animation from aborting the entire render loop.
        // Cleanup restores the original imported robot transforms.
        try{
          if(action._clock==null)action._clock=now;
          if(!action._paused)action._clock+=Math.min(Math.max(now-lastTime,0),80)*playbackRate;
          action.update(action._clock);
        }catch(err){
          console.error("Scoring playback interrupted:",err);
          stopAction();
          actionDisclaimer.textContent="Preview interrupted. The CAD is still available; select Watch to replay.";
          setMessage("",false);
        }
      } else if(turretRig){
        const dt=clamp((now-lastTime)/1000,0,.06);
        turretRig.rotation.y+=(turretGoal-turretRig.rotation.y)*Math.min(1,dt*7);
      }
      lastTime=now;
      orbit.update();
      if(!visibility)return;
      if(qaSoftwareRenderer&&now-lastVisualFrame<1600)return;
      if(pickedMesh&&pickedBounds&&!partInspector.hidden){
        pickedBounds.setFromObject(pickedMesh);
        pickedHelper?.updateMatrixWorld(true);
      }
      renderer.render(scene,camera);
      lastVisualFrame=now;
      updatePerformanceReadout(now);
      // Hotspots are hidden in the current design and should not project
      // dozens of meshes onto the screen 20 times a second.
      if(showHotspots && ++frames%4===0)setAllHotspots();
    };
    requestAnimationFrame(tick);
  };
  const makeGroup=(gltf)=>{
    const root=new THREE.Group();
    root.rotation.x=-Math.PI/2; // Onshape export is Z-up; Three.js is Y-up.
    root.add(gltf.scene);
    scene.add(root);
    root.updateMatrixWorld(true);
    return collectFade(root);
  };
  // The first interactive robot is always actual CAD geometry, but *not* the
  // multi-hundred-MB original when a validated fast GLB is available.
  const fetchOriginal=async()=>{
    let url=fullModel.file;
    let temporary=null;
    try{
      if(fullModel.packed){
        temporary=await loadPackedModel(fullModel,loaderText);
        url=temporary;
      }
      return await gltfLoader.loadAsync(url);
    }finally{if(temporary)URL.revokeObjectURL(temporary);}
  };
  const loadFull=async()=>{
    if(full)return full;
    if(fullLoad)return fullLoad;
    fullLoad=(async()=>{
      await configureScene();
      let gltf;
      if(fastSource){
        setMessage("OPENING FAST 3D ROBOT");
        try{
          gltf=await gltfLoader.loadAsync(fastSource);
          fullIsOriginal=false;
        }catch(error){
          console.warn("Fast CAD unavailable, preserving original fallback",error);
        }
      }
      if(!gltf){
        setMessage("LOADING ORIGINAL ROBOT CAD");
        gltf=await fetchOriginal();
        fullIsOriginal=true;
      }
      full=makeGroup(gltf);
      fullBounds=new THREE.Box3().setFromObject(full.group);
      if(floorShadow){
        const base=fullBounds.getCenter(new THREE.Vector3());
        floorShadow.position.set(base.x,-.089,base.z);
      }
      applyFade(full,1);
      const home=homePose();
      camera.position.copy(home.position);
      orbit.target.copy(home.target);
      orbit.update();
      // Render at least one real CAD frame before dissolving the poster.
      renderer.render(scene,camera);
      stage.classList.add("is-ready");
      btnFull.disabled=false;
      btnOriginal.disabled=fullIsOriginal;
      if(fullIsOriginal)btnOriginal.textContent="Original CAD ready";
      setMessage("",false);
      hotspotsByKey.forEach(el=>el.hidden=false);
      prefetchScoringSubsystem();
      return full;
    })().catch(err=>{
      fullLoad=null;
      setMessage("CAD unavailable: "+(err.message||err),true);
      throw err;
    });
    return fullLoad;
  };
  const loadOriginalDetail=async()=>{
    if(originalRequest||fullIsOriginal)return originalRequest;
    originalRequest=(async()=>{
      if(!full)await loadFull();
      if(destroyed||fullIsOriginal)return;
      if(selected!=="full"||action)return;
      btnOriginal.disabled=true;
      btnOriginal.textContent="Opening detailed CAD…";
      setMessage("PREPARING ORIGINAL CAD — FAST MODEL REMAINS VISIBLE");
      const gltf=await fetchOriginal();
      if(destroyed)return;
      clearPickedPart();
      const original=makeGroup(gltf);
      applyFade(original,0);
      const previous=full;
      await Promise.all([fadeTo(original,1,350),fadeTo(previous,0,350)]);
      if(destroyed)return;
      full=original;
      fullBounds=new THREE.Box3().setFromObject(full.group);
      scene.remove(previous.group);
      previous.group.traverse(obj=>{
        if(!obj.isMesh)return;
        obj.geometry?.dispose();
        if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());
        else obj.material?.dispose();
      });
      fullIsOriginal=true;
      btnOriginal.textContent="Original CAD ready";
      setMessage("",false);
    })().catch(error=>{
      setMessage("Original CAD unavailable. Fast 3D view remains usable.",true);
      btnOriginal.disabled=false;
      btnOriginal.textContent="Retry original CAD";
      console.warn("Original model upgrade failed:",error);
    }).finally(()=>{originalRequest=null;});
    return originalRequest;
  };
  // A low-cost part can be fetched quietly on hover/after initial robot paint.
  // Repeated hover and selection share exactly one promise and one GPU upload.
  const loadSubsystem=async(key,{quiet=false}={})=>{
    if(subsystemCache.has(key))return subsystemCache.get(key);
    if(subsystemLoading.has(key))return subsystemLoading.get(key);
    const model=byId.get("robot-"+year+"-"+key);
    if(!model)throw Error("No uploaded subsystem GLB: "+key);
    const task=(async()=>{
      await configureScene();
      if(!quiet)setMessage("PREPARING "+key.toUpperCase()+" 3D");
      let gltf;
      if(model.fastPreview?.file){
        try{gltf=await gltfLoader.loadAsync(model.fastPreview.file);}
        catch(error){console.warn("Subsystem optimized CAD fallback:",key,error);}
      }
      if(!gltf)gltf=await gltfLoader.loadAsync(model.file);
      if(destroyed)throw Error("Viewer closed");
      const item=makeGroup(gltf);
      applyFade(item,0);
      subsystemCache.set(key,item);
      if(!quiet)setMessage("",false);
      return item;
    })().finally(()=>subsystemLoading.delete(key));
    subsystemLoading.set(key,task);
    return task;
  };
  const shouldPrefetch=()=>{
    const network=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    return window.innerWidth>=1020 && !network?.saveData &&
      !['slow-2g','2g','3g'].includes(network?.effectiveType) &&
      (navigator.deviceMemory||8)>=6;
  };
  let backgroundPrefetchScheduled=false;
  const prefetchScoringSubsystem=()=>{
    if(backgroundPrefetchScheduled || !shouldPrefetch() || destroyed || !full)return;
    backgroundPrefetchScheduled=true;
    // The robot gets first GPU priority. A low-res mechanism is the *only*
    // automatic background detail fetch; other parts load on user intent.
    const trigger=()=>loadSubsystem(def.actionSubsystem,{quiet:true}).catch(()=>{});
    if('requestIdleCallback' in window)
      window.requestIdleCallback(trigger,{timeout:3200});
    else window.setTimeout(trigger,900);
  };
  // Bound GPU memory while readers explore multiple heavy CAD subsystems.
  // The full assembly stays resident so returning home is instantaneous.
  const trimCache=(protectedKey)=>{
    const maxCount=year==="2025"?3:4;
    if(subsystemCache.size<=maxCount)return;
    for(const [key,item] of subsystemCache){
      if(subsystemCache.size<=maxCount)break;
      if(key===protectedKey||item===active)continue;
      scene.remove(item.group);
      item.group.traverse(obj=>{
        if(!obj.isMesh)return;
        obj.geometry?.dispose();
        if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());
        else obj.material?.dispose();
      });
      subsystemCache.delete(key);
    }
  };
  const ensureTurretRig=()=>{
    if(year!=="2026"||!active||turretRig)return turretRig;
    const pivot=new THREE.Vector3(...TURRET_PIVOT);
    const rig=new THREE.Group();
    rig.name="Shooter yaw / turret mounting axis";
    rig.position.copy(pivot);
    scene.add(rig);
    scene.updateMatrixWorld(true);
    rig.attach(active.group);
    turretRig=rig;
    turretRig.rotation.y=turretGoal;
    return rig;
  };
  const releaseTurretRig=()=>{
    if(!turretRig||!scene)return;
    turretRig.rotation.y=0;
    turretRig.updateMatrixWorld(true);
    if(active?.group?.parent===turretRig)scene.attach(active.group);
    scene.remove(turretRig);
    turretRig=null;
    turretGoal=0;
    turretTargetAngle=0;
    turretUserAdjusted=false;
    aimInput.value="0";
    aimValue.textContent="0°";
  };
  const stopAction=()=>{
    if(!action)return;
    // Release the playback lock before cleanup so a failed CAD transform
    // cannot leave the button disabled or the robot stuck in motion mode.
    const completed=action;
    action=null;
    try{completed.clean();}
    catch(err){console.error("Robot scene cleanup:",err);}
    demoHud.hidden=true;
    btnPauseDemo.hidden=true;
    btnSlowDemo.hidden=true;
    playbackRate=1;
    btnSlowDemo.textContent="Slow motion · ½×";
    btnSlowDemo.setAttribute("aria-pressed","false");
    btnPauseDemo.textContent="Pause";
    btnPauseDemo.setAttribute("aria-pressed","false");
    setPhase(0);
    demoTitle.textContent=def.actionTitle;
    demoFill.style.width="0%";
    actionButton.disabled=false;
    actionButton.textContent=def.actionName;
    aimInput.disabled=false;
  };
  let selected="full";
  const showSelection=key=>{
    aimControls.hidden=year!=="2026"||key!=="shooter";
    // The scoring demo also works directly from the entire robot, avoiding
    // a second heavy GLB just to watch the driving/scoring story.
    actionPanel.hidden=!(key==="full"||key===def.actionSubsystem);
    selectNav(key);
    selected=key;
    btnOriginal.disabled=fullIsOriginal || key!=='full';
    btnExplode.disabled=key==='full'||!explodeTargets.length;
    showHotspots=false;
    stage.classList.toggle("is-isolated",key!=="full");
  };
  // Once geometry is resident, this is one continuous camera + alpha
  // interpolation (rather than three blocking, serial animation stages).
  const choose=async key=>{
    if(destroyed)return;
    const ticket=++seq;
    clearPickedPart();
    clearExplodedInspection();
    const navigationAt=performance.now();
    stopAction();
    clearScoringProps();
    if(turretRig && key!=='shooter')releaseTurretRig();
    selectNav(key);
    stage.dataset.selectionRequest=key;
    stage.classList.add('is-transitioning');
    if(!full){
      try{await loadFull();}
      catch{stage.classList.remove('is-transitioning');return;}
    }
    if(ticket!==seq)return;
    if(key==='full'){
      showHotspots=false;
      const target=homePose();
      const old=active;
      await Promise.all([
        cameraTo(target.position,target.target,540),
        fadeTo(full,1,460),
        old?fadeTo(old,0,390):Promise.resolve()
      ]);
      if(ticket!==seq)return;
      active=null;
      showSelection('full');
      stage.classList.remove('is-transitioning');
      stage.dataset.readySelection='full';
      if(SCORING_QA){
        window.__robotTheaterPerf=window.__robotTheaterPerf||[];
        window.__robotTheaterPerf.push({year,selection:'full',elapsedMs:performance.now()-navigationAt,cached:true});
      }
      return;
    }
    const old=active;
    const cached=subsystemCache.has(key);
    // Initiate immediately, even if a first-time network request is needed.
    const pending=loadSubsystem(key,{quiet:false});
    if(!cached){
      // Preserve spatial context while preparing this never-visited mechanism.
      // The full robot remains interactive instead of being replaced by a spinner.
      loader.classList.add('theater-nonblocking');
    }
    let next;
    try{next=await pending;}
    catch(err){
      if(ticket===seq){
        setMessage('Could not open '+key+' CAD: '+err.message,true);
        stage.classList.remove('is-transitioning');
      }
      return;
    }finally{loader.classList.remove('theater-nonblocking');}
    if(ticket!==seq)return;
    const focus=focusPose(next,false);
    showHotspots=false;
    active=next;
    const blend=Promise.all([
      cameraTo(focus.position,focus.target,560),
      fadeTo(full,.10,510),
      fadeTo(next,1,530),
      old&&old!==next?fadeTo(old,0,380):Promise.resolve()
    ]);
    await blend;
    if(ticket!==seq)return;
    setupExplodedInspection(next);
    showSelection(key);
    stage.classList.remove('is-transitioning');
    stage.dataset.readySelection=key;
    if(SCORING_QA){
      window.__robotTheaterPerf=window.__robotTheaterPerf||[];
      window.__robotTheaterPerf.push({year,selection:key,elapsedMs:performance.now()-navigationAt,cached});
    }
    if(year==='2026'&&key==='shooter')ensureTurretRig();
    trimCache(key);
    if(key===def.actionSubsystem&&!automaticDemoPlayed&&!reduced()&&
      !new URLSearchParams(window.location.search).has('qa')){
      automaticDemoPlayed=true;
      window.setTimeout(()=>{
        if(!destroyed&&selected===key&&!action)playAction();
      },450);
    }
  };
  // Construct believable game pieces as actual meshes inside the 3D scene.
  const makeFuel=()=>{
    const group=new THREE.Group();
    const shell=new THREE.Mesh(new THREE.SphereGeometry(.074,28,20),
      new THREE.MeshPhysicalMaterial({color:0xe4bd25,roughness:.63,metalness:0,clearcoat:.08}));
    group.add(shell);
    const seamMaterial=new THREE.MeshBasicMaterial({color:0x8d6a14,transparent:true,opacity:.45});
    const seam1=new THREE.Mesh(new THREE.TorusGeometry(.074,.0018,5,48),seamMaterial);
    const seam2=seam1.clone();seam2.rotation.x=Math.PI/2;
    group.add(seam1,seam2);
    scene.add(group);
    return group;
  };
  // REEFSCAPE CORAL: 11.875in x 4.5in foam-core PVC (outside diameter).
  // The mesh is a visibly hollow pipe, not a solid bar.
  const makeCoral=()=>{
    const group=new THREE.Group();
    const shell=new THREE.MeshStandardMaterial({color:0xf1eee4,roughness:.82,side:THREE.FrontSide});
    const inside=new THREE.MeshStandardMaterial({color:0xd8d5cd,roughness:.87,side:THREE.BackSide});
    const edge=new THREE.MeshStandardMaterial({color:0xe0ddd4,roughness:.83});
    group.add(
      new THREE.Mesh(new THREE.CylinderGeometry(.05715,.05715,.3016,40,1,true),shell),
      new THREE.Mesh(new THREE.CylinderGeometry(.0508,.0508,.3016,40,1,true),inside)
    );
    for(const y of [-.1508,.1508]){
      const rim=new THREE.Mesh(new THREE.RingGeometry(.0508,.05715,40),edge);
      rim.rotation.x=-Math.PI/2*(y<0?-1:1);
      rim.position.y=y;
      group.add(rim);
    }
    scene.add(group);
    return group;
  };
  // The official REBUILT HUB opening is a 1.06 m wide hexagon,
  // 1.83 m above the carpet. This reduced field prop preserves those sizes.
  const makeHub=(center)=>{
    const hub=new THREE.Group();
    hub.position.set(center.x,0,center.z);
    const rimMat=new THREE.MeshStandardMaterial({
      color:0x777e88,metalness:.43,roughness:.52,
      emissive:0x9b3541,emissiveIntensity:0
    });
    const postMat=new THREE.MeshStandardMaterial({color:0xb8bec4,metalness:.33,roughness:.65});
    const radius=1.06/Math.sqrt(3);
    const rimY=1.83, edgeCount=6;
    const corners=Array.from({length:edgeCount},(_,i)=>{
      const angle=(i/edgeCount)*Math.PI*2+Math.PI/6;
      return new THREE.Vector3(radius*Math.cos(angle),rimY,radius*Math.sin(angle));
    });
    const connect=(a,b,r,mat)=>{
      const vec=b.clone().sub(a);
      const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(r,r,vec.length(),10),mat);
      cylinder.position.copy(a).add(b).multiplyScalar(.5);
      cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());
      hub.add(cylinder);
    };
    corners.forEach((v,i)=>{
      connect(v,corners[(i+1)%edgeCount],.018,rimMat);
      connect(new THREE.Vector3(v.x,0,v.z),v,.012,postMat);
    });
    hub.userData.rimMaterial=rimMat;
    scene.add(hub);
    return hub;
  };
  // L3 REEF branches: ~1.21 m at the upper tip, tilted 35 degrees.
  // A two-post face gives the CORAL a real branch to slide over.
  const makeReefFace=(tip)=>{
    const face=new THREE.Group();
    const steel=new THREE.MeshStandardMaterial({color:0x9fa6aa,metalness:.5,roughness:.56});
    const accent=new THREE.MeshStandardMaterial({
      color:0x858e98,metalness:.4,roughness:.6,
      emissive:0x983c45,emissiveIntensity:0
    });
    const direction=new THREE.Vector3(0,Math.sin(35*Math.PI/180),-Math.cos(35*Math.PI/180));
    const tube=(a,b,r,material)=>{
      const axis=b.clone().sub(a);
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,axis.length(),18),material);
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());
      face.add(mesh);
    };
    const centerZ=tip.z+.30*Math.cos(35*Math.PI/180);
    const baseY=0;
    for(const lateral of [0,.33]){
      const x=tip.x+lateral;
      const stemZ=centerZ;
      tube(new THREE.Vector3(x,baseY,stemZ),
        new THREE.Vector3(x,1.55,stemZ),.022,steel);
      for(const upper of [.81,1.21]){
        const elbow=new THREE.Vector3(x,upper-.30*direction.y,stemZ);
        const branchEnd=elbow.clone().addScaledVector(direction,.30);
        tube(elbow,branchEnd,.018,accent);
      }
      // L4 branch: vertical top section (simplified to the near face).
      tube(new THREE.Vector3(x,1.55,stemZ),
        new THREE.Vector3(x,1.83,stemZ),.018,steel);
    }
    // The first L3 branch is directly opposite the robot's claw. Both
    // posts are spaced 33 cm, matching a real REEF face.
    const root=new THREE.Vector3(tip.x,tip.y-.30*direction.y,centerZ);
    scene.add(face);
    return {face,base:root,tip:tip.clone(),direction,accentMaterial:accent,
      seat:root.clone().addScaledVector(direction,.165)};
  };
  // Whole-robot choreography uses the full CAD assembly, not a miniature
  // proxy. A ground-level pivot moves the drivetrain and every mechanism
  // together. Named children are articulated and restored without changing
  // the source GLBs.
  // GLTFLoader sanitizes characters such as "<" and ">" in Onshape
  // assembly names (e.g. "Shooter <2>" becomes "Shooter__2_").
  // Compare normalized CAD identifiers instead of brittle exact labels.
  const canonicalCADName=name=>String(name||"").toLowerCase()
    .replace(/[^a-z0-9]/g,"");
  const findCADPart=(root,name)=>{
    const target=canonicalCADName(name);
    let match=null;
    root.traverse(node=>{
      if(!match && canonicalCADName(node.name)===target)match=node;
    });
    return match;
  };
  const stageRobot=()=>{
    if(!full?.group||!fullBounds)throw Error("Full robot CAD not loaded");
    const root=full.group;
    const home={
      position:root.position.clone(),
      quaternion:root.quaternion.clone(),
      scale:root.scale.clone()
    };
    const base=fullBounds.getCenter(new THREE.Vector3());
    base.y=0;
    const chassis=new THREE.Group();
    chassis.name="Whole robot - driving and turning";
    chassis.position.copy(base);
    scene.add(chassis);
    chassis.attach(root);
    const connections=[];
    const articulate=(names,pivot)=>{
      const nodes=names.map(name=>findCADPart(root,name)).filter(Boolean);
      if(!nodes.length)return null;
      chassis.updateMatrixWorld(true);
      const joint=new THREE.Group();
      joint.name=names.join(" / ")+" motion joint";
      chassis.add(joint);
      joint.position.copy(chassis.worldToLocal(pivot.clone()));
      joint.updateMatrixWorld(true);
      nodes.forEach(node=>{
        connections.push({
          node,parent:node.parent,position:node.position.clone(),
          quaternion:node.quaternion.clone(),scale:node.scale.clone()
        });
        joint.attach(node);
      });
      return joint;
    };
    const restore=()=>{
      chassis.position.copy(base);
      chassis.rotation.set(0,0,0);
      chassis.updateMatrixWorld(true);
      for(const link of connections){
        link.parent.add(link.node);
        link.node.position.copy(link.position);
        link.node.quaternion.copy(link.quaternion);
        link.node.scale.copy(link.scale);
      }
      scene.add(root);
      root.position.copy(home.position);
      root.quaternion.copy(home.quaternion);
      root.scale.copy(home.scale);
      scene.remove(chassis);
      root.updateMatrixWorld(true);
    };
    return {chassis,base,root,articulate,restore};
  };
  const resetStageShadow=()=>{
    if(!floorShadow||!fullBounds)return;
    const center=fullBounds.getCenter(new THREE.Vector3());
    floorShadow.position.set(center.x,-.089,center.z);
  };
  const removeProp=prop=>{
    if(!prop)return;
    scene.remove(prop);
    prop.traverse(node=>{
      node.geometry?.dispose();
      if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());
      else node.material?.dispose();
    });
  };
  const retainedScoringProps=[];
  const clearScoringProps=()=>{
    while(retainedScoringProps.length)removeProp(retainedScoringProps.pop());
  };
  const followRobot=(center,forward=.0)=>{
    if(!camera||!orbit)return;
    const aim=center.clone().add(new THREE.Vector3(0,.37,forward));
    const eye=aim.clone().add(new THREE.Vector3(2.35,1.63,2.9));
    // Lag deliberately behind the drive path so the robot visibly crosses
    // the workplane instead of remaining artificially locked to screen center.
    camera.position.lerp(eye,.015);
    orbit.target.lerp(aim,.016);
  };

  const runFuel=(requestedAim=0)=>{
    const motion=stageRobot();
    const shooter=findCADPart(motion.root,"Shooter <2>");
    if(!shooter){motion.restore();throw Error("2026 shooter missing from full CAD");}
    const turret=motion.articulate(["Turret <1>","Shooter <2>"],
      new THREE.Vector3(...TURRET_PIVOT));
    if(!turret){motion.restore();throw Error("2026 turret missing from full CAD");}
    const flywheels=[];
    shooter.traverse(node=>{
      if(node.isMesh&&/brass[\s_-]*wheels/i.test(node.name))
        flywheels.push({node,rotation:node.rotation.clone()});
    });

    // Geometric correction: the original animation fired TOWARD the +Y
    // source-coordinate guide rollers. The open shooter end is opposite them,
    // toward -Y on the source Z-up CAD, with a rising exit tangent.
    // This outlet is an illustrated point just outside that edge of the CAD.
    const muzzleCAD=new THREE.Vector3(0,.005,.422);
    const exitCAD=new THREE.Vector3(0,-1,1).normalize();
    const sampleMuzzle=()=>{
      shooter.updateWorldMatrix(true,false);
      const dir=exitCAD.clone().transformDirection(shooter.matrixWorld).normalize();
      const origin=muzzleCAD.clone().applyMatrix4(shooter.matrixWorld)
        .addScaledVector(dir,.095);
      return {origin,dir};
    };

    const finalChassisYaw=.14;
    const initialChassisYaw=-.47;
    const turretAim=clamp(Math.abs(requestedAim)>.01?requestedAim:.40,-1.12,1.12);
    const startOffset=new THREE.Vector3(-.53,0,.44);

    // The HUB is placed AHEAD of the exit, not on the feeder side. Gravity
    // determines the shot speed so its center clears the 1.83m rim and enters
    // descending. Radius 7.5cm FUEL, target center 1.96m (> rim+radius).
    motion.chassis.position.copy(motion.base);
    motion.chassis.rotation.y=finalChassisYaw;
    turret.rotation.y=turretAim;
    motion.chassis.updateMatrixWorld(true);
    const aligned=sampleMuzzle();
    const heading=new THREE.Vector3(aligned.dir.x,0,aligned.dir.z).normalize();
    const range=3.25;
    const hubCenter=aligned.origin.clone().addScaledVector(heading,range);
    hubCenter.y=1.83;
    const target=hubCenter.clone().setY(1.96);
    const pitch=Math.atan2(aligned.dir.y,Math.hypot(aligned.dir.x,aligned.dir.z));
    const planned=deriveBallisticShot(range,target.y-aligned.origin.y,pitch);
    if(SCORING_QA){
      const sourceFront=new THREE.Vector3(0,-1,0)
        .transformDirection(shooter.matrixWorld).setY(0).normalize();
      const exactVertical=aligned.origin.y+
        planned.speed*aligned.dir.y*planned.seconds-
        .5*SCORING_G*planned.seconds*planned.seconds;
      window.__robotScoringQA={
        type:"fuel",forwardAlignment:heading.dot(sourceFront),
        range,launchSpeed:planned.speed,seconds:planned.seconds,
        impactY:exactVertical,targetY:target.y,
        verticalAtTarget:planned.verticalAtTarget
      };
    }
    if(planned.verticalAtTarget>0.01){
      motion.restore();
      throw Error("Illustrated launch would reach the HUB while still ascending");
    }
    const hub=makeHub(hubCenter);

    motion.chassis.position.copy(motion.base).add(startOffset);
    motion.chassis.rotation.y=initialChassisYaw;
    turret.rotation.y=-.30;
    const balls=Array.from({length:3},makeFuel);
    balls.forEach(ball=>ball.visible=false);
    const shots=Array(3).fill(null);
    const shotTimes=[3260,4120,4980];
    const start=performance.now()+160,duration=7060;
    let prior=start,wheelAngle=0;
    demoTitle.textContent="RICOCHET / FUEL scoring";

    action={
      update(now){
        const elapsed=Math.max(0,now-start);
        const t=clamp(elapsed/duration,0,1);
        const dt=clamp((now-prior)/1000,0,.065);
        prior=now;

        const drive=ease(clamp(elapsed/1600,0,1));
        motion.chassis.position.copy(motion.base)
          .addScaledVector(startOffset,1-drive);
        if(floorShadow){
          floorShadow.position.x=motion.chassis.position.x;
          floorShadow.position.z=motion.chassis.position.z;
        }
        motion.chassis.rotation.y=initialChassisYaw+
          (finalChassisYaw-initialChassisYaw)*drive;
        const track=ease(clamp((elapsed-1460)/1090,0,1));
        turret.rotation.y=-.30+(turretAim+.30)*track;
        const deg=Math.round(turret.rotation.y*180/Math.PI);
        aimInput.value=String(deg);
        aimValue.textContent=deg+"°";

        const charged=ease(clamp((elapsed-1590)/760,0,1))*
          (1-ease(clamp((elapsed-5840)/760,0,1)));
        wheelAngle+=dt*37*charged;
        flywheels.forEach(({node,rotation})=>{
          node.rotation.copy(rotation);
          node.rotation.x+=wheelAngle;
        });

        balls.forEach((ball,i)=>{
          const timeFromLaunch=(elapsed-shotTimes[i])/1000;
          if(timeFromLaunch>=0&&!shots[i]){
            motion.chassis.updateMatrixWorld(true);
            const {origin,dir}=sampleMuzzle();
            const horizontalDistance=origin.distanceTo(
              new THREE.Vector3(target.x,origin.y,target.z));
            const launchPitch=Math.atan2(dir.y,Math.hypot(dir.x,dir.z));
            const flight=deriveBallisticShot(
              horizontalDistance,target.y-origin.y,launchPitch);
            shots[i]={origin,dir,speed:flight.speed,time:flight.seconds};
          }
          const shot=shots[i];
          if(!shot){ball.visible=false;return;}
          // Displayed at 78% physical speed so the ball can be followed.
          const physicalTime=timeFromLaunch*.78;
          ball.visible=physicalTime>=0&&
            physicalTime<=shot.time+.20;
          if(!ball.visible)return;
          ball.position.copy(shot.origin)
            .addScaledVector(shot.dir,shot.speed*physicalTime);
          ball.position.y-=.5*SCORING_G*physicalTime*physicalTime;
          ball.rotation.set(physicalTime*11,physicalTime*3,physicalTime*6);
        });

        const scored=shotTimes.some(time=>{
          const past=(elapsed-time)*.00078;
          return past>planned.seconds-.09&&past<planned.seconds+.13;
        });
        hub.userData.rimMaterial.emissiveIntensity=scored?.28:0;
        setPhase(elapsed<1630?0:elapsed<3030?1:elapsed<5930?2:3);
        demoStep.textContent=elapsed<1630?"Drive into position":
          elapsed<3030?"Turret faces the target":
          elapsed<5930?"FUEL follows a gravity arc":"Scoring complete";
        demoFill.style.width=(t*100).toFixed(1)+"%";

        const zoom=ease(clamp((elapsed-1600)/2250,0,1));
        const aim=motion.chassis.position.clone().lerp(hubCenter,.29+.10*zoom);
        aim.y=.83+.04*zoom;
        const eye=aim.clone().add(new THREE.Vector3(
          3.7-.55*zoom,2.60-.22*zoom,3.6+.12*zoom));
        if(elapsed>700&&!action._manualCamera){
          camera.position.lerp(eye,.023);
          orbit.target.lerp(aim,.024);
        }
        if(t>=1)completeAction();
      },
      clean(){
        flywheels.forEach(({node,rotation})=>node.rotation.copy(rotation));
        motion.restore();
        resetStageShadow();
        balls.forEach(removeProp);
        removeProp(hub);
        turretGoal=0;
        aimInput.value="0";
        aimValue.textContent="0°";
      }
    };
  };
  const runCoral=()=>{
    const motion=stageRobot();
    const claw=findCADPart(motion.root,"2025Claw <1>");
    if(!claw){motion.restore();throw Error("DEADPOOL claw is absent from CAD");}
    const gripLocal=claw.worldToLocal(
      new THREE.Box3().setFromObject(claw).getCenter(new THREE.Vector3())
        .add(new THREE.Vector3(0,0,.075))
    );
    const pivot=new THREE.Box3().setFromObject(claw)
      .getCenter(new THREE.Vector3());
    const lift=motion.articulate(["2025Carriage <1>","2025Claw <1>"],pivot);
    if(!lift){motion.restore();throw Error("DEADPOOL carriage joint is absent");}
    const liftHome=lift.position.clone();
    const startHeading=-.36,scoreHeading=.06;
    const approach=new THREE.Vector3(-.38,0,-.58);
    motion.chassis.position.copy(motion.base);
    motion.chassis.rotation.y=scoreHeading;
    lift.position.copy(liftHome);
    motion.chassis.updateMatrixWorld(true);
    const gripAtScore=claw.localToWorld(gripLocal.clone());

    // The target is a supported L3 pipe branch, not the small circular
    // openings in a decorative reef. Its 35° upward axis faces the robot.
    const branchTip=new THREE.Vector3(
      gripAtScore.x,1.21,gripAtScore.z+.27
    );
    const reef=makeReefFace(branchTip);
    const coral=makeCoral();
    const tubeRadius=.0508,branchRadius=.019,coralHalfLength=.3016/2;
    if(tubeRadius<=branchRadius)throw Error("CORAL cannot fit over branch");
    const direction=reef.direction.clone().normalize();
    const branchAngle=35*Math.PI/180;
    const inwardAcceleration=branchGravity(branchAngle,.26);
    const seatDistance=coralHalfLength+.012; // end sits against branch root
    const entranceDistance=.30+coralHalfLength*.56;
    const entrance=reef.base.clone().addScaledVector(direction,entranceDistance);
    const seat=reef.base.clone().addScaledVector(direction,seatDistance);

    motion.chassis.position.copy(motion.base).add(approach);
    motion.chassis.rotation.y=startHeading;
    lift.position.copy(liftHome).add(new THREE.Vector3(0,-.26,0));

    const horizontal=new THREE.Quaternion()
      .setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(1,0,0));
    const onBranch=new THREE.Quaternion()
      .setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
    const start=performance.now()+160,duration=8060;
    demoTitle.textContent="DEADPOOL / CORAL on L3";
    coral.visible=true;
    action={
      update(now){
        const elapsed=Math.max(0,now-start);
        const t=clamp(elapsed/duration,0,1);
        // Chassis first squares up to the reef; then the elevator extends.
        const drive=ease(clamp(elapsed/1960,0,1));
        motion.chassis.position.copy(motion.base)
          .addScaledVector(approach,1-drive);
        motion.chassis.rotation.y=startHeading+
          (scoreHeading-startHeading)*drive;
        if(floorShadow){
          floorShadow.position.x=motion.chassis.position.x;
          floorShadow.position.z=motion.chassis.position.z;
        }
        const rise=ease(clamp((elapsed-1980)/1740,0,1));
        const extend=ease(clamp((elapsed-3800)/760,0,1));
        const retract=ease(clamp((elapsed-6510)/920,0,1));
        lift.position.copy(liftHome);
        lift.position.y-=.26*(1-rise);
        lift.position.z+=.11*extend*(1-retract);
        lift.updateWorldMatrix(true,false);
        const grip=claw.localToWorld(gripLocal.clone());

        // A pipe is not a ball. It must first line up coaxially with the
        // 35° branch, then enter over the FREE END of that branch.
        const alignment=ease(clamp((elapsed-4710)/790,0,1));
        coral.quaternion.slerpQuaternions(horizontal,onBranch,alignment);
        if(elapsed<5500){
          coral.position.lerpVectors(grip,entrance,alignment);
        }else{
          // Tangential gravity pulls the 30cm CORAL toward the root.
          // Coulomb friction opposes sliding: a = g(sin35 - μcos35).
          // Once the tube reaches the root stop, contact constrains its
          // position; no falling through, no teleporting below the branch.
          const seconds=(elapsed-5500)*.00079; // 79% physical speed
          const travel=.08*seconds+.5*inwardAcceleration*seconds*seconds;
          const distance=Math.max(seatDistance,entranceDistance-travel);
          coral.position.copy(reef.base).addScaledVector(direction,distance);
          coral.quaternion.copy(onBranch);
        }

        // Let the robot back away while the tube remains ON its branch.
        const retreat=ease(clamp((elapsed-6890)/840,0,1));
        motion.chassis.position.z-=.14*retreat;
        const contact=ease(clamp((elapsed-5510)/830,0,1));
        reef.accentMaterial.emissiveIntensity=.20*contact*
          (1-ease(clamp((elapsed-6710)/620,0,1)));
        setPhase(elapsed<1960?0:elapsed<3900?1:elapsed<6410?2:3);
        demoStep.textContent=elapsed<1960?"Line up with reef":
          elapsed<3900?"Lift claw and CORAL":
          elapsed<6410?"Slide tube onto L3 branch":"Retract; CORAL stays seated";
        demoFill.style.width=(t*100).toFixed(1)+"%";

        const close=ease(clamp((elapsed-2140)/2630,0,1));
        const focal=motion.chassis.position.clone()
          .lerp(reef.tip,.32+.12*close);
        focal.y=.91+.09*close;
        const eye=focal.clone().add(new THREE.Vector3(
          2.90-.52*close,2.06-.34*close,3.13-.29*close));
        if(elapsed>620&&!action._manualCamera){
          camera.position.lerp(eye,.022);
          orbit.target.lerp(focal,.023);
        }
        if(t>=1)completeAction();
      },
      clean(){
        motion.restore();
        resetStageShadow();
        // Preserve the scored state after a successful run. If interrupted
        // midway, remove props immediately so a replay begins cleanly.
        if(this._completed){
          coral.position.copy(seat);
          coral.quaternion.copy(onBranch);
          retainedScoringProps.push(reef.face,coral);
          if(SCORING_QA){
            const sectionStart=seatDistance-.3016/2;
            const sectionEnd=seatDistance+.3016/2;
            const contactLength=Math.max(0,
              Math.min(.30,sectionEnd)-Math.max(0,sectionStart));
            window.__robotScoringQA={
              type:"coral",
              retainedProps:retainedScoringProps.length,
              centerError:coral.position.distanceTo(seat),
              alignment:Math.abs(coral.quaternion.dot(onBranch)),
              branchContactLength:contactLength,
              gravitySlide:inwardAcceleration
            };
          }
        }else{
          removeProp(coral);
          removeProp(reef.face);
        }
      }
    };
  };
  let preparingDemo=false;
  let demoReturnSelection="full";
  const completeAction=()=>{
    if(!action)return;
    action._completed=true;
    stopAction();
    if(destroyed)return;
    if(demoReturnSelection==="full"){
      // Give viewers time to see the CORAL remain supported on the branch,
      // instead of immediately zooming out and making it disappear.
      const ticket=seq;
      const leaveScene=()=>{
        if(destroyed||ticket!==seq)return;
        const home=homePose();
        Promise.all([
          cameraTo(home.position,home.target,900),
          fadeTo(full,1,550),
          fadeTo(active,0,450)
        ]).then(()=>{if(!destroyed&&ticket===seq)showSelection("full");});
      };
      if(year==="2025")setTimeout(leaveScene,1900);
      else leaveScene();
      return;
    }
    if(!active||selected!==def.actionSubsystem)return;
    // Return the camera to mechanism inspection after the whole-robot story.
    const ticket=seq;
    const focus=focusPose(active,false);
    Promise.all([
      cameraTo(focus.position,focus.target,760),
      fadeTo(full,.085,700),
      fadeTo(active,1,700)
    ]).then(()=>{
      if(ticket!==seq||destroyed)return;
      if(year==="2026")ensureTurretRig();
    });
  };
  const playAction=async()=>{
    if(destroyed||preparingDemo||action)return;
    preparingDemo=true;
    try{
      clearScoringProps();
      clearExplodedInspection();
      actionDisclaimer.textContent="Illustrative CAD motion using the original robot parts.";
      if(!full)await loadFull();
      // An overview playback uses only the complete assembly, dramatically
      // reducing peak GPU memory on mobile and avoiding unnecessary downloads.
      if(selected!=="full" && selected!==def.actionSubsystem)
        await choose(def.actionSubsystem);
      if(selected!=="full" && (!active||selected!==def.actionSubsystem))return;
      demoReturnSelection=selected;
      const ticket=seq;
      const requestedAim=year==="2026"
        ?Number(aimInput.value)*Math.PI/180:0;
      // The isolated 3D part becomes a complete moving machine. Restore any
      // isolated turret pivot before activating the same parts in full CAD.
      if(turretRig)releaseTurretRig();
      const home=homePose();
      const wideTarget=home.target.clone().add(
        new THREE.Vector3(0,.18,year==="2025"?.22:-.19)
      );
      const wideEye=wideTarget.clone().add(
        new THREE.Vector3(2.35,1.63,2.9)
      );
      await cameraTo(wideEye,wideTarget,reduced()?0:740);
      if(ticket!==seq||destroyed)return;
      demoHud.hidden=false;
      demoStep.textContent="Preparing the scoring run";
      demoFill.style.width="0%";
      actionButton.disabled=true;
      actionButton.textContent="Playing…";
      await Promise.all([
        fadeTo(full,1,reduced()?0:650),
        fadeTo(active,0,reduced()?0:520)
      ]);
      if(ticket!==seq||destroyed)return;
      // Let the full robot resolve into view before any driving or scoring.
      if(year==="2026")runFuel(requestedAim);
      else runCoral();
      btnPauseDemo.hidden=false;
      btnSlowDemo.hidden=false;
      playbackRate=1;
      btnSlowDemo.textContent="Slow motion · ½×";
      btnSlowDemo.setAttribute("aria-pressed","false");
      btnPauseDemo.textContent="Pause";
      btnPauseDemo.setAttribute("aria-pressed","false");
    }catch(error){
      console.error("Robot scoring demonstration failed:",error);
      if(action)stopAction();
      actionButton.disabled=false;
      actionButton.textContent=def.actionName;
      // Show the error beside the replay button, not as a blocking overlay.
      actionDisclaimer.textContent="Preview interrupted: "+error.message+". Select Watch to retry.";
      setMessage("",false);
      if(full)applyFade(full,1);
      if(active)applyFade(active,0);
    }finally{
      preparingDemo=false;
    }
  };
  const clearMeshes=()=>{
    if(!scene)return;
    scene.traverse(obj=>{
      if(!obj.isMesh)return;
      // Materials from model files and decorative scene items are disposed
      // once on teardown; texture lifetime is owned by the scene.
      obj.geometry?.dispose();
      if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());
      else obj.material?.dispose();
    });
  };
  const destroy=()=>{
    if(destroyed)return;
    destroyed=true;
    clearPickedPart();
    clearExplodedInspection();
    stopAction();
    clearScoringProps();
    releaseTurretRig();
    cancelCamera();
    fades.forEach(f=>f.resolve());fades=[];
    cleanupObjects.forEach(fn=>fn());
    if(fullUrl)URL.revokeObjectURL(fullUrl);
    orbit?.dispose();
    clearMeshes();
    studioEnv?.dispose();
    floorShadow?.material?.map?.dispose();
    renderer?.dispose();
  };

  btnOriginal.addEventListener("click",()=>loadOriginalDetail());
  launch.addEventListener("click",()=>choose("full"));
  fullNav.addEventListener("click",()=>choose("full"));
  btnFull.addEventListener("click",()=>choose("full"));
  navButtons.forEach((button,key)=>{
    button.addEventListener('click',()=>choose(key));
    // No preloading giant original CAD on mouse hover: only optimized parts.
    const warm=()=>{
      if(!destroyed&&full&&shouldPrefetch()&&byId.get('robot-'+year+'-'+key)?.fastPreview)
        loadSubsystem(key,{quiet:true}).catch(()=>{});
    };
    button.addEventListener('pointerenter',warm,{passive:true});
    button.addEventListener('focus',warm,{passive:true});
  });
  aimInput.addEventListener("input",()=>{
    if(year!=="2026"||selected!=="shooter"||action)return;
    turretUserAdjusted=true;
    turretGoal=Number(aimInput.value)*Math.PI/180;
    aimValue.value=aimInput.value+"°";
    aimValue.textContent=aimValue.value;
  });
  actionButton.addEventListener("click",()=>{
    automaticDemoPlayed=true;
    playAction();
  });
  btnReset.addEventListener("click",()=>{
    if(!camera)return;
    const item=selected==="full"?null:active;
    const goal=item?focusPose(item,false):homePose();
    cameraTo(goal.position,goal.target,650);
  });
  btnSpin.addEventListener("click",()=>{
    autoSpin=!autoSpin;
    btnSpin.classList.toggle("is-on",autoSpin);
    btnSpin.textContent=autoSpin?"Pause rotation":"Rotate";
  });
  btnExpand.addEventListener("click",()=>{
    if(document.fullscreenElement)document.exitFullscreen?.();
    else stage.requestFullscreen?.().catch(()=>{});
  });
  deeper.addEventListener("click",event=>{
    event.preventDefault();
    const synonyms={"shooter":"scoring mechanism","feeder-queuer":"feeder"};
    const name=synonyms[selected]||selected;
    const article=host.closest("article");
    if(!article)return;
    const headers=[...article.querySelectorAll("h2,h3")].filter(h=>!h.closest(".robot-theater"));
    const target=headers.find(h=>h.textContent.toLowerCase().startsWith(name));
    if(target)target.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"});
  });
  def.pieces.forEach((p,i)=>{
    const hotspot=e("button","theater-hotspot");
    hotspot.type="button";
    hotspot.hidden=true;
    hotspot.title=p[1];
    hotspot.setAttribute("aria-label","Focus "+p[1]);
    const bubble=e("span",null,String(i+1).padStart(2,"0"));
    const words=e("em",null,p[1]);
    hotspot.append(bubble,words);
    hotspot.addEventListener("click",()=>choose(p[0]));
    hotspots.append(hotspot);
    hotspotsByKey.set(p[0],hotspot);
  });
  const article=host.closest("article");
  if(article){
    article.querySelectorAll("[data-explore-system]").forEach(a=>{
      a.addEventListener("click",event=>{
        event.preventDefault();
        host.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"});
        choose(a.dataset.exploreSystem);
      });
    });
  }
  // On capable desktop connections, prepare the entire robot as the reader
  // scrolls to this section. Phones and data-saving connections retain a clear
  // opt-in button so a large assembly never silently consumes mobile data.
  if("IntersectionObserver" in window){
    const previewObserver=new IntersectionObserver(entries=>{
      if(!entries.some(x=>x.isIntersecting))return;
      previewObserver.disconnect();
      const network=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
      const constrained=network?.saveData||["slow-2g","2g","3g"].includes(network?.effectiveType);
      if(window.innerWidth>=980&&!constrained && fastSource)
        loadFull().catch(()=>{});
    },{rootMargin:"120px",threshold:.05});
    previewObserver.observe(host);
    cleanupObjects.push(()=>previewObserver.disconnect());
  }
  const observer=new MutationObserver(()=>{
    if(!host.isConnected){observer.disconnect();destroy();}
  });
  observer.observe(document.getElementById("content")||document.body,{childList:true,subtree:true});
  cleanupObjects.push(()=>observer.disconnect());
  selectNav("full");
}
window.PairOfDiceExplorer={mount};
})();
