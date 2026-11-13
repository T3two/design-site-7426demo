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
    await page.goto(root+'?page=robot-'+year+'&qa=1&poster=1',{waitUntil:'domcontentloaded',timeout:35000});
    let element;
    if(year==='2026'||year==='2025'){
      // These two seasons use the immersive theater, not <model-viewer> cards.
      await page.locator('.robot-theater').waitFor({state:'attached',timeout:30000});
      // Desktop viewer may preload and dismiss the poster before we look for
      // the button. The screenshot generator must accept either ready state.
      const launch=page.locator('.theater-launch');
      if(!await page.locator('.theater-stage.is-ready').count() && await launch.isVisible())
        await launch.evaluate(el=>el.click());
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
    const file='models/preview/posters/'+year+'.jpg';
    // Export directly from the 3D renderer; composited page screenshots are
    // unreliable for WebGL and may include controls or miss the drawing buffer.
    let imageData;
    if(year==='2026'||year==='2025'){
      imageData=await page.evaluate(y=>window.__captureRobotPoster?.[y]?.(),year);
    }else{
      imageData=await element.evaluate(el=>{
        if(typeof el.toDataURL!=='function')throw Error('model-viewer missing toDataURL');
        return el.toDataURL('image/jpeg',.86);
      });
    }
    if(!/^data:image\/jpeg;base64,/.test(imageData||''))
      throw Error('Real 3D capture failed for '+year);
    fs.writeFileSync(file,Buffer.from(imageData.split(',')[1],'base64'));
    const size=fs.statSync(file).size;
    if(size<15000||size>800000)throw Error('Unexpected rendered image size '+size);
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
