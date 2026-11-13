import { chromium } from "playwright";
import fs from "node:fs/promises";

const cases=[["2026","Shooter"],["2025","Claw"]];
await fs.mkdir("qa-results",{recursive:true});
const browser=await chromium.launch({
  headless:true,
  args:["--enable-webgl","--enable-unsafe-swiftshader","--use-angle=swiftshader","--disable-dev-shm-usage","--no-sandbox"]
});
let failures=0;
for(const [year,mechanism] of cases){
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const errors=[],messages=[];
  page.on("pageerror",error=>errors.push(error.stack||error.message));
  page.on("console",msg=>{if(msg.type()==="error")messages.push(msg.text());});
  page.on("requestfailed",req=>{messages.push("FAILED "+req.url()+" "+req.failure()?.errorText);});
  try{
    await page.goto("http://127.0.0.1:8080/?page=robot-"+year,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForSelector(".robot-theater .theater-launch",{timeout:35000});
    console.log("READY",year,await page.locator(".robot-theater").count());
    await page.locator(".robot-theater .theater-launch").evaluate(el=>el.click());
    await page.waitForFunction(()=>document.querySelector(".robot-theater .theater-stage")?.classList.contains("is-ready"),null,{timeout:150000});
    console.log("CAD_LOADED",year);
    await page.locator(".robot-theater .theater-nav-button").filter({hasText:mechanism}).first().evaluate(el=>el.click());
    await page.waitForFunction((name)=>!!document.querySelector(".robot-theater .theater-detail h4")?.textContent?.toLowerCase().includes(name.toLowerCase()),mechanism,{timeout:60000});
    // Allow the scripted isolation/transition and any automatic demo time.
    await page.waitForTimeout(5500);
    const action=page.locator(".robot-theater .theater-action-button");
    if(await action.isEnabled())await action.evaluate(el=>el.click());
    await page.waitForFunction(()=>{
      const b=document.querySelector(".robot-theater .theater-pause-motion");
      return b && !b.hidden;
    },null,{timeout:20000});
    // The newly added pause button must stop the scoring timeline, then
    // resume advancing without throwing errors.
    const pause=page.locator(".robot-theater .theater-pause-motion");
    await pause.evaluate(el=>el.click());
    const pausedWidth=await page.locator(".robot-theater .theater-demo-track span").evaluate(el=>parseFloat(el.style.width)||0);
    await page.waitForTimeout(650);
    const stillWidth=await page.locator(".robot-theater .theater-demo-track span").evaluate(el=>parseFloat(el.style.width)||0);
    console.log("PAUSE_CHECK",year,{pausedWidth,stillWidth});
    if(Math.abs(stillWidth-pausedWidth)>.4)throw Error("Pause failed: animation advanced "+(stillWidth-pausedWidth)+"%");
    await pause.evaluate(el=>el.click());
    await page.waitForTimeout(900);
    const resumedWidth=await page.locator(".robot-theater .theater-demo-track span").evaluate(el=>parseFloat(el.style.width)||0);
    console.log("RESUME_CHECK",year,{stillWidth,resumedWidth});
    if(resumedWidth<=stillWidth+.2)throw Error("Resume failed to advance playback");
    await page.waitForTimeout(750);
    const data=await page.evaluate(()=>({
      busy:document.querySelector(".robot-theater .theater-loading")?.hidden===false,
      message:document.querySelector(".robot-theater .theater-loading strong")?.textContent,
      demo:document.querySelector(".robot-theater .theater-demo-hud")?.hidden===false,
      actionLabel:document.querySelector(".robot-theater .theater-action-button")?.textContent,
      stageReady:document.querySelector(".robot-theater .theater-stage")?.classList.contains("is-ready")
    }));
    console.log("RESULT",year,JSON.stringify(data));
    await page.screenshot({path:"qa-results/"+year+"-action.png"});
    if(!data.stageReady||data.busy||(!data.demo&&data.actionLabel?.includes("Playing")))
      throw Error("Sequence unhealthy "+JSON.stringify(data));
    if(errors.length)throw Error("Uncaught errors "+errors.join(" | "));
    await page.waitForTimeout(7000);
    console.log("COMPLETE",year,JSON.stringify(await page.evaluate(()=>({
      label:document.querySelector(".robot-theater .theater-action-button")?.textContent,
      hidden:document.querySelector(".robot-theater .theater-demo-hud")?.hidden
    }))));
  }catch(e){
    failures++;
    console.error("FAILED_CASE",year,e.stack||e);
    try{await page.screenshot({path:"qa-results/"+year+"-failed.png"});}catch{}
  }finally{
    console.log("ERRORS",year,JSON.stringify(errors));
    console.log("CONSOLE_ERRORS",year,JSON.stringify(messages.slice(-15)));
    await page.close();
  }
}
await browser.close();
if(failures)process.exit(1);
