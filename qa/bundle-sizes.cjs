const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const directories = process.argv.slice(2);
if (!directories.length) throw new Error('Usage: node qa/bundle-sizes.cjs <dist> [baseline-dist]');
for (const directory of directories) {
 const assets = path.join(directory, 'assets');
 const files = fs.readdirSync(assets).filter(name => name.endsWith('.js')).sort().map(name => {
  const bytes = fs.readFileSync(path.join(assets, name));
  return { name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
 });
 const sum = entries => entries.reduce((total, file) => ({
  bytes: total.bytes + file.bytes, gzipBytes: total.gzipBytes + file.gzipBytes
 }), { bytes: 0, gzipBytes: 0 });
 console.log(JSON.stringify({
  directory, files, total: sum(files),
  excludingWorker: sum(files.filter(file => !file.name.startsWith('maplibre-gl-worker-')))
 }, null, 2));
}
