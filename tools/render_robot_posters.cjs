const {chromium}=require('playwright');
const fs=require('fs');
const root='http://127.0.0.1:8765/';
const years=['2026','2025','2024','2023','2022','2020','2019'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--use-gl=angle',
  '--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'
 ]});
 fs.mkdirSync('models/preview/posters',{recursive:true});
 const results=[];
 try {
  for(const year of years){
   const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(root+'?page=robot-'+year,{waitUntil:'domcontentloaded',timeout:35000});
    let element;
    if(year==='2026'||year==='2025'){
      // These two seasons use the immersive theater, not <model-viewer> cards.
      await page.locator('.theater-launch').waitFor({state:'visible',timeout:30000});
      await page.locator('.theater-launch').click();
      await page.locator('.theater-stage.is-ready').waitFor({timeout:90000});
      element=page.locator('.theater-canvas-home canvas').first();
    }else{
      const card=page.locator('.model-card').first();
      await card.waitFor({state:'visible',timeout:30000});
      await card.scrollIntoViewIfNeeded();
      await card.locator('.viewer-start').evaluate(el=>{if(el.offsetParent!==null)el.click();}).catch(()=>{});
      await page.locator('.model-card.model-loaded').first().waitFor({timeout:100000});
      element=card.locator('model-viewer');
    }
    await page.waitForTimeout(500);
    const file='models/preview/posters/'+year+'.jpg';
    await element.screenshot({path:file,type:'jpeg',quality:85,timeout:15000});
    const size=fs.statSync(file).size;
    if(size<3000||size>800000)throw Error('Unexpected rendered image size '+size);
    if(errors.length)console.log('NONFATAL_PAGE_NOTES',year,errors.slice(0,3));
    results.push({year,file,bytes:size});
    console.log('CAD_POSTER',JSON.stringify({year,file,bytes:size}));
   }finally{await page.close()}
  }
 }finally{await browser.close()}
 if(results.length!==years.length)throw Error('Not all posters rendered');
 fs.writeFileSync('models/preview/posters/README.md',
  '# Generated CAD poster images\n\nThese JPEGs were captured from the actual optimized FRC Team 7426 CAD in Chromium using tools/render_robot_posters.cjs. They are only lightweight first-frame fallbacks; real 3D remains the default.\n');
})().catch(e=>{console.error(e.stack);process.exit(1)});
