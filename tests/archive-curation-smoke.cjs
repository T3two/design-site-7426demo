const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1360,height:900}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:8765/?page=robot-archive',{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('.robot-directory-item').first().waitFor({timeout:30000});
    const names=await page.locator('.robot-directory-item').allTextContents();
    if(names.length!==2||!names.some(s=>/2025.*DEADPOOL/s.test(s))||!names.some(s=>/2026.*RICOCHET/s.test(s)))
      throw Error('Archive needs only two documented teams: '+JSON.stringify(names));
    const nav=await page.locator('#navigation').innerText();
    if(!nav.includes('T-shirt Cannon'))throw Error('Offseason T-shirt Cannon link missing');
    if(/2019|2020|2022|2023|2024/.test(nav))throw Error('Underdocumented seasons still in navigation');
    const data=await page.evaluate(async()=>{
      const [c,robots]=await Promise.all([
        fetch('models/catalog.json').then(r=>r.json()),
        fetch('robots.json').then(r=>r.json())
      ]);
      return {catalog:c.models.map(x=>x.id),robots:robots.robots};
    });
    if(!data.catalog.includes('tshirt-cannon'))throw Error('T-shirt Cannon model missing');
    for(const id of ['robot-2026-assembly','robot-2025-assembly'])
      if(!data.catalog.includes(id))throw Error('Documented CAD missing '+id);
    if(data.catalog.some(id=>/^robot-(2019|2020|2022|2023|2024)-assembly$/.test(id)))
      throw Error('Old robot models remain visible in catalog');
    if(data.robots.length!==2||data.robots.some(x=>!['2025','2026'].includes(x.season)))
      throw Error('Public robot listings not curated');
    if(data.robots.some(x=>x.binderPdf))throw Error('Archive contains broken binder PDF link');
    await page.goto('http://127.0.0.1:8765/?page=robot-2025',{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('article').first().waitFor({timeout:30000});
    await page.waitForFunction(()=>document.querySelector('article')?.innerText.includes('Three-stage elevator'),null,{timeout:30000});
    const deadpool=await page.locator('article').first().innerText();
    for(const phrase of ['28 × 28-inch','SDS MK4i','24:1','48:1','NEO 550','2:1','20:1','25:1','Deadpool']){
      if(!deadpool.toLowerCase().includes(phrase.toLowerCase()))
        throw Error('2025 binder spec missing from DEADPOOL page: '+phrase);
    }
    if(/Verified engineering documentation pending/i.test(deadpool))
      throw Error('Old unverified placeholders still published');
    if(errors.length)throw Error('Page JS errors: '+errors.join(' | '));
    console.log('CURATED_ARCHIVE_PASS',JSON.stringify({robots:names.map(s=>s.trim()),catalogCount:data.catalog.length,offseason:true,deadpoolBinder:true}));
    await page.close();
  }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exit(1)});
