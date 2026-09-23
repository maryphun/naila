import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createAssetLinks, normalizeFingerprint, ANDROID_PACKAGE_ID } from '../scripts/android-assetlinks.mjs';

const fingerprint = Array.from({ length: 32 }, (_, index) => index.toString(16).padStart(2, '0')).join(':');

test('asset links contain the approved Android package and unique normalized certificates', () => {
  const links = createAssetLinks([fingerprint, fingerprint.toUpperCase()]);
  assert.equal(links.length, 1);
  assert.equal(links[0].target.package_name, ANDROID_PACKAGE_ID);
  assert.deepEqual(links[0].target.sha256_cert_fingerprints, [fingerprint.toUpperCase()]);
});

test('invalid or missing certificate fingerprints are rejected', () => {
  assert.throws(() => createAssetLinks([]));
  assert.throws(() => normalizeFingerprint('not-a-fingerprint'));
});

test('Android application ID matches the asset links generator', async () => {
  const gradle = await readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
  assert.match(gradle, new RegExp(`applicationId '${ANDROID_PACKAGE_ID.replaceAll('.', '\\.')}'`));
  assert.match(gradle, /targetSdk 36/);
});
