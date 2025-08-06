const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'node_modules', '@modelcontextprotocol', 'sdk', 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('Could not find package.json for @modelcontextprotocol/sdk. Skipping patch.');
  process.exit(0);
}

console.log('--- Reading package.json for @modelcontextprotocol/sdk ---');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Ensure exports field exists
if (!packageJson.exports) {
  console.error('No exports field found in package.json. Cannot apply patch.');
  process.exit(1);
}

// Add the root export
console.log('--- Applying patch to exports field ---');
packageJson.exports['.'] = {
  import: './dist/esm/index.js',
  require: './dist/cjs/index.js',
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('--- Successfully patched package.json for @modelcontextprotocol/sdk ---');
