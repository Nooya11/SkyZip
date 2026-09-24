// IndexedDB 래퍼. 사진은 Blob 으로 저장해 localStorage 용량 한계를 피한다.
//   photos   { id, ts, date, slot, color, memo, bottled }  + blob
//   bottles  { id, photoId, ts, date, slot, color, usedBy }   usedBy = 볼따구 id (null 이면 아직 병)
//   boltagus { id, species, name, born, color, bottleIds, photoIds }
//   days     { date, weather, mood, note }

const DB_NAME = 'haneul-chaejip';
const STORES = { photos: 'id', bottles: 'id', boltagus: 'id', days: 'date' };
let opening;

function open() {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      for (const [name, keyPath] of Object.entries(STORES)) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { keyPath });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opening;
}

async function run(store, mode, fn) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export const db = {
  all: (store) => run(store, 'readonly', (s) => s.getAll()),
  get: (store, key) => run(store, 'readonly', (s) => s.get(key)),
  put: (store, value) => run(store, 'readwrite', (s) => s.put(value)),
  del: (store, key) => run(store, 'readwrite', (s) => s.delete(key)),
  async clear() {
    for (const s of Object.keys(STORES)) await run(s, 'readwrite', (st) => st.clear());
  },
};

// 사진 Blob → object URL (id 별로 캐시)
const urls = new Map();
export function photoURL(photo) {
  if (!photo) return '';
  if (!urls.has(photo.id)) urls.set(photo.id, URL.createObjectURL(photo.blob));
  return urls.get(photo.id);
}

// 가벼운 설정값은 localStorage. 막혀 있는 환경이면 메모리로 대신한다.
const mem = {};
export const flags = {
  get(k) {
    try { return localStorage.getItem('hc.' + k) ?? mem[k] ?? null; } catch { return mem[k] ?? null; }
  },
  set(k, v) {
    mem[k] = String(v);
    try { localStorage.setItem('hc.' + k, String(v)); } catch { /* 메모리만 */ }
  },
  clear() {
    for (const k of Object.keys(mem)) delete mem[k];
    try { Object.keys(localStorage).filter((k) => k.startsWith('hc.')).forEach((k) => localStorage.removeItem(k)); } catch { /* noop */ }
  },
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
