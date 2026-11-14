#!/usr/bin/env node
/**
 * Release ciktisinin dogru keystore ile imzalandigini dogrular.
 *
 *   node scripts/verify-signing.js aab
 *   node scripts/verify-signing.js apk
 *
 * android/keystore.properties'teki keystore'un SHA-256 parmak izini,
 * uretilen dosyanin imza sertifikasindaki parmak izi ile karsilastirir.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');

const kind = (process.argv[2] || 'aab').toLowerCase();
const ARTIFACTS = {
  aab: path.join(ANDROID, 'app/build/outputs/bundle/release/app-release.aab'),
  apk: path.join(ANDROID, 'app/build/outputs/apk/release/app-release.apk'),
};

function fail(msg) {
  console.error('\x1b[31m[HATA]\x1b[0m ' + msg);
  process.exit(1);
}
function ok(msg) {
  console.log('\x1b[32m[OK]\x1b[0m ' + msg);
}

if (!ARTIFACTS[kind]) fail(`Bilinmeyen tur "${kind}". Kullanim: aab | apk`);

const artifact = ARTIFACTS[kind];
if (!fs.existsSync(artifact)) {
  fail(`Cikti bulunamadi: ${artifact}\n       Once "npm run build:${kind}" calistir.`);
}

// --- keystore.properties oku ---
const propsPath = path.join(ANDROID, 'keystore.properties');
if (!fs.existsSync(propsPath)) fail(`android/keystore.properties yok.`);

const props = {};
for (const line of fs.readFileSync(propsPath, 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) props[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const storeFile = path.resolve(ANDROID, props.storeFile || '');
if (!fs.existsSync(storeFile)) fail(`Keystore bulunamadi: ${storeFile}`);

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function sha256Of(text) {
  const m = text.match(/SHA-?256:\s*((?:[0-9A-F]{2}:){31}[0-9A-F]{2})/i);
  return m ? m[1].toUpperCase() : null;
}

// --- Beklenen parmak izi (keystore'dan) ---
let expected;
try {
  const out = run('keytool', [
    '-list', '-v',
    '-keystore', storeFile,
    '-alias', props.keyAlias,
    '-storepass', props.storePassword,
  ]);
  expected = sha256Of(out);
} catch (e) {
  fail('keytool calistirilamadi veya keystore sifresi hatali.\n' + (e.stderr || e.message));
}
if (!expected) fail('Keystore parmak izi okunamadi.');

// --- Gercek parmak izi (imzali dosyadan) ---
let actualOut;
try {
  actualOut = run('jarsigner', ['-verify', '-verbose:summary', '-certs', artifact]);
} catch (e) {
  fail('jarsigner dogrulamasi basarisiz:\n' + (e.stdout || e.stderr || e.message));
}
if (!/jar verified/i.test(actualOut)) {
  fail('Dosya imzasi dogrulanamadi (jar verified degil).\n' + actualOut);
}
const actual = sha256Of(actualOut);

console.log('');
console.log('  Dosya    : ' + path.relative(ROOT, artifact));
console.log('  Boyut    : ' + (fs.statSync(artifact).size / 1024 / 1024).toFixed(2) + ' MB');
console.log('  Alias    : ' + props.keyAlias);
console.log('  Beklenen : ' + expected);
console.log('  Bulunan  : ' + (actual || '(okunamadi)'));
console.log('');

if (!actual) fail('Ciktidan sertifika parmak izi okunamadi.');
if (actual !== expected) {
  fail('IMZA UYUSMUYOR! Bu dosyayi Play Store\'a YUKLEME.\n' +
       '       Muhtemelen debug key ile imzalandi (keystore.properties okunmamis).');
}
ok('Imza dogru. Play Console\'a yuklenebilir.');
