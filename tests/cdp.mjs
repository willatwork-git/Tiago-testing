// Tiny Chrome DevTools Protocol driver shared by the e2e tests: real keyboard events,
// real layout, uncaught-error capture, screenshots. No dependencies (Node 22+ global WebSocket).
//
// Env: CHROME — path to Chrome (default: the macOS install location).

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEYS = {
  Enter: [13, '\r'], Space: [32, ' '], Tab: [9, ''], Escape: [27, ''],
  ArrowLeft: [37], ArrowRight: [39], ArrowUp: [38], ArrowDown: [40],
};

export async function openBrowser({ out, port = 9333, name = 'e2e' } = {}) {
  const OUT = out ?? mkdtempSync(join(tmpdir(), `neon-arcade-${name}-`));
  const exe = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/profile`,
    '--window-size=900,900', 'about:blank'], { stdio: 'ignore' });

  let ws;
  for (let i = 0; i < 50 && !ws; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch { /* not up yet */ }
    if (!ws) await sleep(200);
  }
  await new Promise((r) => ws.addEventListener('open', r));

  let id = 0;
  const pending = new Map();
  const pageErrors = [];
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') {
      const e = d.params.exceptionDetails;
      pageErrors.push(`${e.exception?.description ?? e.text} @${e.url?.split('/').pop()}:${e.lineNumber + 1}`);
    }
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
  });
  const send = (method, params = {}) => new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };

  const keyInfo = (code) => {
    if (KEYS[code]) return { kc: KEYS[code][0], text: KEYS[code][1], key: code === 'Space' ? ' ' : code };
    const ch = code.slice(3).toLowerCase(); // KeyJ → j
    return { kc: ch.toUpperCase().charCodeAt(0), text: ch, key: ch };
  };
  const down = async (code) => {
    const { kc, text, key } = keyInfo(code);
    await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', code, key, windowsVirtualKeyCode: kc, text });
  };
  const up = async (code) => {
    const { kc, key } = keyInfo(code);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode: kc });
  };

  let fails = 0;
  return {
    OUT,
    send,
    ev,
    pageErrors,
    /** Press and release a key. */
    async key(code) {
      await down(code);
      await up(code);
      await sleep(60);
    },
    /** Hold a key for ms. */
    async hold(code, ms) {
      await down(code);
      await sleep(ms);
      await up(code);
    },
    async viewport(w, h) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    },
    async shot(name) {
      const r = await send('Page.captureScreenshot');
      writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64'));
    },
    async load(url) {
      await send('Page.navigate', { url });
      await sleep(800);
    },
    /** Poll a page expression until truthy (or time out): headless frames don't tick on a fixed schedule. */
    async waitFor(expr, ms = 1000) {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (await ev(expr)) return true;
        await sleep(20);
      }
      return false;
    },
    check(ok, msg) {
      console.log(ok ? 'PASS' : 'FAIL', msg);
      if (!ok) fails++;
    },
    finish() {
      this.check(pageErrors.length === 0, `no uncaught page errors${pageErrors.length ? `: ${[...new Set(pageErrors)].join(' | ')}` : ''}`);
      console.log(fails ? `${fails} FAILED` : 'ALL PASS', `(screenshots in ${OUT})`);
      process.exitCode = fails ? 1 : 0;
      ws.close();
      chrome.kill();
    },
  };
}
