import * as nbsJs from '@encode42/nbs.js';
import * as fs from 'fs';

const f = fs.readFileSync('./碧蓝档案 Blue Archive - Rabbit of Caerbanog.nbs');
const song = nbsJs.fromArrayBuffer(f.buffer);

console.log(song);
