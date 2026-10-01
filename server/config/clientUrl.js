// Where links in emails (password reset, email confirmation…) point.
//
//  - CLIENT_URL set (production: the deployed site) → always that.
//  - Not set (local development) → this PC's address on the Wi-Fi / LAN,
//    e.g. https://192.168.1.40:5173, NOT "localhost": an email is often
//    opened on a phone, where "localhost" means the phone itself and the
//    link fails with "localhost refused to connect". The LAN address works
//    on this PC and on any device on the same network.
const os = require('os');

const DEV_PORT = process.env.CLIENT_PORT || 5173;

// Real network adapters only — skip virtual ones (WSL, Hyper-V, Docker,
// VirtualBox, VPNs) whose addresses a phone can't reach.
const VIRTUAL = /vethernet|virtual|vmware|vbox|docker|wsl|hyper-v|loopback|tailscale|zerotier|tun|tap/i;
const isPrivate = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);

function lanAddress() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (VIRTUAL.test(name)) continue;
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal && isPrivate(a.address)) candidates.push({ name, ip: a.address });
    }
  }
  // home Wi-Fi / Ethernet first
  candidates.sort((x, y) => Number(/wi-?fi|wlan|ethernet|eth|en\d/i.test(y.name)) - Number(/wi-?fi|wlan|ethernet|eth|en\d/i.test(x.name)));
  return candidates[0]?.ip || null;
}

const fromEnv = (process.env.CLIENT_URL || '').trim();
const lan = fromEnv ? null : lanAddress();
const CLIENT_URL = (fromEnv || `https://${lan || 'localhost'}:${DEV_PORT}`).replace(/\/+$/, '');

if (!fromEnv) {
  console.log(`Email links will open ${CLIENT_URL}` + (lan ? ' (this PC on your network — works from your phone on the same Wi-Fi)' : ' (no network address found; links only work on this PC)'));
}

const clientLink = (path) => `${CLIENT_URL}${path}`;

module.exports = { CLIENT_URL, clientLink };
