// Εκτελείται από το GitHub Actions μετά το "npx cap add android".
// Προσθέτει δικαιώματα κάμερας, ελάχιστο SDK και εικονίδιο εφαρμογής.
const fs = require('fs');
const path = require('path');

const main = 'android/app/src/main';
const manifestPath = path.join(main, 'AndroidManifest.xml');
let m = fs.readFileSync(manifestPath, 'utf8');

const lines = [
  ['android.permission.CAMERA', '<uses-permission android:name="android.permission.CAMERA" />'],
  ['android.permission.WAKE_LOCK', '<uses-permission android:name="android.permission.WAKE_LOCK" />'],
  ['android.hardware.camera', '<uses-feature android:name="android.hardware.camera" android:required="false" />'],
];
for (const [key, xml] of lines) {
  if (!m.includes(key)) m = m.replace('</manifest>', `    ${xml}\n</manifest>`);
}
if (!m.includes('com.google.mlkit.vision.DEPENDENCIES')) {
  m = m.replace('</application>',
    '        <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui" />\n    </application>');
}
fs.writeFileSync(manifestPath, m);

// Το πρόσθετο σάρωσης QR (ML Kit) απαιτεί minSdk 23
const vPath = 'android/variables.gradle';
let v = fs.readFileSync(vPath, 'utf8');
v = v.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 23');
fs.writeFileSync(vPath, v);

// Εικονίδια: αντικατάσταση των προεπιλεγμένων
const res = path.join(main, 'res');
fs.rmSync(path.join(res, 'mipmap-anydpi-v26'), { recursive: true, force: true });
for (const d of fs.readdirSync('icons')) {
  const dest = path.join(res, d);
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(path.join('icons', d))) {
    fs.copyFileSync(path.join('icons', d, f), path.join(dest, f));
  }
}
console.log('Android project patched.');
