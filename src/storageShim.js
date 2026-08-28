// LedgerLab.jsx was originally built for Claude.ai's artifact sandbox, which
// provides a `window.storage` API for persistence. That API doesn't exist in
// a normal browser, so this shim reproduces the same get/set/delete/list
// interface using plain localStorage — no other code in LedgerLab.jsx needs
// to change.

const PREFIX = "ledgerlab:";

function readAll() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      out[key.slice(PREFIX.length)] = localStorage.getItem(key);
    }
  }
  return out;
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key /*, shared */) {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return { key, value: raw, shared: false };
    },
    async set(key, value /*, shared */) {
      localStorage.setItem(PREFIX + key, value);
      return { key, value, shared: false };
    },
    async delete(key /*, shared */) {
      const existed = localStorage.getItem(PREFIX + key) !== null;
      localStorage.removeItem(PREFIX + key);
      return { key, deleted: existed, shared: false };
    },
    async list(prefix /*, shared */) {
      const all = readAll();
      const keys = Object.keys(all).filter((k) => !prefix || k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}
