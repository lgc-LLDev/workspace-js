const nbsJs = require('@encode42/nbs.js');
const fs = require('fs');

const f = fs.readFileSync('./14th Song.nbs');
const song = nbsJs.fromArrayBuffer(f.buffer);
let total = 0;
song.layers.forEach((l) => {
  l.notes.forEach((n) => {
    if (n) total++;
  });
});
console.log(song);
console.log(total);
