import assert from 'node:assert/strict';
import {readFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const model=readFileSync('assets/welcome/ace_7426_cute_web.glb');
assert.equal(model.subarray(0,4).toString(),'glTF');
assert.equal(createHash('sha256').update(model).digest('hex'),
  '0a5c445d7d5f0b8e5db15634e38592b6e13e385961fe4e5555735324b6a47aa9');
assert.deepEqual(model,readFileSync('assets/welcome/ace_7426_web.glb'));
const jsonLength=model.readUInt32LE(12);
const gltf=JSON.parse(model.subarray(20,20+jsonLength).toString());
assert.equal(gltf.skins[0].joints.length,46);
assert.equal(gltf.animations.length,7);

const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],
  {stdio:'ignore'});
let browser;
try {
  let ready=false;
  for(let n=0;n<70;n++){
    try{const response=await fetch('http://127.0.0.1:8765/');if(response.ok){ready=true;break}}catch{}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  assert.ok(ready,'Local website did not start');
  browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
  ]});
  const page=await browser.newPage({viewport:{width:1400,height:900},deviceScaleFactor:1});
  const failures=[];
  page.on('pageerror',e=>failures.push(e.message));
  await page.goto('http://127.0.0.1:8765/?page=home',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
    const q=window.__aceModelQA;
    return q?.design?.source==='ace_7426_cute_web.glb' &&
      q?.robot?.source==='ace_7426_cute_web.glb';
  },null,{timeout:45000});
  await page.waitForFunction(()=>document.querySelectorAll('.welcome-art--ace.ace3d-live').length===2,
    null,{timeout:30000});
  const qa=await page.evaluate(()=>window.__aceModelQA);
  assert.equal(qa.design.clips,7);
  assert.equal(qa.robot.clips,7);
  assert.equal(qa.design.sunglasses,false);
  assert.equal(qa.robot.sunglasses,true);
  assert.equal(await page.locator('.welcome-art--ace canvas').count(),2);
  mkdirSync('screenshots',{recursive:true});
  await page.screenshot({path:'screenshots/ace-home.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
    const q=window.__aceModelQA;
    return q?.design?.clips===7&&q?.robot?.clips===7
  },null,{timeout:45000});
  await page.screenshot({path:'screenshots/ace-mobile.png',fullPage:true});
  const studio=await browser.newPage({viewport:{width:1400,height:900}});
  studio.on('pageerror',e=>failures.push(e.message));
  await studio.goto('http://127.0.0.1:8765/ace-studio.html',{waitUntil:'domcontentloaded'});
  await studio.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Cute Ace loaded'),
    null,{timeout:45000});
  assert.equal(await studio.locator('#embedded option').count(),8);
  await studio.selectOption('#embedded',{index:1});
  await studio.click('#previewClip');
  await studio.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Previewing'),
    null,{timeout:10000});
  await studio.waitForTimeout(350);
  await studio.click('#previewClip');
  await studio.screenshot({path:'screenshots/ace-studio.png'});
  for(const variant of ['pointing','seated','rigged']){
    await studio.selectOption('#character',variant);
    await studio.waitForFunction(v=>document.querySelector('#status')?.textContent?.includes('Cute Ace loaded') &&
      document.querySelector('#character')?.value===v,variant,{timeout:45000});
  }
  await studio.selectOption('#character','seated');
  await studio.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Sunglasses'),null,{timeout:45000});
  await studio.screenshot({path:'screenshots/ace-studio-sunglasses.png'});
  await studio.locator('#controls input[type=range]').nth(4).evaluate(input=>{
    input.value='15';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal((await studio.locator('#controls output').nth(4).textContent()).trim(),'15°');
  await studio.click('#add');
  assert.ok((await studio.locator('#keylist button').count())>=1);
  assert.deepEqual(failures,[],'Unexpected JavaScript runtime errors');
  console.log('PASS: exact Cute GLB, homepage design+seated shades (desktop/mobile), 3 studio variants, 7 embedded clips, keyframes.');
} finally {
  if(browser)await browser.close();
  server.kill();
}
