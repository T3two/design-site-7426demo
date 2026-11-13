const { chromium } = require('playwright');
const BASE='http://127.0.0.1:8765/';
async function verifyYear(browser,year,subsystem){
 const page=await browser.newPage({viewport:{width:1360,height:900},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 try{
  await page.goto(BASE+'?page=robot-'+year+'&qa=1&perf=1',{waitUntil:'domcontentloaded',timeout:35000});
  await page.locator('.theater-stage.is-ready').waitFor({timeout:80000});
  const stage=page.locator('.theater-stage');
  const sub=page.locator('.theater-nav-button').filter({hasText:new RegExp(subsystem,'i')}).first();
  if(!await sub.count())throw Error('Missing subsystem navigation: '+subsystem);
  // Hover preloads *only* the optimized mechanism; there is no original CAD request.
  await sub.hover();
  await page.waitForTimeout(1000);
  await sub.evaluate(el=>el.click());
  await page.waitForFunction(slug=>document.querySelector('.theater-stage')?.dataset.readySelection===slug,subsystem,{timeout:18000});
  const noteTabs=page.locator('.theater-evidence-tabs');
  await noteTabs.locator('button').filter({hasText:'CAD source'}).click();
  const cadText=await page.locator('.theater-evidence-copy').innerText();
  if(!/original CAD/i.test(cadText)||!/optimized interactive geometry/i.test(cadText))
    throw Error('CAD provenance is not connected to the selected subsystem: '+cadText);
  await noteTabs.locator('button').filter({hasText:'Evidence'}).click();
  const evidence=await page.locator('.theater-evidence-copy').innerText();
  if(!/not (independently )?validated|not been verified/i.test(evidence))
    throw Error('Evidence status is not transparent: '+evidence);
  await noteTabs.locator('button').filter({hasText:'How it works'}).click();
  await page.locator('.theater-nav-button').filter({hasText:/complete robot/i}).first().evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('.theater-stage')?.dataset.readySelection==='full',null,{timeout:18000});
  // This second selection should be resident in GPU memory.
  await sub.evaluate(el=>el.click());
  await page.waitForFunction(slug=>document.querySelector('.theater-stage')?.dataset.readySelection===slug,subsystem,{timeout:18000});
  const latest=await page.evaluate(()=>window.__robotTheaterPerf||[]);
  const repeated=latest.filter(e=>e.selection===subsystem).at(-1);
  if(!repeated || !repeated.cached || repeated.elapsedMs>1850)
    throw Error('Repeated transition is not responsive: '+JSON.stringify(latest));
  await page.locator('.theater-nav-button').filter({hasText:/complete robot/i}).first().evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('.theater-stage')?.dataset.readySelection==='full',null,{timeout:18000});
  const canvas=page.locator('.theater-canvas-home canvas');
  const box=await canvas.boundingBox();
  if(!box)throw Error('3D canvas not visible');
  let selected=false;
  for(const [fx,fy] of [[.50,.50],[.48,.43],[.53,.56],[.42,.55],[.58,.45]]){
    await page.mouse.click(box.x+box.width*fx,box.y+box.height*fy);
    selected=await page.locator('.theater-part-inspector:not([hidden])').count()>0;
    if(selected)break;
  }
  if(!selected)throw Error('CAD part selection by real raycast did not work');
  const name=await page.locator('.theater-part-name').innerText();
  await page.locator('.theater-part-isolate').click();
  if(!/Show all/i.test(await page.locator('.theater-part-isolate').innerText()))
    throw Error('Part visibility controls failed');
  await page.locator('.theater-part-isolate').click();
  await page.locator('.theater-part-close').click();
  if(await page.locator('.theater-part-inspector:not([hidden])').count())
    throw Error('Inspector did not close');
  if(errors.length)throw Error('Browser errors: '+errors.slice(0,5).join(' | '));
  console.log('CAD_INTERACTION_PASS',JSON.stringify({year,subsystem,repeatedTransitionMs:Math.round(repeated.elapsedMs),label:name,perf:await page.evaluate(y=>window.__pairOfDicePerformance?.[y]||null,year)}));
 }finally{await page.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 try{await verifyYear(browser,'2026','Shooter');await verifyYear(browser,'2025','Claw');}
 finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
