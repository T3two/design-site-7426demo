const {chromium}=require('playwright');
const base='http://127.0.0.1:8765/';
const YEARS=['2026','2025','2024','2023','2022','2020','2019'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--use-gl=angle',
  '--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'
 ]});
 const report=[];
 try {
  for(const year of YEARS){
   const page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1});
   const requested=new Set(),errors=[];
   page.on('request',r=>{
    if(r.url().includes('models/'))requested.add(new URL(r.url()).pathname);
   });
   page.on('pageerror',e=>errors.push(String(e)));
   const start=Date.now();
   try{
    await page.goto(base+'?page=robot-'+year+'&qa=1',{waitUntil:'domcontentloaded',timeout:35000});
    if(year==='2026'||year==='2025'){
      await page.locator('.robot-theater .theater-launch').waitFor({timeout:18000});
      await page.locator('.robot-theater .theater-launch').evaluate(el=>el.click());
      await page.locator('.theater-stage.is-ready').waitFor({timeout:90000});
    }else{
      await page.locator('.model-card').first().waitFor({timeout:18000});
      await page.locator('.model-card').first().scrollIntoViewIfNeeded();
      await page.locator('.model-card.model-loaded').first().waitFor({timeout:90000});
    }
    const fast=[...requested].filter(x=>x.includes('/models/preview/')&&x.endsWith('.glb'));
    const packed=[...requested].filter(x=>x.includes('/models/packed/')||x.includes('/models/assemblies/')&&x.endsWith('.glb'));
    const ms=Date.now()-start;
    if(!fast.some(x=>x.includes(year+'-fast.glb')))throw Error('Fast CAD not used: '+JSON.stringify([...requested]));
    if(packed.length)throw Error('Heavy source CAD downloaded in default view: '+JSON.stringify(packed));
    if(errors.length)throw Error('Runtime errors: '+errors.join(' | '));
    const state=await page.evaluate(()=>({
      theater:!!document.querySelector('.theater-stage.is-ready'),
      card:!!document.querySelector('.model-card.model-loaded'),
      canvas:!!document.querySelector('.theater-canvas-home canvas,model-viewer'),
      original:!!document.querySelector('.theater-original-detail, .viewer-full-detail')
    }));
    if(!state.canvas)throw Error('No real 3D surface mounted');
    console.log('FAST_CAD_CHECK',JSON.stringify({year,ms,fast,packed,state}));
    report.push({year,ms,success:true,fast});
   }catch(e){
    console.error('FAST_CAD_FAILURE',year,e.stack);
    report.push({year,success:false,error:String(e)});
   }finally{await page.close();}
  }
 }finally{await browser.close();}
 console.log('FAST_CAD_SUMMARY',JSON.stringify(report));
 if(report.some(r=>!r.success))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
