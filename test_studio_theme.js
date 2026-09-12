const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.resolve(__dirname, 'chrome_cdp_profile_studio');
const ARTIFACTS_DIR = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\6f2038b4-ba91-41b6-bd09-62ff0e4efeb2';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Headless Chrome for Studio Theme Validation...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--user-data-dir=${USER_DATA}`,
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'http://localhost:8080'
  ]);

  await wait(3000);

  const targetsRes = await fetch('http://localhost:9222/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('8080'));
  if (!pageTarget) {
    console.error('No page target found!');
    chrome.kill();
    return;
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const consoleMessages = [];
  const runtimeErrors = [];

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      runtimeErrors.push(msg.params);
    }
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };

  await new Promise(r => { ws.onopen = r; });
  console.log('Connected to CDP');

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      const orig = WebGL2RenderingContext.prototype.uniform3fv;
      WebGL2RenderingContext.prototype.uniform3fv = function(addr, val) {
        if (!val || typeof val[Symbol.iterator] !== 'function') {
          console.error('DIAGNOSTIC_UNIFORM3FV_ERROR: value is', val, typeof val);
        }
        return orig.apply(this, arguments);
      };
    `
  });
  await send('Page.navigate', { url: 'http://localhost:8080/?nocache=' + Date.now() });
  await wait(3500);

  // 1. Capture Hero Studio with Cloud
  console.log('Capturing Hero Studio...');
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_01_hero_studio.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_01_hero_studio.png');

  // Check 3D Pop Out Button & Spatial Badges
  console.log('Checking Pop-Out Services State...');
  const popoutState = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-popout-services');
      const badges = document.querySelectorAll('.spatial-service-card');
      const cloudCanvas = document.getElementById('hero-three-canvas');
      return {
        hasButton: !!btn,
        buttonText: btn ? btn.innerText.trim() : null,
        badgeCount: badges.length,
        badgesVisible: Array.from(badges).filter(b => parseFloat(b.style.opacity || '0') > 0.1).length,
        canvasPresent: !!cloudCanvas
      };
    })()`,
    returnByValue: true
  });
  console.log('Popout State:', JSON.stringify(popoutState.result.value, null, 2));

  // Toggle Pop Out Services explicitly to ensure badges are deployed
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-popout-services');
      if (btn && !btn.classList.contains('active')) {
        btn.click();
      }
    })()`
  });
  await wait(1200);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_02_services_popped_out.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_02_services_popped_out.png');

  // 2. Scroll to Services Section
  console.log('Capturing Services Section...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = document.getElementById('services');
      if (s) {
        const y = window.pageYOffset + s.getBoundingClientRect().top - 90;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    })()`
  });
  await wait(800);
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_03_services_grid_studio.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_03_services_grid_studio.png');

  // 3. Scroll to Working Process (Framing both rows 1 & 2)
  console.log('Capturing Process Section...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const p = document.getElementById('process');
      if (p) {
        const y = window.pageYOffset + p.getBoundingClientRect().top - 10;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    })()`
  });
  await wait(800);
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_04_process_section_studio.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_04_process_section_studio.png');

  // 3b. Capture Full Journey Flow Stage
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = document.querySelector('.process-journey-stage');
      if (s) {
        const y = window.pageYOffset + s.getBoundingClientRect().top - 140;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    })()`
  });
  await wait(1500);

  const coords = await send('Runtime.evaluate', {
    expression: `(() => {
      const stage = document.querySelector('.process-journey-stage');
      const stageRect = stage.getBoundingClientRect();
      const getPos = (sel) => {
        const el = document.querySelector(sel);
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.left - stageRect.left + r.width / 2),
          y: Math.round(r.top - stageRect.top + r.height / 2)
        };
      };
      return JSON.stringify({
        w: Math.round(stageRect.width),
        h: Math.round(stageRect.height),
        c1: getPos('[data-step="1"] .journey-circle-frame'),
        c2: getPos('[data-step="2"] .journey-circle-frame'),
        c3: getPos('[data-step="3"] .journey-circle-frame'),
        c4: getPos('[data-step="4"] .journey-circle-frame'),
        c5: getPos('[data-step="5"] .journey-circle-frame'),
        c6: getPos('[data-step="6"] .journey-circle-frame'),
      });
    })()`
  });
  console.log('MEASURED CIRCLE CENTERS:', coords.result.value);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_04b_process_stage_full.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_04b_process_stage_full.png');

  // 4. Scroll to Bottom Brands Marquee
  console.log('Capturing Bottom Brands Marquee...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const m = document.querySelector('.brands-marquee-section');
      if (m) {
        const y = window.pageYOffset + m.getBoundingClientRect().top - 100;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    })()`
  });
  await wait(800);
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_05_brands_marquee_bottom.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_05_brands_marquee_bottom.png');

  // 4b. Scroll to Footer & CTA
  console.log('Capturing Footer & CTA Section...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const f = document.querySelector('.site-footer');
      if (f) {
        const y = window.pageYOffset + f.getBoundingClientRect().top - 200;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    })()`
  });
  await wait(800);
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_05b_footer_studio.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_05b_footer_studio.png');

  // 5. Check Mobile Viewport
  console.log('Testing Mobile Viewport (375x667)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' })` });
  await wait(1000);
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_06_mobile_hero_studio.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_06_mobile_hero_studio.png');

  console.log('Runtime exceptions:', runtimeErrors.length);
  if (runtimeErrors.length > 0) {
    console.error('Errors:', JSON.stringify(runtimeErrors, null, 2));
  }

  ws.close();
  chrome.kill();
  console.log('Verification completed successfully!');
}

run().catch(console.error);
