const {chromium}=require("playwright");
const fs=require("fs");
const path=require("path");
const base="http://127.0.0.1:8765/";
const log=[];
const time=()=>new Date().toISOString();
(async()=>{
  fs.mkdirSync("test-results",{recursive:true});
  const browser=await chromium.launch({
    headless:true,
    args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--ignore-gpu-blocklist","--disable-dev-shm-usage","--no-sandbox"]
  });
  try {
    for(const [year,label,part] of [["2026","RICOCHET","Shooter"],["2025","DEADPOOL","Claw"]]){
      const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
      const errors=[];
      page.on("pageerror",err=>{errors.push("pageerror: "+err.stack);console.error(time(),year,err.stack);});
      page.on("console",msg=>{
        if(msg.type()==="error"){
          errors.push("console: "+msg.text());
          console.error(time(),year,"CONSOLE",msg.text());
        }
      });
      page.on("requestfailed",req=>{
        const url=req.url();
        if(url.includes(".glb")||url.includes(".js"))
          errors.push("Request failed: "+url+" "+req.failure()?.errorText);
      });
      try{
        console.log(time(),year,"opening page");
        await page.goto(base+"?page=robot-"+year+"&qa=1",{waitUntil:"domcontentloaded",timeout:35000});
        const physics=Math.PI;
        const check=await page.evaluate(()=>{
          const motion=window.RobotScoringPhysics;
          if(!motion)return null;
          const gravity=motion.deriveBallisticShot(3.25,1.46,Math.PI/4);
          return {
            speed:gravity.speed,
            descending:gravity.verticalAtTarget<0,
            slide:motion.branchGravity(35*Math.PI/180,.26)
          };
        });
        if(!check||!check.descending||check.speed<=0||check.slide<=0)
          throw new Error("Gravity/branch physics calculation failed: "+JSON.stringify(check));
        await page.locator(".robot-theater .theater-launch").waitFor({timeout:35000});
        await page.locator(".robot-theater .theater-launch").evaluate(el=>el.click());
        await page.locator(".theater-stage.is-ready").waitFor({timeout:180000});
        console.log(time(),year,"full robot rendered");
        // Score straight from the full assembly; no duplicate subsystem GLB
        // should be required to enter the demonstration.
        await page.locator(".theater-action-panel:not([hidden])").waitFor({timeout:15000});
        await page.locator(".theater-action-button").evaluate(el=>el.click());
        await page.waitForTimeout(11600);
        const overviewState=await page.evaluate(()=>({
          busy:document.querySelector(".theater-loading")?.hidden===false,
          buttonDisabled:document.querySelector(".theater-action-button")?.disabled,
          sceneReady:document.querySelector(".theater-stage")?.classList.contains("is-ready")
        }));
        console.log(time(),year,"FULL ROBOT DEMO",JSON.stringify(overviewState));
        const physical=await page.evaluate(()=>window.__robotScoringQA);
        console.log(time(),year,"PHYSICAL SCORING",JSON.stringify(physical));
        if(!physical)throw new Error("Missing scoring geometry measurements");
        if(year==="2026"){
          if(physical.type!=="fuel"||physical.forwardAlignment<.97)
            throw new Error("Shooter fires opposite its forward CAD direction: "+JSON.stringify(physical));
          if(Math.abs(physical.impactY-physical.targetY)>.003||
             physical.verticalAtTarget>=0||
             physical.launchSpeed<1||physical.launchSpeed>20)
            throw new Error("FUEL failed gravity trajectory constraint: "+JSON.stringify(physical));
        }else{
          if(physical.type!=="coral"||physical.retainedProps!==2||
             physical.centerError>.002||physical.alignment<.999||
             physical.branchContactLength<.22||physical.gravitySlide<=0)
            throw new Error("CORAL did not remain supported on the reef branch: "+JSON.stringify(physical));
        }
        if(overviewState.busy||overviewState.buttonDisabled||!overviewState.sceneReady)
          throw new Error("Full robot direct demo unhealthy "+JSON.stringify(overviewState));
        await page.locator(".theater-nav-button").filter({hasText:part}).first().evaluate(el=>el.click());
        await page.locator(".theater-action-panel:not([hidden])").waitFor({timeout:90000});
        console.log(time(),year,"subsystem ready");
        await page.waitForTimeout(900);
        const button=page.locator(".theater-action-button");
        if(await button.isDisabled())await page.waitForTimeout(9000);
        await button.evaluate(el=>el.click());
        console.log(time(),year,"manual scoring started");
        await page.waitForTimeout(12000);
        const state=await page.evaluate(()=>{
          const b=document.querySelector(".theater-action-button");
          const l=document.querySelector(".theater-loading");
          const h=document.querySelector(".theater-demo-hud");
          return {
            ready:document.querySelector(".theater-stage")?.classList.contains("is-ready"),
            buttonDisabled:b?.disabled,buttonText:b?.textContent,
            loadingVisible:l?!l.hidden:null,loadingText:l?.textContent,
            demoVisible:h?!h.hidden:null,
            canvas:!!document.querySelector(".theater-canvas-home canvas")
          };
        });
        try{await page.screenshot({path:"test-results/"+year+"-after-demo.png",fullPage:false,timeout:5000});}catch(e){console.log("Screenshot not captured:",e.message.slice(0,90));}
        console.log(time(),year,"STATE",JSON.stringify(state));
        // Second invocation from the same isolated assembly tests cleanup
        // and restoration across repeated replay cycles.
        if(!state.buttonDisabled){
          await button.evaluate(el=>el.click());
          await page.waitForTimeout(12000);
          const replay=await page.evaluate(()=>({
            buttonDisabled:document.querySelector(".theater-action-button")?.disabled,
            loadingVisible:document.querySelector(".theater-loading")?.hidden===false,
            loadingText:document.querySelector(".theater-loading")?.textContent
          }));
          console.log(time(),year,"REPLAY",JSON.stringify(replay));
          if(replay.buttonDisabled||replay.loadingVisible)
            throw new Error("Second playback failed: "+JSON.stringify(replay));
        }
        if(!state.canvas||!state.ready)throw new Error("3D canvas/full robot absent");
        if(state.loadingVisible||/unable|error|could not|missing|failed/i.test(state.loadingText||""))
          throw new Error("Viewer error displayed: "+state.loadingText);
        if(state.buttonDisabled)throw new Error("Scoring demo did not finish/re-enable its button");
        if(errors.some(e=>/pageerror:|TypeError|ReferenceError|Request failed/.test(e)))
          throw new Error("Browser JS errors: "+errors.slice(0,10).join(" | "));
        log.push({year,success:true,state,errors:errors.slice(0,8)});
      }catch(error){
        await page.screenshot({path:"test-results/"+year+"-FAILED.png",fullPage:false}).catch(()=>{});
        const snapshot=await page.evaluate(()=>{
          const l=document.querySelector(".theater-loading");
          return {message:l?.textContent,visible:l&&!l.hidden,body:document.body?.innerText?.slice(-1500)};
        }).catch(()=>({}));
        console.error(time(),year,"FAILURE",error.stack,JSON.stringify(snapshot));
        log.push({year,success:false,error:String(error.stack),snapshot,errors});
      }finally{await page.close();}
    }
  }finally{await browser.close();}
  fs.writeFileSync("test-results/outcome.json",JSON.stringify(log,null,2));
  console.log("SMOKE SUMMARY",JSON.stringify(log.map(x=>({year:x.year,ok:x.success,error:x.error?.slice(0,300)}))));
  if(log.some(x=>!x.success))process.exit(1);
})().catch(e=>{console.error(e.stack);process.exit(1)});
