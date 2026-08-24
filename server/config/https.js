const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const CERT_DIR = path.join(__dirname, '..', '.certs');
const KEY_PATH = path.join(CERT_DIR, 'localhost-key.pem');
const CERT_PATH = path.join(CERT_DIR, 'localhost-cert.pem');

// Generates (or reuses) a self-signed cert for local HTTPS dev so the
// browser doesn't need a fresh "proceed anyway" click on every restart.
async function getDevHttpsOptions() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    return { key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) };
  }

  const pems = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 825 });
  fs.mkdirSync(CERT_DIR, { recursive: true });
  fs.writeFileSync(KEY_PATH, pems.private);
  fs.writeFileSync(CERT_PATH, pems.cert);
  return { key: pems.private, cert: pems.cert };
}

module.exports = { getDevHttpsOptions };
