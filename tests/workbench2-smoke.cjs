const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
      '--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
  });
  try{
    const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e.stack||e)));
    await page.goto('http://127.0.0.1:8765/?page=robot-2026&qa=1',
      {waitUntil:'domcontentloaded',timeout:40000});
    await page.waitForFunction(()=>document.querySelector('.robot-theater')?.dataset.workbenchReady==='2',
      null,{timeout:50000});
    const nav=page.locator('.robot-theater .wb2-search');
    await nav.fill('shooter');
    const visible=await page.locator('.robot-theater .theater-nav-button:visible').allTextContents();
    if(!visible.some(t=>/shooter/i.test(t))||visible.some(t=>/intake/i.test(t)))
      throw Error('Subsystem search failed '+JSON.stringify(visible));
    await nav.fill('');
    const steps=page.locator('.wb2-milestone');
    if(await steps.count()!==3)throw Error('Missing 2026 design history');
    await steps.nth(1).click();
    if(!/prototyp/i.test(await page.locator('.wb2-history-note').innerText()))
      throw Error('Design history is not interactive');
    const launch=page.locator('.theater-launch');
    if(!await page.locator('.theater-stage.is-ready').count())
      await launch.evaluate(el=>el.click());
    await page.locator('.theater-stage.is-ready').waitFor({timeout:120000});
    // Desktop prefetch can make the CAD scene ready without a navigation event.
    // Explicitly settle the camera on the full assembly before raycast tests.
    await page.locator('.theater-nav-button').filter({hasText:/complete robot/i}).first()
      .evaluate(el=>el.click());
    await page.waitForFunction(()=>
      document.querySelector('.theater-stage')?.dataset.readySelection==='full',
      null,{timeout:30000});
    await page.waitForFunction(()=>
      !document.querySelector('.wb2-tool')?.disabled,null,{timeout:12000});
    const measure=page.locator('.wb2-tool').filter({hasText:'Measure'});
    const section=page.locator('.wb2-tool').filter({hasText:'Section view'});
    await measure.click();
    if(await measure.getAttribute('aria-pressed')!=='true')
      throw Error('Measure mode toggle failed');
    if(!await page.locator('.wb2-stage-panel').first().isVisible())
      throw Error('Measurement panel did not appear');
    // The toolbar can scroll a long document. Bring the entire CAD viewport
    // back into the visible browser window before selecting mesh coordinates.
    await page.locator('.theater-viewport').evaluate(el=>
      el.scrollIntoView({block:'center',behavior:'instant'}));
    await page.waitForTimeout(180);
    const canvas=page.locator('.theater-canvas-home canvas');
    const box=await canvas.boundingBox();
    if(!box||box.y+box.height/2<0||box.y+box.height/2>950)
      throw Error('CAD viewport not visible after scrolling '+JSON.stringify(box));
    const coords=[[.50,.50],[.48,.43],[.53,.56],[.42,.55],[.58,.45]];
    let picked=false;
    for(const [u,v] of coords){
      await page.mouse.click(box.x+box.width*u,box.y+box.height*v);
      const text=await page.locator('.wb2-stage-panel output').first().innerText();
      if(/first point set/i.test(text)){picked=true;break}
    }
    if(!picked){
      const state=await page.evaluate(()=>({
        ready:document.querySelector('.theater-stage')?.dataset.readySelection,
        active:document.querySelector('.wb2-tool')?.getAttribute('aria-pressed'),
        measurePanel:document.querySelector('.wb2-stage-panel output')?.textContent,
        model:document.querySelector('.robot-theater')?.dataset.workbenchReady,
        stageSize:document.querySelector('.theater-canvas-home canvas')?.getBoundingClientRect().toJSON()
      }));
      throw Error('Measurement did not hit the actual CAD '+JSON.stringify(state));
    }
    let done=false;
    for(const [u,v] of coords.slice().reverse()){
      await page.mouse.click(box.x+box.width*u,box.y+box.height*v);
      if(await page.locator('.wb2-stage-panel output').first().innerText().then(t=>/mm \/ .* in/.test(t))){done=true;break}
    }
    if(!done)throw Error('Two-point CAD measurement did not produce dimensional units');
    await section.click();
    if(await section.getAttribute('aria-pressed')!=='true'||
       await measure.getAttribute('aria-pressed')!=='false')
      throw Error('Section mode did not replace measurement mode');
    await page.locator('.wb2-axis').selectOption('x');
    await page.locator('.wb2-section-range').evaluate(el=>{
      el.value='34';el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    const readout=await page.locator('.wb2-section-panel output').innerText();
    if(!/34%.*X axis/i.test(readout))throw Error('Section plane controls broken '+readout);
    await section.click();
    const selected=page.locator('.theater-nav-button').filter({hasText:/intake/i}).first();
    await selected.evaluate(el=>el.click());
    await page.waitForFunction(()=>document.querySelector('.theater-stage')?.dataset.readySelection==='intake',
      null,{timeout:70000});
    const titles=await page.locator('.wb2-milestone').allTextContents();
    if(titles.length!==3)throw Error('Intake history stages missing');
    await page.locator('.wb2-milestone').last().click();
    if(!/dead.axle/i.test(await page.locator('.wb2-history-note').innerText()))
      throw Error('Intake revision history is disconnected from the documented binder');
    const tree=page.locator('.wb2-tree');
    // Search may already have expanded the details element. Do not close it.
    if(!await tree.evaluate(el=>el.open))
      await tree.locator('summary').click();
    await page.waitForFunction(()=>document.querySelector('.wb2-tree')?.open);
    await page.waitForTimeout(180);
    const treeStatus=await page.locator('.wb2-tree-hint').first().innerText();
    if(!/named CAD meshes|no named meshes/i.test(treeStatus))
      throw Error('Actual mesh assembly tree not populated '+treeStatus);
    if(errors.length)throw Error('Browser exceptions: '+errors.slice(0,4).join(' | '));
    require('fs').mkdirSync('test-results',{recursive:true});
    await page.screenshot({path:'test-results/workbench2-2026.png',timeout:15000}).catch(()=>{});
    console.log('WORKBENCH2_PASS',JSON.stringify({steps:titles,section:readout,tree:treeStatus}));
    await page.close();
  }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exit(1)});
