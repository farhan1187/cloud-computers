const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.resolve(__dirname, 'chrome_cdp_profile');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('1. Launching Headless Chrome on port 9222...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--user-data-dir=${USER_DATA}`,
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'http://localhost:8080'
  ]);

  await wait(2500);

  console.log('2. Fetching Chrome targets...');
  const targetsRes = await fetch('http://localhost:9222/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');

  if (!pageTarget) {
    console.error('No page target found!');
    chrome.kill();
    return;
  }

  console.log('Target found:', pageTarget.url, 'WS:', pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const consoleMessages = [];
  const runtimeErrors = [];

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve) => ws.onopen = resolve);
  console.log('3. WebSocket Connected to CDP!');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    } else if (data.method === 'Console.messageAdded') {
      consoleMessages.push(data.params.message);
    } else if (data.method === 'Runtime.exceptionThrown') {
      runtimeErrors.push(data.params.exceptionDetails);
    }
  };

  // Enable domains
  await sendCommand('Console.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await sendCommand('Network.enable');
  await sendCommand('Network.setCacheDisabled', { cacheDisabled: true });
  await sendCommand('Page.reload', { ignoreCache: true });
  console.log('Waiting for document and WebGL canvas ready...');
  for (let i = 0; i < 40; i++) {
    const ready = await sendCommand('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && !!document.querySelector('#hero-three-canvas canvas')",
      returnByValue: true
    });
    if (ready && ready.result && ready.result.value) {
      console.log('WebGL canvas and DOM verified ready!');
      break;
    }
    await wait(250);
  }
  await wait(1500);

  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', { expression, returnByValue: true });
    return res.result ? res.result.value : null;
  }

  async function takeScreenshot(filename) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.resolve(__dirname, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  // Helper to scroll instantly and log
  async function scrollToId(id) {
    const y = await evaluate(`
      (() => {
        const el = document.getElementById('${id}');
        if (!el) return -1;
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
        const top = Math.max(0, el.offsetTop - 70);
        window.scrollTo(0, top);
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        return {
          targetTop: top,
          actualY: window.scrollY
        };
      })()
    `);
    console.log(`Scrolled to #${id}:`, JSON.stringify(y));
    await wait(600);
  }

  const metrics = await evaluate(`({
    scrollHeight: document.documentElement.scrollHeight,
    windowHeight: window.innerHeight,
    home: document.getElementById('home')?.offsetTop,
    services: document.getElementById('services')?.offsetTop,
    network: document.getElementById('network')?.offsetTop,
    products: document.getElementById('products')?.offsetTop,
    about: document.getElementById('about')?.offsetTop,
    contact: document.getElementById('contact')?.offsetTop
  })`);
  console.log('Document Layout Metrics:', metrics);

  // 1. Reset scroll to top & capture Hero (let Three.js WebGL initialize and animate)
  await evaluate(`
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  `);
  await wait(2200);
  console.log('Capturing Hero Section with 3D Cloud Model at top (0,0)...');
  await takeScreenshot('test_01_hero.png');

  // Test 3D Controls: Orbit angle showcase
  console.log('Testing 3D Multi-angle View...');
  await evaluate(`
    if (window._threeHeroRoot) {
      window._threeHeroRoot.rotation.y += 0.75;
      window._threeHeroRoot.rotation.x = -0.15;
    }
  `);
  await wait(600);
  await takeScreenshot('test_01b_hero_3d_wireframe.png');

  // Reset 3D View
  await evaluate(`document.getElementById('btn-3d-reset')?.click()`);
  await wait(400);

  // 2. Scroll to Services Section
  console.log('Scrolling to #services...');
  await scrollToId('services');
  await takeScreenshot('test_02_services.png');

  // 2b. Scroll to Process Section (Step 1: Consultation)
  console.log('Scrolling to #process...');
  await scrollToId('process');
  await wait(400);
  await takeScreenshot('test_02b_process_step1.png');

  // Test interactive Step 2: Approvals (DEWA, SEWA, RTA, SIRA)
  console.log('Testing Step 2 (Approvals)...');
  await evaluate(`document.querySelector('[data-step="2"]').click()`);
  await wait(500);
  await takeScreenshot('test_02c_process_approvals.png');

  // Test interactive Step 4: Testing (Fluke QA Handover)
  console.log('Testing Step 4 (Testing Fluke QA)...');
  await evaluate(`document.querySelector('[data-step="4"]').click()`);
  await wait(500);
  await takeScreenshot('test_02d_process_testing.png');

  // 3. Scroll to Network Section
  console.log('Scrolling to #network...');
  await scrollToId('network');
  await takeScreenshot('test_03_network.png');

  // 4. Scroll to Products Section
  console.log('Scrolling to #products...');
  await scrollToId('products');
  await takeScreenshot('test_04_products.png');

  // 5. Scroll to Stats Section (wait 2s for full count-up completion)
  console.log('Scrolling to #about...');
  await scrollToId('about');
  await wait(2000);
  await takeScreenshot('test_05_stats.png');

  // 6. Scroll to Footer & Brands
  console.log('Scrolling to #contact...');
  await scrollToId('contact');
  await takeScreenshot('test_06_footer.png');

  // 7. Test Quote Modal
  console.log('Testing Quote Modal Open...');
  await evaluate(`document.querySelector('[data-open-modal="quote"]').click()`);
  await wait(600);
  await takeScreenshot('test_07_modal.png');

  // Close modal
  console.log('Closing Modal...');
  await evaluate(`
    document.getElementById('quote-modal').classList.remove('active');
    document.body.style.overflow = '';
  `);
  await wait(400);

  // 8. Test Mobile Viewport (375x812)
  console.log('Testing Mobile Viewport (375x812)...');
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await evaluate(`
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  `);
  await wait(600);
  await takeScreenshot('test_08_mobile_hero.png');

  // Check mobile hamburger menu
  console.log('Testing Mobile Menu Toggle...');
  await evaluate(`document.querySelector('.nav-toggle').click()`);
  await wait(400);
  await takeScreenshot('test_09_mobile_menu_open.png');

  // Close mobile menu
  await evaluate(`document.querySelector('.nav-toggle').click()`);
  await wait(300);

  // Scroll to services on mobile
  await scrollToId('services');
  await takeScreenshot('test_10_mobile_services.png');

  // Scroll to process on mobile
  await scrollToId('process');
  await wait(400);
  await takeScreenshot('test_11_mobile_process.png');

  // Reset device emulation
  await sendCommand('Emulation.clearDeviceMetricsOverride');
  await wait(300);

  // Check stats numbers
  const statsValues = await evaluate(`
    Array.from(document.querySelectorAll('.stat-number')).map(s => s.textContent.trim())
  `);
  console.log('Stats counter text:', statsValues);

  // Check WhatsApp links
  const waCheck = await evaluate(`({
    floatingBtnExists: !!document.getElementById('floating-whatsapp'),
    heroWaBtnExists: !!document.getElementById('hero-wa-btn'),
    serviceWaBtnsCount: document.querySelectorAll('.service-wa-btn').length,
    modalWaExists: !!document.querySelector('.modal-wa-banner'),
    modalSubmitIsWa: document.querySelector('#quote-form button[type="submit"]')?.classList.contains('btn-whatsapp')
  })`);
  console.log('WhatsApp Feature Verification:', waCheck);

  // Check console status
  console.log('Total Console Messages:', consoleMessages.length);
  console.log('Total Runtime Exceptions:', runtimeErrors.length);

  if (runtimeErrors.length > 0) {
    console.error('RUNTIME EXCEPTIONS FOUND:', JSON.stringify(runtimeErrors, null, 2));
  } else {
    console.log('PASSED: 0 Console/Runtime Errors!');
  }

  // Synchronize screenshots to artifact directory
  const artifactDir = 'C:\\\\Users\\\\LENOVO\\\\.gemini\\\\antigravity\\\\brain\\\\6f2038b4-ba91-41b6-bd09-62ff0e4efeb2';
  try {
    const files = fs.readdirSync(__dirname).filter(f => f.startsWith('test_') && f.endsWith('.png'));
    files.forEach(f => {
      fs.copyFileSync(path.join(__dirname, f), path.join(artifactDir, f));
    });
    console.log(`Synchronized ${files.length} test screenshots to artifacts directory.`);
  } catch (err) {
    console.error('Error copying screenshots to artifacts:', err.message);
  }

  ws.close();
  chrome.kill();
  console.log('CDP Test Complete!');
}

run().catch(console.error);
