#!/usr/bin/env node
// Listening pass for the voices: renders representative lines in every speech and babble voice, and
// every voice sound at its defaults, through the page and its master chain (one headless browser),
// and writes them as WAV files to gates/out/voice/ for a person to listen to.
//   node gates/voice_wavs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, distUrl, OUT } from './lib/browser.mjs';

const LINES = {
  speak: ['Access granted. Welcome back, commander.', 'Is the system online? Three, two, one... go!'],
  babble: ['Oh, hi there! Are you new in town? I have so much to show you.'],
};

async function main() {
  const dir = path.join(OUT, 'voice');
  fs.mkdirSync(dir, { recursive: true });
  const b = await launch();
  const written = [];
  try {
    await b.goto(distUrl());
    const voices = await b.eval('(() => { const v = Timbre.speak.voices(); return { speak: Object.keys(v.speak), babble: Object.keys(v.babble) }; })()');
    const save = (name, bytes) => { fs.writeFileSync(path.join(dir, name), Buffer.from(bytes)); written.push(name); };
    for (const mode of ['speak', 'babble']) {
      for (const voice of voices[mode]) {
        for (const [i, text] of LINES[mode].entries()) {
          const bytes = await b.eval(`Timbre.speak.wav(${JSON.stringify({ mode, text, voice })}, 1).then((u) => Array.from(u))`);
          save(`${mode}-${voice}-${i + 1}.wav`, bytes);
        }
      }
    }
    const ids = await b.eval(`Timbre.sounds.filter((s) => s.category === 'voice').map((s) => s.id)`);
    for (const id of ids) save(`${id}.wav`, await b.eval(`Timbre.wav(${JSON.stringify(id)}, null, 1).then((u) => Array.from(u))`));
    if (b.errors.length) throw new Error('page errors: ' + b.errors.join(' | '));
  } finally {
    await b.close();
  }
  console.log(`${written.length} WAV files in ${path.relative(process.cwd(), dir) || dir}:\n  ${written.join('\n  ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
