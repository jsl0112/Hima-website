const fs = require('fs');
const c = fs.readFileSync('figma-node.json', 'utf8');
const d = JSON.parse(c);
// check if there's a link field
if (d.linkAccess) console.log('linkAccess:', d.linkAccess);
// Look for any URL-like field
const str = JSON.stringify(d).substring(0, 2000);
const m = str.match(/figma[^"]*file[^"]*\/([a-zA-Z0-9]{10,})/);
if (m) console.log('found key:', m[1]);
// check the document node structure
const nodes = d.nodes;
if (nodes) {
  const keys = Object.keys(nodes);
  console.log('node keys:', keys.join(','));
}
