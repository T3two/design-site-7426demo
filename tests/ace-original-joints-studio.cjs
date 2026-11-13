const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
      '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
  });
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
    const errors=[];page.on('pageerror',e=>errors.push(String(e.stack||e)));
    await page.goto('http://127.0.0.1:8765/ace-studio.html?aceqa=1',
      {waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.__aceStudioQA?.source==='ace_pointing.glb.gz',
      null,{timeout:60000});
    let qa=await page.evaluate(()=>window.__aceStudioQA);
    if(qa.joints!==18||qa.activeJoints<6)
      throw Error('Expected original rigged pointing Ace: '+JSON.stringify(qa));
    const head=page.locator('input[aria-label="Head nod"]');
    if(await head.count()!==1)throw Error('Missing head joint slider');
    await head.evaluate(el=>{el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}))});
    const sliderValue=await head.inputValue();
    if(sliderValue!=='20')throw Error('Head joint slider did not update');
    await page.locator('#add').click();
    const keys=await page.locator('#keylist button').count();
    if(keys<2)throw Error('Studio keyframes did not render');
    const [download]=await Promise.all([
      page.waitForEvent('download',{timeout:15000}),
      page.locator('#export').click()
    ]);
    if(!download.suggestedFilename().endsWith('.json'))
      throw Error('Animation export failed');
    await page.locator('#character').selectOption('seated');
    await page.waitForFunction(()=>window.__aceStudioQA?.source==='ace_seated.glb.gz',
      null,{timeout:60000});
    qa=await page.evaluate(()=>window.__aceStudioQA);
    if(qa.joints!==18||qa.activeJoints<6)
      throw Error('Expected original sunglasses Ace: '+JSON.stringify(qa));
    if(await page.locator('#status').textContent().then(t=>!t.includes('Sunglasses')))
      throw Error('Sunglasses pose not loaded');
    await page.locator('#character').selectOption('pointing');
    await page.waitForFunction(()=>window.__aceStudioQA?.source==='ace_pointing.glb.gz',
      null,{timeout:60000});
    const canvas=page.locator('#view canvas');
    const bounds=await canvas.boundingBox();
    if(!bounds||bounds.width<200||bounds.height<200)throw Error('Studio canvas invisible');
    if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
    require('fs').mkdirSync('test-results',{recursive:true});
    await page.screenshot({path:'test-results/ace-original-joints-studio.png'}).catch(()=>{});
    console.log('ACE_ORIGINAL_JOINTS_STUDIO_PASS',
      JSON.stringify({joints:qa.joints,activeJoints:qa.activeJoints,export:download.suggestedFilename()}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exit(1)});
