const fs = require('fs');
const c = fs.readFileSync('figma-node.json', 'utf8');
// try various patterns for file key
const m1 = c.match(/"mainFileKey":"([^"]+)"/);
const m2 = c.match(/"fileKey":"([^"]+)"/);
const m3 = c.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
if (m1) console.log('mainFileKey:', m1[1]);
if (m2) console.log('fileKey:', m2[1]);
if (m3) console.log('url key:', m3[1]);
// check top-children.json
const tc = fs.readFileSync('top-children.json', 'utf8').substring(0, 500);
console.log('top-children start:', tc.substring(0, 200));
