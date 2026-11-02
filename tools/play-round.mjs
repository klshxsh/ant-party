// Plays a full round in headless Chrome and saves screenshots of key moments.
//
// Usage: node tools/play-round.mjs <output-dir> [WIDTHxHEIGHT]
//   e.g. node tools/play-round.mjs /tmp/shots 390x844   (phone)
//        node tools/play-round.mjs /tmp/shots 820x1180  (tablet, default)
// Set CHROME=/path/to/chrome if Chrome isn't in the usual macOS location.
//
// Talks to Chrome over the DevTools protocol using Node's built-in WebSocket,
// so there's nothing to install. Exits non-zero if the page throws any JS errors.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const OUT = resolve(process.argv[2] || 'shots');
const [W, H] = (process.argv[3] || '820x1180').split('x').map(Number);
const PAGE = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html')).href;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'antparty-chrome-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--autoplay-policy=no-user-gesture-required', 'about:blank',
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function quit(code) {
  chrome.kill();
  setTimeout(() => {
    rmSync(profile, { recursive: true, force: true });
    process.exit(code);
  }, 300);
}

let targets;
for (let i = 0; i < 50 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(200); }
}
if (!targets) {
  console.error(`Couldn't start Chrome at ${CHROME}`);
  quit(2);
}

// --- DevTools protocol plumbing ---
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let nextId = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    errors.push(d.exception?.description || d.text);
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
  }
});
const send = (method, params = {}) => new Promise(r => {
  const id = ++nextId;
  pending.set(id, r);
  ws.send(JSON.stringify({ id, method, params }));
});
const js = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
const shot = async name => {
  const { result } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(result.data, 'base64'));
};
const click = sel => js(`document.querySelector(${JSON.stringify(sel)}).click()`);
const visible = screen => js(`!document.getElementById('screen-${screen}').hidden`);
const music = async where => console.log(`Music ${where}:`, (await js(`AP.audio.playing().join(', ')`)) || '(none)');

// --- Game helpers ---
const typeAnswer = async n => {
  for (const d of String(n)) await click(`#quiz-keypad [data-key="${d === '-' ? 'minus' : d}"]`);
  await click('#quiz-keypad [data-key="ok"]');
};
const currentAnswer = () => js(`(() => {
  const num = s => Number(s.replace(/[()]/g, '').replace('−', '-'));
  const [x, op, y] = document.getElementById('quiz-question').textContent.replace(' =', '').split(' ');
  const [a, b] = [num(x), num(y)];
  return ({ '×': a * b, '÷': a / b, '+': a + b, '−': a - b })[op];
})()`);
// Answers questions (and picks the first food) until the given screen shows.
const playUntil = async screen => {
  for (let i = 0; i < 80 && !(await visible(screen)); i++) {
    if (screen !== 'food' && (await visible('food'))) {
      await click('#food-choices button');
      await sleep(900);
      continue;
    }
    await typeAnswer(await currentAnswer());
    await sleep(1200);
  }
};

// --- The run ---
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 });
await send('Page.navigate', { url: PAGE });
await sleep(1500);
await js(`window.confirm = () => true; localStorage.clear()`);
// All three kinds of question, with the default −20 to 20 range for + and −.
await js(`AP.state.settings.types = { mul: true, div: true, addsub: true }`);
await shot('1-home');

await click('#home-start');
await sleep(400);
await shot('2-question');
await sleep(800); // the crossfade
await music('during questions');

const answer = await currentAnswer();
await typeAnswer(answer + 1);
await sleep(300);
await shot('3-wrong');
await sleep(400);
await typeAnswer(answer);
await sleep(900);
await shot('4-walking');

await playUntil('food');
await shot('5-food');
await sleep(300);
await music('choosing food');
await click('#food-choices button');
await sleep(900);

await playUntil('party');
await sleep(1000);
await shot('6-party-arriving');
await sleep(3500); // every ant has walked in
await click('.party-ant');
await sleep(400);
await shot('7-party');
await music('at the party');
await click('#mute');
console.log('Muted:', await js(`AP.state.settings.muted`), '/ music:', (await js(`AP.audio.playing().join(', ')`)) || '(none)');
await click('#mute');
await sleep(800);
await music('after unmuting');
console.log('Party:', await js(`AP.state.round.ants.length`), 'ants,',
  await js(`AP.state.round.foods.join(', ')`));

await click('#party-save');
console.log('Save button:', await js(`document.getElementById('party-save').textContent`));

await click('#party-home');
await click('#home-album');
await sleep(300);
await shot('8-album');
console.log('Album entries:', await js(`document.querySelectorAll('.album-card').length`));
await click('.album-card');
await sleep(4500);
await shot('9-album-party');

await click('#party-home'); // back to the album
await click('#album-home');
await click('#home-settings');
await sleep(300);
await shot('10-settings');
await js(`document.getElementById('set-volume').scrollIntoView({ block: 'center' })`);
await shot('10-settings-sound');
await js(`scrollTo(0, 0)`);
await click('#settings-progress');
await sleep(300);
await click('.hm-cell.strong, .hm-cell.getting, .hm-cell.tricky');
await sleep(200);
await shot('11-progress');
console.log('Progress detail:', await js(`document.getElementById('progress-detail').textContent`));
await js(`document.getElementById('progress-skills').scrollIntoView({ block: 'center' })`);
await shot('11-progress-skills');
console.log('+/− skills:', await js(`[...document.querySelectorAll('#progress-skills li')].map(li => li.textContent).join(' / ')`));

console.log(`Screenshots in ${OUT}`);
console.log(errors.length ? `JS ERRORS:\n${errors.join('\n')}` : 'No JS errors');
ws.close();
quit(errors.length ? 1 : 0);
