const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8765/';
const LIMIT_MS = 500;

(async () => {
  const browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    for (const [label, viewport] of [
      ['desktop', {width:1440,height:900}],
      ['mobile', {width:390,height:844}]
    ]) {
      const context = await browser.newContext({viewport,deviceScaleFactor:1});
      const page = await context.newPage();
      // Simulate unusably slow third-party CDNs. The *page itself* should
      // remain complete and navigable without waiting for Three.js or fonts.
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname === '127.0.0.1') return route.continue();
        return route.abort('failed');
      });
      const started = Date.now();
      await page.goto(BASE,{waitUntil:'commit',timeout:15000});
      await page.locator('#welcomeGateway').waitFor({state:'visible',timeout:3000});
      await page.waitForFunction(() => {
        const photos = document.querySelectorAll('.ace-3d-poster');
        return photos.length===2 && [...photos].every(img => img.complete && img.naturalWidth>0);
      },null,{timeout:3000});
      const posterMs = Date.now()-started;
      const state = await page.evaluate(() => ({
        visible: getComputedStyle(document.getElementById('welcomeGateway')).display!=='none',
        blockingLoader: getComputedStyle(document.getElementById('siteLoader')).display!=='none',
        images:[...document.querySelectorAll('.ace-3d-poster')].map(x=>({width:x.naturalWidth,height:x.naturalHeight})),
        designHref:document.querySelector('a.welcome-option')?.getAttribute('href'),
        archiveHref:document.querySelectorAll('a.welcome-option')[1]?.getAttribute('href')
      }));
      console.log('WELCOME_FAST_FIRST_PAINT',JSON.stringify({label,posterMs,limitMs:LIMIT_MS,state}));
      if (!state.visible || state.blockingLoader || state.images.length!==2 ||
          state.designHref!=='?page=design-teaching' || state.archiveHref!=='?page=robot-archive')
        throw Error('Welcome fallback or routing failed: '+JSON.stringify(state));
      if (posterMs>LIMIT_MS) throw Error(label+' poster first-paint exceeded '+LIMIT_MS+'ms on local server: '+posterMs);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => {console.error(error.stack);process.exit(1);});
