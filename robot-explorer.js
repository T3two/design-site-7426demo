/* Pair of Dice / Interactive Robot Workbench
   One full assembly + a replaceable isolated subsystem view.
   Camera crossfades are editorial transitions; mechanism motions are never invented. */
(function () {
  "use strict";
  const DATA = {
    "2026": {
      heading:"RICOCHET", game:"REBUILT", hero:"assets/document-image-2.png",
      intro:"Start with the assembled robot. Choose a subsystem to isolate it, inspect the real CAD, and see why the team made those decisions.",
      components:[
        ["drivetrain","Drivetrain","Swerve drive","SDS MK5N swerve modules, R3 reduction, four-inch wheels, and Kraken X60/X44 drive and steering motors. The 27 × 27-inch chassis sets the packaging envelope.","drivetrain"],
        ["intake","Intake","Collecting fuel","An over-bumper polycarbonate roller intake driven by a Kraken X60, with two pivot motors. Geometry, stability, and bearing retention were revised during testing.","intake"],
        ["hopper","Hopper","Adjustable storage","An extending hopper on drawer slides with added bearings reduces sliding friction. It retracts to fit under the trench while keeping fuel on board.","hopper"],
        ["feeder-queuer","Feeder / Queuer","Keeping fuel moving","Guide belts and internal transfer elements carry fuel from the hopper toward the scoring mechanism. Compact routing was a primary packaging constraint.","feeder"],
        ["turret","Turret","Independent aiming","The rotating turret gives the scoring assembly a separate aiming direction from the chassis. Three Limelight cameras support the team's field-awareness goals.","turret"],
        ["shooter","Shooter","Scoring design","A fixed 40.125° hood and high-inertia four-inch brass flywheel were chosen to simplify control and reduce speed variation. Feed-path refinements followed competition testing.","shooter"],
        ["climber","Climber","Endgame system","An extending climber packages the endgame mechanism into a compact arrangement. The design documentation describes a 30-inch extension and 45:1 gearing.","climber"],
        ["bumpers","Bumpers","Protection and access","A separate bumper assembly makes it easier to inspect the frame interface and service-focused mounting decisions.","bumpers"]
      ]
    },
    "2025": {
      heading:"REEFSCAPE",game:"REEFSCAPE",hero:"",
      intro:"Explore the complete 2025 assembly, then isolate the mechanism groups. These explanations identify what is visible in CAD; technical specifications still need team verification.",
      components:[
        ["drivetrain","Drivetrain","Robot foundation","The chassis and drive components are isolated here for closer inspection. The team's exact gearing and motor choices have not yet been documented on this site.","drivetrain"],
        ["elevator","Elevator","Vertical structure","This assembly shows the elevator structure and its packaging within the robot. The motion range is not asserted without the team's original engineering notes.","elevator"],
        ["carriage","Carriage","Manipulator interface","Inspect the carriage as a standalone structure to understand the mounting arrangement and how it fits with the elevator.","carriage"],
        ["claw","Claw","Game-piece interface","The claw is provided as a separate CAD assembly. Its shape and component placement can be examined without the other mechanisms.","claw"],
        ["climber","Climber","Endgame assembly","The climbing mechanism is shown separately. Operating sequence and mechanical specifications remain to be documented.","climber"],
        ["bumpers","Bumpers","Chassis protection","Isolate the bumper geometry to inspect the interface with the chassis and surrounding frame.","bumpers"]
      ]
    }
  };
  // Bounds measured from the uploaded GLBs (meters, Z-up). Their centers
  // are in the same robot coordinate frame as the complete CAD.
  const PART_BOUNDS = {
    "2026": {
      drivetrain:[[0,0,.0348],[.6985,.6985,.1585]],
      intake:[[0,-.2174,.2479],[.6985,.2857,.4957]],
      hopper:[[0,-.1986,.2727],[.6858,.3214,.4333]],
      "feeder-queuer":[[.0006,0,.2057],[.6923,.635,.4752]],
      turret:[[-.0486,.1528,.3437],[.4477,.3755,.3413]],
      shooter:[[-.0017,.1821,.4049],[.2832,.3224,.2002]],
      climber:[[.2627,.1588,.2484],[.1731,.3682,.4968]],
      bumpers:[[0,0,.0603],[.8668,.8699,.127]]
    },
    "2025": {
      drivetrain:[[.2477,-.3556,.0936],[.7239,.7239,.2763]],
      elevator:[[.2476,-.2252,.4983],[.5476,.2353,.9967]],
      carriage:[[.3047,-.3746,.889],[.232,.254,.1524]],
      claw:[[.2477,-.7162,.9903],[.5684,.5643,.2313]],
      climber:[[-.1145,-.3548,.2984],[.4251,.4714,.5969]],
      bumpers:[[.2476,-.3556,.0603],[.8922,.889,.127]]
    }
  };
  // Exported GLBs are Z-up. X-axis pitch -90 degrees makes them upright.
  // Camera targets use world Y-up, so source [x,y,z] becomes [x,z,-y].
  const pointFor=(year,system)=>{
    const bounds=PART_BOUNDS[String(year)]?.[system];
    const p=bounds?.[0] || [0,0,0];
    return [p[0],p[2],-p[1]];
  };
  const targetFor=point=>point.map(n=>Number(n).toFixed(4)+"m").join(" ");
  const radiusFor=(year,system)=>{
    const ext=PART_BOUNDS[String(year)]?.[system]?.[1] || [1,1,1];
    return Math.max(.58,Math.min(1.65,Math.max(...ext)*1.95));
  };
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  const make = (tag,cls,text) => {
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const reduce = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loadingElement= () => make("model-viewer","robot-workbench-model");

  function mount(root,year,models,loadPackedModel) {
    const config=DATA[String(year)];
    if(!config)return;
    const lookup=new Map(models.map(model=>[model.id,model]));
    const assembly=lookup.get("robot-"+year+"-assembly");
    if(!assembly)return;
    let isolated=null;
    let current="full";
    let seq=0;
    let fullReady=false;
    let fullBusy=false;
    let fullObjectUrl=null;
    let demoTimer=null;
    let fullPromise=null;
    let transitionBusy=false;

    root.className="robot-workbench";
    root.id="robot-explorer";
    root.dataset.year=String(year);
    const header=make("div","workbench-header");
    const heading=make("div","workbench-heading");
    heading.append(make("span","workbench-kicker","INTERACTIVE DESIGN BINDER / "+year),make("h2",null,config.heading+" / EXPLORE THE ROBOT"),make("p",null,config.intro));
    const legend=make("div","workbench-legend","01  ASSEMBLY   /   02  SUBSYSTEM   /   03  DESIGN NOTES");
    header.append(heading,legend);
    const shell=make("div","workbench-shell");
    const stage=make("div","workbench-stage");
    const scene=make("div","workbench-scene");
    const hero=make("div","workbench-hero");
    if(config.hero){
      const photo=make("img");
      photo.src=config.hero;
      photo.alt=config.heading+" full robot CAD";
      hero.append(photo);
    }else{
      hero.append(make("div","workbench-hero-type",config.heading));
    }
    const overlay=make("div","workbench-stage-cover");
    overlay.append(make("span","workbench-cover-kicker","FRC 7426 / "+year),make("strong",null,"See the robot in 3D"),make("p",null,"The full CAD is a larger download. Open it once, then move between isolated mechanisms."));
    const enter=make("button","workbench-primary","Explore complete assembly");
    enter.type="button";
    overlay.append(enter);
    const fullView=loadingElement();
    const isoView=loadingElement();
    [fullView,isoView].forEach(v=>{
      v.setAttribute("camera-controls","");
      v.setAttribute("touch-action","pan-y");
      v.setAttribute("tone-mapping","agx");
      v.setAttribute("environment-image","neutral");
      v.setAttribute("shadow-intensity","0.8");
      v.setAttribute("shadow-softness","0.9");
      v.setAttribute("exposure","1.1");
      v.setAttribute("interaction-prompt","none");
      v.setAttribute("camera-orbit","40deg 65deg auto");
      v.setAttribute("orientation","0deg -90deg 0deg");
      v.setAttribute("interpolation-decay","110");
      v.setAttribute("interaction-prompt-style","basic");
      v.setAttribute("loading","eager");
    });
    fullView.classList.add("full-view");
    isoView.classList.add("isolated-view");
    const state=make("div","workbench-loading");
    state.hidden=true;
    state.append(make("span","workbench-spin"),make("span","workbench-loading-label","Preparing 3D…"));
    const status=make("div","workbench-status");
    status.setAttribute("role","status");
    status.setAttribute("aria-live","polite");
    const stageTools=make("div","workbench-stage-tools");
    const back=make("button","workbench-back","← Entire robot");
    back.type="button";
    back.disabled=true;
    const reset=make("button","workbench-camera-reset","↺ Reset camera");
    reset.type="button";
    stageTools.append(back,reset);
    const demo=make("div","workbench-flow");
    demo.hidden=true;
    demo.setAttribute("aria-label","Illustrative fuel path animation");
    demo.append(make("div","workbench-flow-path"),make("span","workbench-flow-dot"),make("small",null,"Illustrative fuel path · not measured robot motion"));
    scene.append(hero,fullView,isoView,demo,state);
    stage.append(scene,stageTools,status,overlay);

    const right=make("aside","workbench-sidebar");
    const navTitle=make("div","workbench-nav-title");
    navTitle.append(make("strong",null,"Choose a system"),make("span",null,"Isolate the CAD"));
    const nav=make("div","workbench-nav");
    nav.setAttribute("role","group");
    nav.setAttribute("aria-label","Robot subsystems");
    const fullButton=make("button","workbench-system is-current","00  Full robot");
    fullButton.type="button";
    fullButton.dataset.system="full";
    fullButton.setAttribute("aria-pressed","true");
    nav.append(fullButton);
    const buttons=new Map();
    config.components.forEach((item,index)=>{
      const btn=make("button","workbench-system",String(index+1).padStart(2,"0")+"  "+item[1]);
      btn.type="button";
      btn.dataset.system=item[0];
      btn.setAttribute("aria-pressed","false");
      nav.append(btn);
      buttons.set(item[0],btn);
    });
    const detail=make("div","workbench-detail");
    const detailStep=make("span","workbench-detail-step","00 / OVERVIEW");
    const detailHeading=make("h3",null,"Complete assembly");
    const detailSub=make("span","workbench-detail-sub",config.game+" / ROBOT");
    const detailText=make("p",null,config.intro);
    const notes=make("a","workbench-deep-link","Read the full technical chapter ↗");
    notes.href="#robot-explorer";
    detail.append(detailStep,detailHeading,detailSub,detailText,notes);
    // Jump to the real chapter heading; the site's article outline assigns
    // numeric IDs after this workbench mounts, so don't rely on guessed hashes.
    notes.addEventListener("click",event=>{
      event.preventDefault();
      const aliases={shooter:"scoring mechanism", "feeder-queuer":"feeder", turret:"turret"};
      const key=aliases[current]||current;
      const article=root.closest("article");
      const headings=article?[...article.querySelectorAll("h2,h3")].filter(h=>!h.closest(".robot-workbench")):[];
      const target=headings.find(h=>h.textContent.trim().toLowerCase().startsWith(key));
      if(target)target.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
    });
    const demoButton=make("button","workbench-demo-button","▶ Show illustrative fuel flow");
    demoButton.type="button";
    demoButton.hidden=true;
    detail.append(demoButton);
    right.append(navTitle,nav,detail);
    shell.append(stage,right);
    const footnote=make("p","workbench-disclaimer","CAD views preserve the uploaded geometry. Switching to a subsystem isolates a separate assembly; this is a smooth visual transition, not a physical disassembly animation.");
    root.append(header,shell,footnote);

    const setActive = system => {
      [fullButton,...buttons.values()].forEach(btn=>{
        const active=btn.dataset.system===system;
        btn.classList.toggle("is-current",active);
        btn.setAttribute("aria-pressed",String(active));
      });
      back.disabled=system==="full";
    };
    const stopDemo=()=>{
      if(demoTimer)clearTimeout(demoTimer);
      demoTimer=null;
      demo.classList.remove("is-running");
      demo.hidden=true;
      demoButton.textContent="▶ Show illustrative fuel flow";
    };
    const updateDetail = (system)=>{
      stopDemo();
      if(system==="full"){
        detailStep.textContent="00 / OVERVIEW";
        detailHeading.textContent="Complete assembly";
        detailSub.textContent=config.game+" / ROBOT";
        detailText.textContent=config.intro;
        notes.href="#robot-explorer";
        demoButton.hidden=true;
      }else{
        const index=config.components.findIndex(item=>item[0]===system);
        const item=config.components[index];
        if(!item)return;
        detailStep.textContent=String(index+1).padStart(2,"0")+" / SUBSYSTEM";
        detailHeading.textContent=item[1];
        detailSub.textContent=item[2].toUpperCase();
        detailText.textContent=item[3];
        notes.href="#"+item[4];
        demoButton.hidden=!(year==="2026"&&["intake","hopper","feeder-queuer","shooter"].includes(system));
      }
    };
    demoButton.addEventListener("click",()=>{
      if(!demo.hidden){stopDemo();return;}
      demo.hidden=false;
      demo.classList.remove("is-running");
      void demo.offsetWidth;
      demo.classList.add("is-running");
      demoButton.textContent="Ⅱ Hide fuel-flow illustration";
      demoTimer=setTimeout(()=>{demo.classList.remove("is-running");demoTimer=null;},6500);
    });
    const showBusy=(message)=>{
      state.hidden=false;
      state.lastChild.textContent=message;
      status.textContent="";
    };
    const clearBusy=()=>{state.hidden=true;};
    const waitForModel=(viewer,timeoutMs=100000)=>new Promise((resolve,reject)=>{
      let timer=null;
      const finish=(err)=>{
        clearTimeout(timer);
        viewer.removeEventListener("load",good);
        viewer.removeEventListener("error",bad);
        if(err)reject(err);else resolve();
      };
      const good=()=>finish();
      const bad=()=>finish(new Error("3D renderer could not display this GLB."));
      viewer.addEventListener("load",good,{once:true});
      viewer.addEventListener("error",bad,{once:true});
      timer=setTimeout(()=>finish(new Error("CAD load timed out. Try a desktop browser.")),timeoutMs);
    });
    const ensureElement=async()=>{
      if(customElements.get("model-viewer"))return;
      await Promise.race([customElements.whenDefined("model-viewer"),new Promise((_,reject)=>setTimeout(()=>reject(new Error("3D viewer library unavailable.")),12000))]);
    };
    // Load the complete CAD once. Keep it in memory when browsing subassemblies.
    const ensureFull=()=>{
      if(fullReady)return Promise.resolve();
      if(fullPromise)return fullPromise;
      fullBusy=true;
      fullPromise=(async()=>{
        await ensureElement();
        const url=assembly.packed
          ? await loadPackedModel(assembly,state.lastChild)
          : assembly.file;
        if(assembly.packed)fullObjectUrl=url;
        const waiting=waitForModel(fullView);
        fullView.src=url;
        await waiting;
        fullReady=true;
        fullView.cameraOrbit="40deg 65deg auto";
        fullView.cameraTarget="auto auto auto";
      })().finally(()=>{
        fullBusy=false;
        if(!fullReady)fullPromise=null;
      });
      return fullPromise;
    };

    // The selected mechanism occupies its original location in the complete
    // robot coordinate system. Dolly toward that real 3D point before fading.
    const focusCamera=(viewer,system,near=false)=>{
      const point=pointFor(year,system);
      viewer.cameraTarget=targetFor(point);
      const radius=radiusFor(year,system)*(near?.80:1.22);
      viewer.cameraOrbit="40deg 63deg "+radius.toFixed(3)+"m";
    };

    const revealFull=()=>{
      overlay.hidden=true;
      root.classList.add("show-full");
      root.classList.remove("show-isolated");
      clearBusy();
    };

    const openFull=async()=>{
      const token=++seq;
      const from=current;
      current="full";
      setActive("full");
      updateDetail("full");
      stopDemo();
      if(!fullReady){
        showBusy("Preparing full robot CAD…");
        try{
          await ensureFull();
          if(token!==seq)return;
          revealFull();
          status.textContent="Drag to rotate · scroll or pinch to zoom";
        }catch(error){
          if(token!==seq)return;
          clearBusy();
          status.textContent="Unable to open CAD: "+error.message;
          overlay.querySelector("p").textContent="The complete model could not load: "+error.message;
          enter.textContent="Retry complete assembly";
          overlay.hidden=false;
        }
        return;
      }
      if(from==="full"){revealFull();return;}
      // Returning to the entire robot: match the isolated camera first, fade
      // the parent assembly back in, then pull the camera out to its overview.
      const sameOrbit=isoView.getCameraOrbit?.();
      if(sameOrbit){
        fullView.cameraOrbit=[sameOrbit.theta+"rad",sameOrbit.phi+"rad",sameOrbit.radius+"m"].join(" ");
        const point=pointFor(year,from);
        fullView.cameraTarget=targetFor(point);
        fullView.jumpCameraToGoal?.();
      }
      root.classList.remove("is-transitioning");
      root.classList.add("is-returning");
      revealFull();
      status.textContent="Returning to the complete robot…";
      if(!reduce())await delay(650);
      if(token!==seq)return;
      fullView.cameraTarget="auto auto auto";
      fullView.cameraOrbit="40deg 65deg auto";
      if(!reduce())await delay(1100);
      if(token!==seq)return;
      root.classList.remove("is-returning");
      status.textContent="Drag to rotate · scroll or pinch to zoom";
    };

    const openSubsystem=async(system)=>{
      const item=config.components.find(row=>row[0]===system);
      if(!item)return;
      const model=lookup.get("robot-"+year+"-"+system);
      if(!model){
        status.textContent="This subsystem CAD is not yet available.";
        return;
      }
      const token=++seq;
      const from=current;
      current=system;
      setActive(system);
      updateDetail(system);
      overlay.hidden=true;
      stopDemo();

      // For the first selection, materialize the full assembly before
      // isolating anything. This avoids an abrupt jump from a blank stage.
      if(!fullReady){
        showBusy("Preparing complete robot for transition…");
        try{
          await ensureFull();
          if(token!==seq)return;
          revealFull();
          await delay(reduce()?0:300);
        }catch(error){
          if(token!==seq)return;
          clearBusy();
          status.textContent="Unable to open the full robot: "+error.message;
          overlay.hidden=false;
          return;
        }
      }

      if(token!==seq)return;
      root.classList.remove("is-returning");
      // When selecting another subsystem, restore a wide view first: visitors
      // see where the new mechanism sits on the robot.
      if(from!=="full" && from!==system){
        root.classList.add("show-full");
        root.classList.remove("show-isolated");
        fullView.cameraTarget="auto auto auto";
        fullView.cameraOrbit="40deg 65deg auto";
        if(!reduce())await delay(700);
      }

      if(token!==seq)return;
      status.textContent="Locating "+item[1].toLowerCase()+" in the full robot…";
      root.classList.add("is-transitioning");
      const focus=pointFor(year,system);
      const firstOrbit="40deg 63deg "+(radiusFor(year,system)*1.22).toFixed(3)+"m";
      // Simultaneously download the isolated asset while the camera moves.
      let fetchError=null;
      const isolation=(async()=>{
        await ensureElement();
        const waiting=waitForModel(isoView);
        isoView.src=model.file;
        await waiting;
      })().catch(err=>{fetchError=err;});
      if(!reduce()){
        focusCamera(fullView,system,false);
        await delay(1100);
      }else{
        fullView.cameraTarget=targetFor(focus);
        fullView.cameraOrbit=firstOrbit;
        fullView.jumpCameraToGoal?.();
      }

      await isolation;
      if(token!==seq)return;
      if(fetchError){
        root.classList.remove("is-transitioning");
        fullView.cameraTarget="auto auto auto";
        fullView.cameraOrbit="40deg 65deg auto";
        status.textContent="Could not isolate "+item[1]+": "+fetchError.message;
        return;
      }
      // Both canvases now look at exactly the same world-space location, with
      // identical camera pose. The fade makes the surrounding robot disappear
      // while the selected assembly stays visually anchored.
      isoView.cameraTarget=targetFor(focus);
      isoView.cameraOrbit=firstOrbit;
      isoView.jumpCameraToGoal?.();
      root.classList.add("show-isolated");
      root.classList.remove("show-full");
      status.textContent=item[1]+" / isolating assembly";
      if(!reduce())await delay(860);
      if(token!==seq)return;
      focusCamera(isoView,system,true);
      if(!reduce())await delay(650);
      if(token!==seq)return;
      root.classList.remove("is-transitioning");
      status.textContent=item[1]+" isolated · drag to explore";
    };
    enter.addEventListener("click",openFull);
    back.addEventListener("click",openFull);
    fullButton.addEventListener("click",openFull);
    buttons.forEach((btn,system)=>btn.addEventListener("click",()=>openSubsystem(system)));
    reset.addEventListener("click",()=>{
      const viewer=current==="full"?fullView:isoView;
      if(current==="full"){
        viewer.cameraOrbit="40deg 65deg auto";
        viewer.cameraTarget="auto auto auto";
      }else{
        focusCamera(viewer,current,true);
      }
      if(viewer.jumpCameraToGoal)viewer.jumpCameraToGoal();
    });
    // The reader may jump from a written section straight to the corresponding CAD.
    const article=root.closest("article");
    if(article){
      article.querySelectorAll("[data-explore-system]").forEach(link=>{
        link.addEventListener("click",event=>{
          event.preventDefault();
          root.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
          openSubsystem(link.dataset.exploreSystem);
        });
      });
    }
    // Never retain packed blob URLs if readers navigate away from this page.
    const observer=new MutationObserver(()=>{
      if(!root.isConnected){
        stopDemo();
        seq++;
        if(fullObjectUrl)URL.revokeObjectURL(fullObjectUrl);
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById("content")||document.body,{childList:true,subtree:true});
  }
  window.PairOfDiceExplorer={mount};
})();
