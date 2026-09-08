#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJSON = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const expectedArgument = process.argv[2] || '';
const expected = expectedArgument.replace(/^v/, '') || fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();

if (!/^\d+\.\d+\.\d+$/.test(expected)) {
  throw new Error(`版本号格式错误：${expectedArgument || expected}`);
}

const files = {
  VERSION: fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim(),
  'backend/package.json': readJSON('backend/package.json').version,
  'backend/package-lock.json': readJSON('backend/package-lock.json').version,
  'backend/package-lock.json packages[""]': readJSON('backend/package-lock.json').packages[''].version,
  'frontend/package.json': readJSON('frontend/package.json').version,
  'frontend/package-lock.json': readJSON('frontend/package-lock.json').version,
  'frontend/package-lock.json packages[""]': readJSON('frontend/package-lock.json').packages[''].version
};

const mismatches = Object.entries(files).filter(([, value]) => value !== expected);
if (mismatches.length) {
  for (const [file, value] of mismatches) console.error(`${file}: ${value}，应为 ${expected}`);
  process.exit(1);
}

console.log(`版本一致性检查通过：v${expected}（${Object.keys(files).length} 处）`);
