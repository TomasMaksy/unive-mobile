#!/usr/bin/env node
/**
 * Compares the app's palette (src/theme/palette.ts) with the brand book's
 * tokens (unive-brand/src/app/globals.css) and lists anything that drifted.
 *
 *   npm run brand:check
 *   BRAND_DIR=/path/to/unive-brand npm run brand:check
 *
 * Exits 1 when a shared colour has a different value, so it can run in CI.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = process.env.BRAND_DIR ?? join(root, '..', 'unive-brand');
const cssPath = join(brandDir, 'src/app/globals.css');

let css;
try {
  css = readFileSync(cssPath, 'utf8');
} catch {
  console.error(`Can't read ${cssPath}. Clone github.com/TomasMaksy/unive-branding next to this repo as ../unive-brand, or set BRAND_DIR.`);
  process.exit(2);
}

const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// The brand's raw colours: `--name: #hex;` inside :root.
const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const brand = new Map();
for (const [, name, hex] of rootBlock.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  brand.set(camel(name), hex.toLowerCase());
}

const paletteSrc = readFileSync(join(root, 'src/theme/palette.ts'), 'utf8');
const app = new Map();
for (const [, key, hex] of paletteSrc.matchAll(/^\s*([a-zA-Z0-9]+):\s*'(#[0-9a-fA-F]{3,8})'/gm)) {
  app.set(key, hex.toLowerCase());
}

// Brand names the app spells differently.
const aliases = { input: 'input', border: 'border' };

let drift = 0;
for (const [key, hex] of brand) {
  const appKey = aliases[key] ?? key;
  if (!app.has(appKey)) {
    // Semantic slots like --card (#ffffff) map to roles in colors.ts, not palette entries.
    if (!['card', 'popover'].includes(key)) console.log(`  missing  ${key} ${hex}  (in the brand, not in palette.ts)`);
    continue;
  }
  if (app.get(appKey) !== hex) {
    console.log(`  DRIFT    ${appKey}: app ${app.get(appKey)}, brand ${hex}`);
    drift++;
  }
}
for (const [key, hex] of app) {
  if (!brand.has(key) && !['white', 'stoneDeep'].includes(key)) console.log(`  app-only ${key} ${hex}  (not a brand variable)`);
}

if (drift) {
  console.log(`\n${drift} colour(s) differ from the brand. Update src/theme/palette.ts.`);
  process.exit(1);
}
console.log(`Palette matches the brand (${brand.size} brand colours checked).`);
