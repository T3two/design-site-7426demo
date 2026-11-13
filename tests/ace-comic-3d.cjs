const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
    '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  await page.goto('http://127.0.0.1:8765/?page=home',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('.welcome-art--ace.ace3d-live').length===2,null,{timeout:60000});
  const metrics=await page.evaluate(()=>({
   live:[...document.querySelectorAll('.welcome-art--ace.ace3d-live')].length,
   rendered:[...document.querySelectorAll('.ace-3d-canvas')].map(c=>({width:c.width,height:c.height})),
   hasPosters:[...document.querySelectorAll('.ace-3d-poster')].every(i=>i.complete&&i.naturalWidth>0)
  }));
  if(metrics.live!==2||metrics.rendered.some(c=>!c.width||!c.height)||!metrics.hasPosters)
   throw Error('Ace canvas/transition missing: '+JSON.stringify(metrics));
  if(errors.length)throw Error('Ace runtime errors: '+errors.join(' | '));
  const fs=require('fs');fs.mkdirSync('test-results',{recursive:true});
  await page.screenshot({path:'test-results/ace-comic-live.png',fullPage:false}).catch(()=>{});
  console.log('ACE_COMIC_3D_PASS',JSON.stringify(metrics));
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
