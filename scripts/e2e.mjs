import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);
const browser = browserCandidates.find((candidate) => existsSync(candidate));

if (!browser) {
  console.error('No Chromium browser found. Set CHROME_PATH to Chrome, Edge, or Chromium.');
  process.exit(1);
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8'
};

const results = [];
const exceptions = [];

function record(name, pass, details = '') {
  results.push({ name, status: pass ? 'PASS' : 'FAIL', details });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(check, timeout = 10000, interval = 100) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const value = await check();
      if (value) return value;
    } catch {
      // Keep polling until the timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timed out waiting for condition');
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(root)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(filePath);
    if (info.isDirectory()) {
      response.writeHead(302, { Location: `${pathname}/` }).end();
      return;
    }
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const debugPort = await getFreePort();
const userDataDir = await mkdtemp(path.join(tmpdir(), 'portfolio-e2e-'));
const browserProcess = spawn(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  '--window-size=1440,900',
  'about:blank'
], { stdio: 'ignore' });

let socket;
let sessionId;

try {
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
    return response.ok ? response.json() : null;
  });

  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let nextId = 1;
  const pending = new Map();

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails.text || 'Runtime exception');
    }
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) {
      waiter.reject(new Error(message.error.message));
    } else {
      waiter.resolve(message.result);
    }
  };

  function send(method, params = {}, targetSessionId) {
    const id = nextId++;
    const payload = { id, method, params };
    if (targetSessionId) payload.sessionId = targetSessionId;
    socket.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId, flatten: true });
  sessionId = attached.sessionId;
  const cdp = (method, params = {}) => send(method, params, sessionId);

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  await cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Browser.grantPermissions', {
    origin: baseUrl,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite']
  });

  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Evaluation failed');
    }
    return result.result.value;
  }

  async function navigate(pathname) {
    await cdp('Page.navigate', { url: `${baseUrl}${pathname}` });
    await waitFor(() => evaluate('document.readyState === "complete" && !!document.querySelector("h1")'));
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  async function reload() {
    await cdp('Page.reload', { ignoreCache: true });
    await waitFor(() => evaluate('document.readyState === "complete" && !!document.querySelector("h1")'));
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  async function setViewport(width, height) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      screenWidth: width,
      screenHeight: height,
      deviceScaleFactor: 1,
      mobile: width < 600
    });
  }

  await setViewport(1440, 900);
  await navigate('/');
  await evaluate('localStorage.clear()');
  await reload();

  const viewports = [
    { width: 1440, height: 900, label: 'desktop' },
    { width: 1024, height: 768, label: 'laptop' },
    { width: 768, height: 1024, label: 'tablet' },
    { width: 390, height: 844, label: 'mobile' }
  ];

  for (const viewport of viewports) {
    await setViewport(viewport.width, viewport.height);
    await navigate('/');
    const metrics = await evaluate(`(() => {
      const root = document.documentElement;
      const nav = document.querySelector('.primary-nav');
      const menu = document.querySelector('.menu-toggle');
      return {
        overflow: root.scrollWidth - root.clientWidth,
        width: window.innerWidth,
        h1Count: document.querySelectorAll('h1').length,
        navDisplay: getComputedStyle(nav).display,
        menuDisplay: getComputedStyle(menu).display,
        title: document.title
      };
    })()`);

    record(
      `No horizontal overflow at ${viewport.width}x${viewport.height} (${viewport.label})`,
      metrics.overflow <= 1,
      JSON.stringify(metrics)
    );
    record(
      `Exactly one h1 at ${viewport.width}x${viewport.height}`,
      metrics.h1Count === 1,
      `h1Count=${metrics.h1Count}`
    );

    if (viewport.width <= 720) {
      record(
        `Mobile navigation is collapsed at ${viewport.width}px`,
        metrics.navDisplay === 'none' && metrics.menuDisplay !== 'none',
        `nav=${metrics.navDisplay}, menu=${metrics.menuDisplay}`
      );
    } else {
      record(
        `Desktop navigation is visible at ${viewport.width}px`,
        metrics.navDisplay === 'flex' && metrics.menuDisplay === 'none',
        `nav=${metrics.navDisplay}, menu=${metrics.menuDisplay}`
      );
    }
  }

  await setViewport(1440, 900);
  await navigate('/');
  const themeBefore = await evaluate('document.documentElement.dataset.theme');
  await evaluate("document.querySelector('[data-theme-toggle]').click()");
  const themeAfter = await evaluate('document.documentElement.dataset.theme');
  record('Theme toggle changes the active theme', themeBefore !== themeAfter, `${themeBefore} -> ${themeAfter}`);
  await reload();
  const themePersisted = await evaluate('document.documentElement.dataset.theme');
  record('Theme choice persists after reload', themePersisted === themeAfter, `expected=${themeAfter}, actual=${themePersisted}`);
  await evaluate("localStorage.setItem('theme', 'light')");

  await setViewport(390, 844);
  await navigate('/');
  await evaluate("document.querySelector('.menu-toggle').click()");
  const menuOpen = await evaluate(`(() => ({
    expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
    display: getComputedStyle(document.querySelector('.primary-nav')).display
  }))()`);
  record(
    'Mobile menu opens with correct ARIA state',
    menuOpen.expanded === 'true' && menuOpen.display === 'flex',
    JSON.stringify(menuOpen)
  );
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  const menuClosed = await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')");
  record('Escape closes the mobile menu', menuClosed === 'false', `aria-expanded=${menuClosed}`);

  await setViewport(1440, 900);
  await navigate('/');
  await evaluate("document.querySelector('[data-email]').click()");
  const copyWorked = await waitFor(
    () => evaluate("document.querySelector('.copy-label').textContent.trim() === 'Copied'"),
    3000
  );
  record('Copy-email interaction confirms success', copyWorked, 'copy label changed to Copied');

  await navigate('/ask-onboarding.html');
  const caseStudy = await evaluate(`(() => ({
    h1: document.querySelector('h1')?.innerText || '',
    sections: document.querySelectorAll('.case-section').length,
    title: document.title
  }))()`);
  record(
    'Case study renders with six documented sections',
    caseStudy.sections === 6 && /Ask/i.test(caseStudy.h1),
    JSON.stringify(caseStudy)
  );

  await setViewport(390, 844);
  await navigate('/ask-onboarding.html');
  const caseOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  record('Case study has no horizontal overflow at 390px', caseOverflow <= 1, `overflow=${caseOverflow}`);

  const localLinks = await evaluate(`Array.from(new Set(Array.from(document.querySelectorAll('a[href]'))
    .map((link) => link.getAttribute('href'))
    .filter((href) => href && !href.startsWith('#') && !/^(https?:|mailto:|tel:)/i.test(href))))`);

  const linkResults = [];
  for (const href of localLinks) {
    const url = new URL(href, `${baseUrl}/`);
    const response = await fetch(url.href);
    linkResults.push({ href, status: response.status });
  }
  record(
    'All local links resolve successfully',
    linkResults.every((item) => item.status === 200),
    JSON.stringify(linkResults)
  );

  await setViewport(1440, 900);
  await navigate('/');
  const accessibility = await evaluate(`(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const namelessButtons = Array.from(document.querySelectorAll('button')).filter((button) => {
      const name = (button.innerText || '').trim() || button.getAttribute('aria-label') || '';
      return !name;
    }).length;
    const namelessLinks = Array.from(document.querySelectorAll('a[href]')).filter((link) => {
      const name = (link.innerText || '').trim() || link.getAttribute('aria-label') || '';
      return !name;
    }).length;
    return {
      h1Count: document.querySelectorAll('h1').length,
      hasSkipLink: !!document.querySelector('.skip-link'),
      duplicates,
      namelessButtons,
      namelessLinks
    };
  })()`);
  record(
    'Accessible landmarks, names, and unique IDs',
    accessibility.h1Count === 1 &&
      accessibility.hasSkipLink &&
      accessibility.duplicates.length === 0 &&
      accessibility.namelessButtons === 0 &&
      accessibility.namelessLinks === 0,
    JSON.stringify(accessibility)
  );

  await evaluate("document.querySelector('.skip-link').focus()");
  const skipFocused = await evaluate("document.activeElement.classList.contains('skip-link')");
  record('Skip link is keyboard focusable', skipFocused, `activeElement=${skipFocused}`);

  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  const reducedMotion = await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches");
  record('Reduced-motion preference is respected', reducedMotion, `matches=${reducedMotion}`);
  await cdp('Emulation.setEmulatedMedia', { features: [] });

  record('No uncaught runtime exceptions', exceptions.length === 0, JSON.stringify(exceptions));

  const failed = results.filter((result) => result.status === 'FAIL');
  console.log(JSON.stringify({
    baseUrl,
    browser,
    viewports: viewports.map(({ width, height, label }) => ({ width, height, label })),
    passed: results.length - failed.length,
    failed: failed.length,
    results
  }, null, 2));

  if (failed.length > 0) process.exitCode = 1;
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (socket) socket.close();
  browserProcess.kill('SIGKILL');
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2000);
    browserProcess.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}