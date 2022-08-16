import * as nbsJs from '@encode42/nbs.js';
import * as fs from 'fs';

const f = fs.readFileSync('./碧蓝档案 Blue Archive - Rabbit of Caerbanog.nbs');
const song = nbsJs.fromArrayBuffer(f.buffer);
let total = 0;
song.layers.forEach((l) => {
  l.notes.forEach((n) => {
    if (n) total++;
  });
});
console.log(total);
