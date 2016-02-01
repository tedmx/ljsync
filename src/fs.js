import fs from 'fs';

export function read (f) { return new Promise(r => fs.readFile(f, (e, d) => r(d))); }
export function stat (f) { return new Promise(r => fs.stat(f, (e, d) => r(d))); }
