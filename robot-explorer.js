/* PAIR OF DICE | IMMERSIVE ROBOT THEATER
   A single Three.js WebGL scene for model, camera, highlighting and gamepiece
   animations. The moves are educational visualizations, not measured physics
   or kinematically verified robot mechanism animations. */
(() => {
"use strict";
const seasons={
  "2026":{
    name:"RICOCHET", season:"REBUILT", hero:"assets/document-image-2.png",
    intro:"Explore the assembled robot, zoom into real CAD subsystems, and watch an illustrative FUEL scoring sequence.",
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
    actionName:"Launch FUEL", actionSubsystem:"shooter", actionTitle:"FUEL / SCORING SEQUENCE"
  },
  "2025":{
    name:"DEADPOOL", season:"REEFSCAPE", hero:"",
    intro:"See the full 2025 robot, inspect its mechanisms, and watch an illustrative CORAL placement sequence.",
    pieces:[
      ["drivetrain","Drivetrain","View the full drive chassis independently. Detailed motor and gearing specifications remain to be verified."],
      ["elevator","Elevator","The upright mechanism positions the manipulator across different vertical levels."],
      ["carriage","Carriage","A moving mounting structure connecting the elevator with the scoring mechanism."],
      ["claw","Claw","The game-piece interface, isolated for close CAD inspection."],
      ["climber","Climber","A dedicated endgame mechanism separated from the main assembly."],
      ["bumpers","Bumpers","Chassis-protection geometry and structural mounting interfaces."]
    ],
    actionName:"Place CORAL",actionSubsystem:"claw",actionTitle:"CORAL / PLACEMENT SEQUENCE"
  }
};
const e=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
};
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      import("three/addons/environments/RoomEnvironment.js")
    ]).then(([THREE,loader,orbit,room])=>({
      THREE,GLTFLoader:loader.GLTFLoader,OrbitControls:orbit.OrbitControls,RoomEnvironment:room.RoomEnvironment
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
  demoHud.append(demoStep,demoTitle,demoTrack);
  viewport.append(canvasHome,graphic,poster,hotspots,hudTop,hudBottom,loader,demoHud);
  const controlsBar=e("div","theater-controls");
  const btnFull=e("button","theater-tool","← Full robot");
  const btnReset=e("button","theater-tool","Reset view");
  const btnSpin=e("button","theater-tool","Rotate");
  const btnExpand=e("button","theater-tool","Expand");
  [btnFull,btnReset,btnSpin,btnExpand].forEach(x=>x.type="button");
  btnFull.disabled=true;
  const controlNote=e("span","theater-controls-note","");
  controlsBar.append(btnFull,btnReset,btnExpand);
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
  const detailTitle=e("h4",null,"THE ENTIRE ROBOT");
  const detailCopy=e("p",null,def.intro);
  const deeper=e("a","theater-read-more","READ THE ENGINEERING CHAPTER ↗");
  deeper.href="#robot-explorer";
  detail.append(detailKicker,detailTitle,detailCopy,deeper);
  const actionPanel=e("div","theater-action-panel");
  const actionMeta=e("span",null,"Motion preview");
  const actionButton=e("button","theater-action-button",def.actionName);
  actionButton.type="button";
  const actionDisclaimer=e("p",null,"Illustrative motion. Angles and timing are not measured.");
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
    "Original CAD models. Game-piece paths and animated mechanism motion are illustrative.");
  host.append(footnote);

  let mod=null,THREE=null,renderer=null,scene=null,camera=null,orbit=null,gltfLoader=null,studioEnv=null;
  let full=null,fullLoad=null,fullBounds=null,active=null;
  const subsystemCache=new Map(), subsystemLoading=new Map();
  let fullUrl=null,seq=0,visibility=true, destroyed=false,clock=0;
  let autoSpin=false, showHotspots=false, cameraTween=null, fades=[], action=null;
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
      detailTitle.textContent="THE ENTIRE ROBOT";
      detailCopy.textContent=def.intro;
      sceneStep.textContent="Full robot";
      sceneTitle.textContent=def.name+" / COMPLETE ASSEMBLY";
    }else{
      const p=def.pieces[index];
      detailKicker.textContent="SYSTEM / "+String(index+1).padStart(2,"0");
      detailTitle.textContent=p[1].toUpperCase();
      detailCopy.textContent=p[2];
      sceneStep.textContent="Subsystem";
      sceneTitle.textContent=p[1].toUpperCase();
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
    ground.material.opacity=.32;
    scene.add(ground);
    // Keep the scene focused on real CAD geometry rather than decorative props.
    camera=new THREE.PerspectiveCamera(42,1,.025,150);
    camera.position.set(1.7,1.4,2.3);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
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
    orbit=new OrbitControls(camera,renderer.domElement);
    orbit.enableDamping=true;orbit.dampingFactor=.075;
    orbit.minDistance=.22;orbit.maxDistance=14;
    orbit.maxPolarAngle=Math.PI*.92;
    orbit.enablePan=true;
    orbit.addEventListener("start",()=>{cancelCamera();autoSpin=false;btnSpin.classList.remove("is-on");});
    gltfLoader=new GLTFLoader();
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
      if(autoSpin && !cameraTween && !action){
        const delta=(now-lastTime)/1000;
        const a=Math.min(Math.max(delta,0),.06)*.12;
        const dir=camera.position.clone().sub(orbit.target).applyAxisAngle(new THREE.Vector3(0,1,0),a);
        camera.position.copy(orbit.target).add(dir);
      }
      if(action)action.update(now);
      else if(turretRig){
        const dt=clamp((now-lastTime)/1000,0,.06);
        turretRig.rotation.y+=(turretGoal-turretRig.rotation.y)*Math.min(1,dt*7);
      }
      lastTime=now;
      orbit.update();
      if(!visibility)return;
      renderer.render(scene,camera);
      if(++frames%3===0)setAllHotspots();
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
  const loadFull=async()=>{
    if(full)return full;
    if(fullLoad)return fullLoad;
    fullLoad=(async()=>{
      await configureScene();
      setMessage("STREAMING FULL ROBOT CAD • "+(fullModel.packed?"ASSEMBLING PARTS":"LOADING"));
      let url=fullModel.file;
      if(fullModel.packed){
        url=await loadPackedModel(fullModel,loaderText);
        fullUrl=url;
      }
      const gltf=await gltfLoader.loadAsync(url);
      if(fullUrl){URL.revokeObjectURL(fullUrl);fullUrl=null;}
      full=makeGroup(gltf);
      fullBounds=new THREE.Box3().setFromObject(full.group);
      applyFade(full,1);
      const home=homePose();
      camera.position.copy(home.position);
      orbit.target.copy(home.target);
      orbit.update();
      stage.classList.add("is-ready");
      btnFull.disabled=false;
      setMessage("",false);
      hotspotsByKey.forEach(el=>el.hidden=false);
      return full;
    })().catch(err=>{
      fullLoad=null;
      setMessage("CAD unavailable: "+(err.message||err),true);
      throw err;
    });
    return fullLoad;
  };
  const loadSubsystem=async(key)=>{
    if(subsystemCache.has(key))return subsystemCache.get(key);
    if(subsystemLoading.has(key))return subsystemLoading.get(key);
    const model=byId.get("robot-"+year+"-"+key);
    if(!model)throw Error("No uploaded subsystem GLB: "+key);
    const task=(async()=>{
      setMessage("LOADING "+key.toUpperCase()+" CAD");
      const gltf=await gltfLoader.loadAsync(model.file);
      const item=makeGroup(gltf);
      applyFade(item,0);
      subsystemCache.set(key,item);
      setMessage("",false);
      return item;
    })().finally(()=>subsystemLoading.delete(key));
    subsystemLoading.set(key,task);
    return task;
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
    action.clean();
    action=null;
    demoHud.hidden=true;
    demoTitle.textContent=def.actionTitle;
    demoFill.style.width="0%";
    actionButton.disabled=false;
    actionButton.textContent=def.actionName;
    aimInput.disabled=false;
  };
  let selected="full";
  const showSelection=key=>{
    aimControls.hidden=year!=="2026"||key!=="shooter";
    actionPanel.hidden=key!==def.actionSubsystem;
    selectNav(key);
    selected=key;
    showHotspots=false;
    stage.classList.toggle("is-isolated",key!=="full");
  };
  const choose=async key=>{
    if(destroyed)return;
    const ticket=++seq;
    stopAction();
    if(turretRig && key!=="shooter") releaseTurretRig();
    selectNav(key);
    if(!full){
      try{await loadFull();}
      catch{return;}
    }
    if(ticket!==seq)return;
    if(key==="full"){
      showHotspots=false;
      const target=homePose();
      const previous=active;
      const promises=[cameraTo(target.position,target.target,1250),fadeTo(full,1,1050)];
      if(previous)promises.push(fadeTo(previous,0,850));
      await Promise.all(promises);
      if(ticket!==seq)return;
      active=null;
      showSelection("full");
      return;
    }
    const old=active;
    let next;
    try{next=await loadSubsystem(key);}
    catch(err){setMessage("Could not read "+key+" CAD: "+err.message,true);return;}
    if(ticket!==seq)return;
    showHotspots=false;
    if(old&&old!==next)await Promise.all([fadeTo(old,0,380),fadeTo(full,.83,440)]);
    if(ticket!==seq)return;
    const focus=focusPose(next,true);
    await Promise.all([cameraTo(focus.position,focus.target,880),fadeTo(full,.68,830)]);
    if(ticket!==seq)return;
    active=next;
    const close=focusPose(next,false);
    await Promise.all([
      cameraTo(close.position,close.target,850),
      fadeTo(full,.085,840),
      fadeTo(next,1,840)
    ]);
    if(ticket!==seq)return;
    showSelection(key);
    if(year==="2026"&&key==="shooter") ensureTurretRig();
    trimCache(key);
    // The first visit to the game's scoring mechanism brings the story to
    // life automatically. Playback remains optional with reduced motion.
    if(key===def.actionSubsystem&&!automaticDemoPlayed&&!reduced()){
      automaticDemoPlayed=true;
      setTimeout(()=>{
        if(!destroyed&&selected===key&&!action)playAction();
      },500);
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
  const makeCoral=()=>{
    const group=new THREE.Group();
    const ivory=new THREE.MeshPhysicalMaterial({color:0xf4f1e7,roughness:.48,metalness:0});
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,.30,32,1,true),ivory);
    group.add(tube);
    const ringMat=new THREE.MeshStandardMaterial({color:0xd9d9d4,roughness:.65});
    for(const y of [-.15,.15]){
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.051,.006,8,32),ringMat);
      rim.rotation.x=Math.PI/2;rim.position.y=y;group.add(rim);
    }
    group.rotation.z=Math.PI/2;
    scene.add(group);
    return group;
  };
  const makeTarget=(at,coral)=>{
    const group=new THREE.Group();
    if(coral){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.046,.065,.7,14),
        new THREE.MeshPhysicalMaterial({color:0xc6cac9,roughness:.55,metalness:.06,transparent:true,opacity:.83}));
      post.position.set(0,-.21,0);
      group.add(post);
      const branch=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.35,12),
        new THREE.MeshStandardMaterial({color:0xb5c0bd,metalness:.08,roughness:.6}));
      branch.rotation.z=-Math.PI/3;
      branch.position.set(.14,.1,0);
      group.add(branch);
    }else{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.25,.012,12,64),
        new THREE.MeshBasicMaterial({color:0xffcb59,transparent:true,opacity:.85}));
      ring.rotation.y=Math.PI/3;
      group.add(ring);
      const core=new THREE.Mesh(new THREE.CircleGeometry(.24,48),
        new THREE.MeshBasicMaterial({color:0xc83c49,transparent:true,opacity:.07,side:THREE.DoubleSide}));
      core.rotation.y=Math.PI/3;group.add(core);
    }
    group.position.copy(at);
    scene.add(group);
    return group;
  };
  const runFuel=()=>{
    if(!active||year!=="2026")return;
    const rig=ensureTurretRig();
    if(!rig)return;
    const shooter=active.group;
    const flywheels=[];
    shooter.traverse(node=>{
      if(node.isMesh&&/brass[\s_-]*wheels/i.test(node.name))
        flywheels.push({mesh:node,initial:node.rotation.clone()});
    });

    // Axis comes from the real 2026 Top Turret Plate CAD. Rotation angles
    // demonstrate the design intent, not a measured mechanical travel limit.
    const pivot=new THREE.Vector3(...TURRET_PIVOT);
    const initialYaw=rig.rotation.y;
    const aimAngle=turretUserAdjusted
      ? clamp(Number(aimInput.value)*Math.PI/180,-1.13,1.13)
      : .95;
    const searchAngle=clamp(aimAngle+(aimAngle>=0?-1.35:1.35),-1.13,1.13);
    const overshoot=clamp(aimAngle+Math.sign(aimAngle||1)*.13,-1.13,1.13);
    const centerAtCurrentYaw=new THREE.Box3().setFromObject(shooter).getCenter(new THREE.Vector3());
    const centerAtZero=centerAtCurrentYaw.clone().sub(pivot)
      .applyAxisAngle(new THREE.Vector3(0,1,0),-initialYaw).add(pivot);
    const aimPoint=p=>p.clone().sub(pivot)
      .applyAxisAngle(new THREE.Vector3(0,1,0),aimAngle).add(pivot);
    const start=aimPoint(centerAtZero.clone().add(new THREE.Vector3(.13,.055,-.105)));
    const end=start.clone().add(new THREE.Vector3(1.24,.90,-1.51)
      .applyAxisAngle(new THREE.Vector3(0,1,0),aimAngle));
    const path=new THREE.CubicBezierCurve3(
      start,
      start.clone().lerp(end,.33).add(new THREE.Vector3(0,.12,0)),
      start.clone().lerp(end,.68).add(new THREE.Vector3(0,.16,0)),
      end
    );
    const balls=Array.from({length:3},makeFuel);
    balls.forEach(ball=>ball.visible=false);
    const startTime=performance.now(),duration=5100;
    let previousTime=startTime,spin=0;
    aimInput.disabled=true;
    demoTitle.textContent="Turret tracking and FUEL launch";
    action={
      update(now){
        const elapsed=now-startTime;
        const t=clamp(elapsed/duration,0,1);
        const delta=clamp((now-previousTime)/1000,0,.06);
        previousTime=now;

        // A deliberate left/right aiming motion around the CAD turret axis.
        let yaw;
        if(elapsed<600)
          yaw=initialYaw+(searchAngle-initialYaw)*ease(clamp(elapsed/600,0,1));
        else if(elapsed<1370)
          yaw=searchAngle+(overshoot-searchAngle)*ease(clamp((elapsed-600)/770,0,1));
        else if(elapsed<1700)
          yaw=overshoot+(aimAngle-overshoot)*ease(clamp((elapsed-1370)/330,0,1));
        else yaw=aimAngle;
        rig.rotation.y=yaw;
        turretGoal=yaw;
        const degrees=Math.round(yaw*180/Math.PI);
        aimInput.value=String(degrees);
        aimValue.textContent=degrees+"°";

        // Spin the three actual Brass Wheels meshes independently of turret yaw.
        const throttle=ease(clamp(elapsed/950,0,1))*
          (1-ease(clamp((elapsed-4320)/720,0,1)));
        spin+=delta*36*throttle;
        flywheels.forEach(({mesh,initial})=>{
          mesh.rotation.copy(initial);
          mesh.rotation.x+=spin;
        });

        demoFill.style.width=(t*100).toFixed(1)+"%";
        demoStep.textContent=elapsed<1370?"Turret aiming":elapsed<1730?"Aligned":elapsed<4400?"Scoring FUEL":"Complete";
        balls.forEach((ball,i)=>{
          const progress=(elapsed-1730-i*710)/1240;
          ball.visible=progress>=0&&progress<=1;
          if(!ball.visible)return;
          ball.position.copy(path.getPoint(clamp(progress,0,1)));
          ball.rotation.set(progress*9,0,progress*6);
        });
        if(t>=1)stopAction();
      },
      clean(){
        flywheels.forEach(({mesh,initial})=>mesh.rotation.copy(initial));
        rig.rotation.y=aimAngle;
        turretGoal=aimAngle;
        aimInput.value=String(Math.round(aimAngle*180/Math.PI));
        aimValue.textContent=aimInput.value+"°";
        balls.forEach(ball=>{
          scene.remove(ball);
          ball.traverse(o=>{
            o.geometry?.dispose();
            if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());
            else o.material?.dispose();
          });
        });
      }
    };
  };
  const runCoral=()=>{
    const original=active.group.position.clone();
    const box=new THREE.Box3().setFromObject(active.group);
    const start=box.getCenter(new THREE.Vector3()).add(new THREE.Vector3(.08,.02,.04));
    const end=start.clone().add(new THREE.Vector3(.85,.27,-.72));
    const coral=makeCoral();
    const target=makeTarget(end.clone().add(new THREE.Vector3(.11,-.06,0)),true);
    const curve=new THREE.CatmullRomCurve3([
      start.clone().add(new THREE.Vector3(-.21,-.13,.12)),
      start,
      start.clone().lerp(end,.40).add(new THREE.Vector3(0,.36,0)),
      end.clone().add(new THREE.Vector3(-.13,.19,0)),
      end
    ]);
    const started=performance.now(),duration=5400;
    action={
      update(now){
        const t=clamp((now-started)/duration,0,1);
        demoFill.style.width=(t*100).toFixed(1)+"%";
        demoStep.textContent=t<.16?"01  /  ACQUIRE CORAL":t<.46?"02  /  LIFT & TRANSPORT":t<.77?"03  /  ALIGN WITH REEF":"04  /  PLACE & RETRACT";
        const travel=ease(clamp((t-.10)/.72,0,1));
        coral.visible=true;
        coral.position.copy(curve.getPoint(travel));
        coral.rotation.z=Math.PI/2-(Math.PI/4)*travel;
        // The isolated claw travels with the piece as a storyboard proxy.
        // This is not a verified joint/actuator motion path.
        // Carry the isolated claw beside the coral, then return it after
        // release. This is explicitly a choreographed visualization rather
        // than an actuator-accurate elevator trajectory.
        const carrying=t<.73?1:(1-ease(clamp((t-.73)/.25,0,1)));
        const offset=curve.getPoint(Math.min(travel,.92)).sub(start).multiplyScalar(carrying);
        active.group.position.copy(original).add(offset);
        if(t>=1)stopAction();
      },
      clean(){
        active?.group.position.copy(original);
        scene.remove(coral);scene.remove(target);
        for(const obj of [coral,target])obj.traverse(m=>{m.geometry?.dispose();if(m.material&&Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material?.dispose();});
      }
    };
  };
  const playAction=async()=>{
    if(!scene){
      try{await loadFull();}catch{return;}
    }
    if(selected!==def.actionSubsystem)await choose(def.actionSubsystem);
    if(!active||selected!==def.actionSubsystem)return;
    stopAction();
    const b=new THREE.Box3().setFromObject(active.group);
    const center=b.getCenter(new THREE.Vector3());
    const direction=new THREE.Vector3(1.45,.90,1.75).normalize();
    await cameraTo(center.clone().add(direction.multiplyScalar(year==="2026"?2.85:2.75)),center.clone().add(new THREE.Vector3(.25,.1,-.25)),650);
    demoHud.hidden=false;
    demoStep.textContent="00  /  SEQUENCE START";
    demoFill.style.width="0%";
    actionButton.disabled=true;
    actionButton.textContent="Playing…";
    if(year==="2026")runFuel();else runCoral();
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
    stopAction();
    releaseTurretRig();
    cancelCamera();
    fades.forEach(f=>f.resolve());fades=[];
    cleanupObjects.forEach(fn=>fn());
    if(fullUrl)URL.revokeObjectURL(fullUrl);
    orbit?.dispose();
    clearMeshes();
    studioEnv?.dispose();
    renderer?.dispose();
  };

  launch.addEventListener("click",()=>choose("full"));
  fullNav.addEventListener("click",()=>choose("full"));
  btnFull.addEventListener("click",()=>choose("full"));
  navButtons.forEach((button,key)=>button.addEventListener("click",()=>choose(key)));
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
      if(window.innerWidth>=980&&!constrained)loadFull().catch(()=>{});
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
