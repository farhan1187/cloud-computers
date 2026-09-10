const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.resolve(__dirname, 'chrome_cdp_profile');
const ARTIFACTS_DIR = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\6f2038b4-ba91-41b6-bd09-62ff0e4efeb2';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Headless Chrome...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--user-data-dir=${USER_DATA}`,
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'http://localhost:8080'
  ]);

  await wait(2500);

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
  await send('Page.navigate', { url: 'http://localhost:8080/?nocache=' + Date.now() });
  await wait(2500);

  // 1. Verify Brands Marquee at bottom of home
  console.log('Verifying Brands Marquee...');
  const marqueeInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('.brands-marquee-section');
      const track = document.querySelector('.marquee-track');
      const cards = document.querySelectorAll('.brand-capsule-card');
      const title = document.querySelector('.brands-marquee-title');
      const rect = section ? section.getBoundingClientRect() : null;
      return {
        exists: !!section,
        titleText: title ? title.textContent : '',
        cardCount: cards.length,
        rect: rect,
        trackWidth: track ? track.scrollWidth : 0
      };
    })()`,
    returnByValue: true
  });
  console.log('Brands Marquee Info:', JSON.stringify(marqueeInfo.result.value, null, 2));

  // Scroll to bottom of home / brands section
  await send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('.brands-marquee-section');
      if (section) {
        const y = window.pageYOffset + section.getBoundingClientRect().top - 120;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    })()`
  });
  await wait(600);

  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_brands_marquee.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved test_brands_marquee.png');

  // 2. Test Working Process Section Pinned Scrolling
  console.log('Testing Process Pinned Scrolling...');
  
  // First scroll directly to #process top
  await send('Runtime.evaluate', {
    expression: `(() => {
      const p = document.querySelector('#process');
      const y = window.pageYOffset + p.getBoundingClientRect().top - 80;
      window.scrollTo({ top: y, behavior: 'instant' });
    })()`
  });
  await wait(600);

  const processMetrics1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const p = document.querySelector('#process');
      const navbar = document.querySelector('.navbar');
      const activeStep = document.querySelector('.process-step-item.active');
      const holo = document.querySelector('.holo-display-frame');
      return {
        pRect: p.getBoundingClientRect(),
        navbarRect: navbar.getBoundingClientRect(),
        activeStepNum: activeStep ? activeStep.getAttribute('data-step') : null,
        holoTop: holo ? holo.getBoundingClientRect().top : null,
        holoBottom: holo ? holo.getBoundingClientRect().bottom : null,
        isAboveHeader: holo && (holo.getBoundingClientRect().top < navbar.getBoundingClientRect().bottom - 2)
      };
    })()`,
    returnByValue: true
  });
  console.log('Process at start of pin:', JSON.stringify(processMetrics1.result.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_process_pinned_phase1.png'), Buffer.from(ss.data, 'base64'));

  // Scroll down 600px into pin scrub (should be around Phase 3)
  await send('Runtime.evaluate', { expression: `window.scrollBy({ top: 600, behavior: 'instant' })` });
  await wait(600);

  const processMetrics2 = await send('Runtime.evaluate', {
    expression: `(() => {
      const p = document.querySelector('#process');
      const navbar = document.querySelector('.navbar');
      const activeStep = document.querySelector('.process-step-item.active');
      const holo = document.querySelector('.holo-display-frame');
      return {
        pRect: p.getBoundingClientRect(),
        navbarRect: navbar.getBoundingClientRect(),
        activeStepNum: activeStep ? activeStep.getAttribute('data-step') : null,
        holoTop: holo ? holo.getBoundingClientRect().top : null,
        holoBottom: holo ? holo.getBoundingClientRect().bottom : null,
        isAboveHeader: holo && (holo.getBoundingClientRect().top < navbar.getBoundingClientRect().bottom - 2)
      };
    })()`,
    returnByValue: true
  });
  console.log('Process at mid pin (scroll +600):', JSON.stringify(processMetrics2.result.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_process_pinned_phase3.png'), Buffer.from(ss.data, 'base64'));

  // Scroll down another 600px into pin scrub (should be around Phase 5/6)
  await send('Runtime.evaluate', { expression: `window.scrollBy({ top: 600, behavior: 'instant' })` });
  await wait(600);

  const processMetrics3 = await send('Runtime.evaluate', {
    expression: `(() => {
      const p = document.querySelector('#process');
      const navbar = document.querySelector('.navbar');
      const activeStep = document.querySelector('.process-step-item.active');
      const holo = document.querySelector('.holo-display-frame');
      return {
        pRect: p.getBoundingClientRect(),
        navbarRect: navbar.getBoundingClientRect(),
        activeStepNum: activeStep ? activeStep.getAttribute('data-step') : null,
        holoTop: holo ? holo.getBoundingClientRect().top : null,
        holoBottom: holo ? holo.getBoundingClientRect().bottom : null,
        isAboveHeader: holo && (holo.getBoundingClientRect().top < navbar.getBoundingClientRect().bottom - 2)
      };
    })()`,
    returnByValue: true
  });
  console.log('Process at end pin (scroll +1200):', JSON.stringify(processMetrics3.result.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_process_pinned_phase6.png'), Buffer.from(ss.data, 'base64'));

  console.log('Console Errors:', consoleMessages.length);
  console.log('Runtime Errors:', runtimeErrors.length);

  ws.close();
  chrome.kill();
  console.log('All tests finished successfully!');
}

run().catch(console.error);
