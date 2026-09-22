import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire('C:/Users/phunm/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const sharp = require('sharp');
const base='C:/Users/phunm/.codex/generated_images/01a0c40d-fdef-7943-84d6-d2dd6afb69de/';
const assets={french:'exec-6ce56de4-385d-4753-aa2e-5741085d3479.png','cat-eye':'exec-465fd04b-fea2-46f7-a7ca-3bfe18faddd9.png',cherry:'exec-4e941433-2778-40fe-89b8-9ec42464ad6e.png',glazed:'exec-2ed09156-07de-4117-b54c-347d43e0c80a.png'};
await mkdir('public/images',{recursive:true});
for(const [key,path] of Object.entries(assets)) await sharp(base+path).resize(1000).webp({quality:85}).toFile(`public/images/${key}.webp`);
