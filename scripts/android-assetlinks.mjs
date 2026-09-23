import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const ANDROID_PACKAGE_ID = 'site.hotlah.app';
const fingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function normalizeFingerprint(input) {
  const value = input.trim().toUpperCase();
  if (!fingerprintPattern.test(value)) {
    throw new Error(`Invalid SHA-256 certificate fingerprint: ${input}`);
  }
  return value;
}

export function createAssetLinks(fingerprints) {
  const unique = [...new Set(fingerprints.map(normalizeFingerprint))];
  if (!unique.length) throw new Error('Provide at least one signing certificate SHA-256 fingerprint.');
  return [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: ANDROID_PACKAGE_ID,
      sha256_cert_fingerprints: unique,
    },
  }];
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const contents = JSON.stringify(createAssetLinks(process.argv.slice(2)), null, 2) + '\n';
    const output = resolve(dirname(fileURLToPath(import.meta.url)), '../public/.well-known/assetlinks.json');
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, contents, 'utf8');
    console.log(`Wrote ${output}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
