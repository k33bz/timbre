#!/usr/bin/env node
// Page gate. Loads dist/timbre.html in one headless browser and checks, in order:
//   * no console errors or uncaught exceptions, from load to the end
//   * one card per sound; every card renders its waveform and badges once scrolled into view
//   * a real (trusted) click on Play starts the AudioContext and plays without exceptions; a theme
//     pad plays too
//   * keyboard: "/" focuses search, arrow keys move a fader and re-render its waveform
//   * search and category filters show the right cards
//   * the color theme switches (dark to light) and repaints
//   * Vary draws a new seed; Save WAV downloads a RIFF file; Copy copies or offers the code
//   * at phone width (375 px) nothing scrolls sideways
//   * the Speak rack: a typed line shows its phonemes and renders, plays by a click and by Ctrl+Enter,
//     a fader moves by keyboard, babble mode swaps the voices, Copy and Save WAV work, the voice
//     picker offers the male and the female announcer
// Screenshots (gates/out): page-dark.png and page-light.png (full page, 1280 wide),
// page-phone.png (375 wide, top of the page, light), page-phone-speak.png (the Speak rack) and
// page-phone-dark.png (a card, dark)
//   node gates/check_page.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, distUrl, OUT } from './lib/browser.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass, detail }); };

async function waitFor(b, expr, ms = 8000) {
  const end = Date.now() + ms;
  for (;;) {
    if (await b.eval(expr)) return true;
    if (Date.now() > end) return false;
    await sleep(60);
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dl = path.join(OUT, 'downloads');
  fs.rmSync(dl, { recursive: true, force: true });
  fs.mkdirSync(dl, { recursive: true });
  const b = await launch({ width: 1280, height: 900 });
  try {
    await b.viewport(1280, 900);
    await b.colorScheme('dark');
    await b.goto(distUrl());
    await sleep(300);

    const info = await b.eval(`({ n: Timbre.sounds.length, ids: Timbre.sounds.map((s) => s.id),
      cards: document.querySelectorAll('.strip').length, theme: document.documentElement.dataset.theme,
      pads: document.querySelectorAll('.pad').length, moments: Object.keys(Timbre.themes[0].moments).length,
      cats: [...document.querySelectorAll('.cat')].map((c) => c.dataset.cat) })`);
    ok('one card per sound', info.cards === info.n, `${info.cards} cards, ${info.n} sounds`);
    ok('dark theme from the system preference', info.theme === 'dark', info.theme);
    ok('theme pads for every moment', info.pads === info.moments, `${info.pads} pads`);

    // every card renders once it scrolls into view
    const unrendered = [];
    for (const id of info.ids) {
      await b.eval(`document.getElementById(${JSON.stringify('s-' + id)}).scrollIntoView({ block: 'center' })`);
      if (!(await waitFor(b, `document.getElementById(${JSON.stringify('s-' + id)}).dataset.rendered === '1'`, 6000))) unrendered.push(id);
    }
    const drawn = await b.eval(`[...document.querySelectorAll('.strip')].map((el) => {
      const cv = el.querySelector('canvas'); const g = cv.getContext('2d');
      const px = cv.width && cv.height ? g.getImageData(0, 0, cv.width, cv.height).data : [];
      let ink = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 0) ink++;
      const pk = el.querySelector('[data-k="peak"] span').textContent;
      return { id: el.dataset.id, ink, pk };
    })`);
    const blank = drawn.filter((d) => d.ink < 200 || !/^-\d+\.\d$/.test(d.pk)).map((d) => `${d.id} (ink ${d.ink}, pk ${d.pk})`);
    ok('every card renders a waveform and level badges', !unrendered.length && !blank.length,
      unrendered.length ? 'not rendered: ' + unrendered.join(', ') : blank.join(', '));

    await b.eval('window.scrollTo(0, 0)');
    await sleep(150);
    await b.screenshot(path.join(OUT, 'page-dark.png'), true);

    // a trusted click on Play creates and starts the AudioContext
    const plays0 = (await b.eval('Timbre.stats()')).plays;
    await b.click('#s-ui-click-soft .play');
    const running = await waitFor(b, `!!Timbre.audio() && Timbre.audio().state === 'running'`, 4000);
    const plays1 = (await b.eval('Timbre.stats()')).plays;
    ok('Play starts audio', running && plays1 === plays0 + 1, `state ${await b.eval('Timbre.audio() && Timbre.audio().state')}, plays ${plays1}`);
    await b.click('.pad[data-moment="success"]');
    await sleep(100);
    ok('a theme pad plays its moment', (await b.eval('Timbre.stats()')).plays === plays1 + 1);

    // keyboard: "/" focuses search; arrows move a fader and trigger a re-render
    await b.eval('document.activeElement && document.activeElement.blur()');
    await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '/', code: 'Slash', text: '/', windowsVirtualKeyCode: 191 });
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '/', code: 'Slash', windowsVirtualKeyCode: 191 });
    ok('"/" focuses search', (await b.eval('document.activeElement && document.activeElement.id')) === 'q');
    const fid = '#p-game-coin-flip-pitch';
    const before = await b.eval(`({ v: document.querySelector('${fid}').value, r: Timbre.stats().renders })`);
    await b.eval(`document.querySelector('${fid}').scrollIntoView({ block: 'center' }); document.querySelector('${fid}').focus()`);
    for (let i = 0; i < 5; i++) await b.key('ArrowRight');
    const rerendered = await waitFor(b, `Timbre.stats().renders > ${before.r}`, 3000);
    const after = await b.eval(`({ v: document.querySelector('${fid}').value, out: document.querySelector('${fid}').nextElementSibling.textContent })`);
    ok('arrow keys move a fader and re-render', Number(after.v) > Number(before.v) && rerendered, `${before.v} -> ${after.v} (${after.out})`);

    // search and categories
    await b.eval(`document.querySelector('#q').focus(); document.querySelector('#q').select()`);
    await b.type('coin');
    const shownCoin = await b.eval(`[...document.querySelectorAll('.strip')].filter((e) => !e.hidden).map((e) => e.dataset.id)`);
    // the catalog grows, so "coin" may match more than one sound (Gem Collect is tagged coin): the
    // check is that the match is kept, unrelated cards are hidden and the list actually narrowed
    const totalCards = await b.eval(`document.querySelectorAll('.strip').length`);
    ok('search filters cards', shownCoin.includes('game-coin-flip') && !shownCoin.includes('ui-click-soft') &&
      shownCoin.length > 0 && shownCoin.length < totalCards, `${shownCoin.length}/${totalCards}: ${shownCoin.join(', ')}`);
    await b.key('Escape');
    const all = await b.eval(`[...document.querySelectorAll('.strip')].filter((e) => !e.hidden).length`);
    ok('Escape clears the search', all === info.n, `${all} shown`);
    await b.click('.cat[data-cat="cards"]');
    const cards = await b.eval(`[...document.querySelectorAll('.strip')].filter((e) => !e.hidden).map((e) => e.dataset.id)`);
    const want = info.ids.filter((id) => id.startsWith('cards-'));
    ok('category filter', JSON.stringify(cards) === JSON.stringify(want), cards.join(', '));
    await b.click('.cat[data-cat="all"]');

    // vary draws a new seed for each play
    await b.click('#s-cards-riffle .vary .sw');
    await b.click('#s-cards-riffle .play');
    await sleep(120);
    await b.click('#s-cards-riffle .play');
    await waitFor(b, `document.querySelector('#s-cards-riffle [data-k="seed"] span').textContent !== '1'`, 3000);
    const seedShown = await b.eval(`document.querySelector('#s-cards-riffle [data-k="seed"] span').textContent`);
    ok('Vary plays a new seed', seedShown !== '1', 'seed ' + seedShown);

    // Save WAV downloads a RIFF file
    let dlOk = false;
    try { await b.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl }); dlOk = true; } catch {}
    if (!dlOk) { try { await b.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dl }); dlOk = true; } catch {} }
    await b.click('#s-ui-click-soft .wav');
    let wav = null;
    for (let i = 0; i < 60 && !wav; i++) {
      const f = fs.readdirSync(dl).find((x) => x.endsWith('.wav'));
      if (f) { const buf = fs.readFileSync(path.join(dl, f)); if (buf.length > 44) wav = { f, buf }; }
      if (!wav) await sleep(100);
    }
    ok('Save WAV downloads 16-bit PCM', wav && wav.buf.toString('latin1', 0, 4) === 'RIFF' && wav.buf.readUInt16LE(34) === 16,
      wav ? `${wav.f}, ${wav.buf.length} bytes` : 'no file' + (dlOk ? '' : ' (download behavior not settable)'));

    // Copy: either the clipboard took it (toast) or the code dialog opened
    await b.click('#s-game-whoosh .copy');
    await sleep(300);
    const copy = await b.eval(`({ toast: document.querySelector('#toast').textContent, dialog: document.querySelector('#code').open,
      text: document.querySelector('#code-text').value.slice(0, 40) })`);
    ok('Copy copies or shows the code', /^Copied gameWhoosh\(\)/.test(copy.toast) || (copy.dialog && copy.text.startsWith('// Usage:')),
      copy.dialog ? 'dialog (clipboard blocked)' : copy.toast);
    if (copy.dialog) await b.eval(`document.querySelector('#code').close()`);

    // the Speak rack: a typed line shows its phonemes and renders; Play by a click and by
    // Ctrl+Enter; a fader moves by keyboard; babble mode swaps the voices; Copy and Save WAV work
    await b.eval(`document.querySelector('#speak').scrollIntoView({ block: 'center' }); document.querySelector('#sp-text').focus(); document.querySelector('#sp-text').select()`);
    await b.type('System online.');
    const spPh = await waitFor(b, `document.querySelector('#sp-ph').textContent === 'S IH1 S T AX0 M / AA1 N L AY2 N .'`, 3000);
    const spDrawn = await waitFor(b, `document.querySelector('#speak').dataset.rendered === '1' && /^-\\d+\\.\\d$/.test(document.querySelector('#speak [data-k="peak"] span').textContent)`, 10000);
    const spInk = await b.eval(`(() => { const cv = document.querySelector('#speak canvas'); const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 0) n++; return n; })()`);
    ok('Speak shows the phonemes and renders the line', spPh && spDrawn && spInk > 200,
      `${await b.eval(`document.querySelector('#sp-ph').textContent`)}; peak ${await b.eval(`document.querySelector('#speak [data-k="peak"] span').textContent`)}, ink ${spInk}`);
    const sp0 = (await b.eval('Timbre.stats()')).plays;
    await b.click('#sp-play');
    await sleep(100);
    await b.eval(`document.querySelector('#sp-text').focus()`);
    await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 2 });
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 2 });
    await sleep(100);
    const sp1 = (await b.eval('Timbre.stats()')).plays;
    ok('Speak plays by a click and by Ctrl+Enter', sp1 === sp0 + 2 && (await b.eval(`document.querySelector('#sp-text').value`)) === 'System online.', `plays ${sp0} -> ${sp1}`);
    const pv = await b.eval(`document.querySelector('#sp-p-pitch').value`);
    await b.eval(`document.querySelector('#sp-p-pitch').focus()`);
    for (let i = 0; i < 3; i++) await b.key('ArrowRight');
    const pv2 = await b.eval(`({ v: document.querySelector('#sp-p-pitch').value, out: document.querySelector('#sp-p-pitch').nextElementSibling.textContent })`);
    ok('a Speak fader moves by keyboard', Number(pv2.v) > Number(pv), `${pv} -> ${pv2.v} (${pv2.out})`);
    await b.click('#speak input[value="babble"] + span');
    await sleep(150);
    const bab = await b.eval(`({ mode: document.querySelector('#speak input[value="babble"]').checked, voices: [...document.querySelectorAll('#sp-voice option')].map((o) => o.textContent),
      faders: [...document.querySelectorAll('#sp-params input')].map((i) => i.dataset.k), ph: document.querySelector('#sp-ph').textContent })`);
    ok('babble mode swaps the voices and the controls', bab.mode && bab.voices[0] === 'Cute' && bab.voices.length === 5 &&
      bab.faders.join() === 'pitch,speed,spread' && /^Babble/.test(bab.ph), `${bab.voices.join(', ')}; ${bab.faders.join(', ')}`);
    await b.click('#sp-copy');
    await sleep(300);
    const spCopy = await b.eval(`({ toast: document.querySelector('#toast').textContent, dialog: document.querySelector('#code').open,
      text: document.querySelector('#code-text').value })`);
    ok('Speak Copy copies or shows one function', /^Copied babbleSystemOnline\(\)/.test(spCopy.toast) || (spCopy.dialog && /function babbleSystemOnline\(/.test(spCopy.text)),
      spCopy.dialog ? 'dialog (clipboard blocked)' : spCopy.toast);
    if (spCopy.dialog) await b.eval(`document.querySelector('#code').close()`);
    await b.click('#sp-wav');
    let spWav = null;
    for (let i = 0; i < 80 && !spWav; i++) {
      const f = fs.readdirSync(dl).find((x) => x.startsWith('babble-system-online') && x.endsWith('.wav'));
      if (f) { const buf = fs.readFileSync(path.join(dl, f)); if (buf.length > 44) spWav = { f, buf }; }
      if (!spWav) await sleep(100);
    }
    ok('Speak saves the line as a WAV', spWav && spWav.buf.toString('latin1', 0, 4) === 'RIFF' && spWav.buf.readUInt16LE(22) === 1,
      spWav ? `${spWav.f}, ${spWav.buf.length} bytes, mono` : 'no file');
    await b.click('#speak input[value="speak"] + span');
    await sleep(150);
    // the voice picker offers both announcers; the female one takes over the line
    const spk = await b.eval(`[...document.querySelectorAll('#sp-voice option')].map((o) => o.value + '=' + o.textContent)`);
    await b.eval(`(() => { const s = document.querySelector('#sp-voice'); s.value = 'announcer-female'; s.dispatchEvent(new Event('change')); })()`);
    const fem = await waitFor(b, `document.querySelector('#sp-voice').value === 'announcer-female' && /woman/.test(document.querySelector('#sp-desc').textContent) && document.querySelector('#speak').dataset.rendered === '1'`, 5000);
    ok('the Speak rack offers the male and the female announcer', spk.includes('announcer=Announcer') && spk.includes('announcer-female=Female Announcer') && fem,
      spk.join(', '));
    await b.eval(`(() => { const s = document.querySelector('#sp-voice'); s.value = 'announcer'; s.dispatchEvent(new Event('change')); })()`);

    // color theme switch
    const bgDark = await b.eval('getComputedStyle(document.body).backgroundColor');
    await b.click('#mode');
    await sleep(150);
    const light = await b.eval(`({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor,
      label: document.querySelector('#mode').getAttribute('aria-label') })`);
    ok('theme switch to light', light.theme === 'light' && light.bg !== bgDark, `${bgDark} -> ${light.bg}; button: ${light.label}`);
    await b.eval('window.scrollTo(0, 0)');
    await sleep(150);
    await b.screenshot(path.join(OUT, 'page-light.png'), true);

    // phone width: no sideways scroll
    await b.viewport(375, 812, true);
    await b.goto(distUrl());
    await sleep(400);
    for (const id of info.ids) {
      await b.eval(`document.getElementById(${JSON.stringify('s-' + id)}).scrollIntoView({ block: 'center' })`);
      await waitFor(b, `document.getElementById(${JSON.stringify('s-' + id)}).dataset.rendered === '1'`, 4000);
    }
    await b.eval('window.scrollTo(0, 0)');
    const phone = await b.eval(`(() => {
      const vw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect(); return r.width && (r.right > vw + 0.5 || r.left < -0.5) && getComputedStyle(el).position !== 'fixed';
      }).slice(0, 5).map((el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + [...el.classList].join('.'));
      return { sw: document.documentElement.scrollWidth, vw, wide };
    })()`);
    ok('phone width has no sideways scroll', phone.sw <= phone.vw && !phone.wide.length, `scrollWidth ${phone.sw}, viewport ${phone.vw}${phone.wide.length ? '; overflowing: ' + phone.wide.join(', ') : ''}`);
    await b.screenshot(path.join(OUT, 'page-phone.png'));
    await b.eval(`document.querySelector('#speak').scrollIntoView({ block: 'start' })`);
    await sleep(300);
    await b.screenshot(path.join(OUT, 'page-phone-speak.png'));
    await b.click('#mode');
    await b.eval(`document.getElementById('s-ui-toggle-switch').scrollIntoView({ block: 'start' })`);
    await sleep(300);
    await b.screenshot(path.join(OUT, 'page-phone-dark.png'));

    await sleep(200);
    ok('no console errors or exceptions', !b.errors.length, b.errors.slice(0, 5).join(' | '));
  } catch (e) {
    ok('the page gate ran to the end', false, e.message);
  } finally {
    await b.close();
  }
  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'ok  ' : 'FAIL'}  ${r.name}${r.detail ? '  (' + r.detail + ')' : ''}`);
  console.log(`\npage: ${results.length - failed.length}/${results.length} checks passed; screenshots in ${path.relative(process.cwd(), OUT) || OUT}`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
