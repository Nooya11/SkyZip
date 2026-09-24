// 공용 컴포넌트 · 유틸
import { mix, readableOn } from './color.js';
import { speciesById } from './species.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 날짜 ─────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hm = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
export function longDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return `${y}. ${pad(m)}. ${pad(d)} (${DOW[new Date(y, m - 1, d).getDay()]})`;
}
export const shortDate = (key) => key.slice(5).replace('-', '.');
// 필름 카메라 날짜 각인 스타일: '26 09 25  18:42
export function filmStamp(ts) {
  const d = new Date(ts);
  return `'${String(d.getFullYear()).slice(2)} ${pad(d.getMonth() + 1)} ${pad(d.getDate())}  ${hm(ts)}`;
}

// 받침 여부로 조사 선택
export function josa(word, withBatchim, without) {
  const c = word.charCodeAt(word.length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return word + (has ? withBatchim : without);
}

// ── 병 컴포넌트 ──────────────────────────────────
// 목 + 몸통 + 차오르는 fill + 유리 하이라이트. 크기 xl / md / sm / xs.
export function bottle({ color = null, level = 0.82, size = 'md', cork = true, cls = '', attrs = '' } = {}) {
  const fill = color ?? 'transparent';
  const style = `--fill:${fill};--fill-top:${color ? mix(color, '#ffffff', 0.35) : 'transparent'};--level:${color ? level : 0}`;
  return `<div class="bottle bottle--${size} ${color ? '' : 'bottle--empty'} ${cls}" style="${style}" ${attrs}>
    ${cork ? '<span class="bottle__cork"></span>' : ''}
    <span class="bottle__neck"></span>
    <span class="bottle__body"><span class="bottle__fill"></span><span class="bottle__shine"></span></span>
  </div>`;
}

// ── 볼따구 얼굴 ──────────────────────────────────
// silhouette: 도감에서 아직 못 만난 종. 일러스트든 이모티콘이든 brightness(0) 한 줄로 실루엣이 된다.
export function face(speciesId, { color = '#C9D3DC', size = 'md', silhouette = false, cls = '', attrs = '' } = {}) {
  const sp = speciesById(speciesId);
  const inner = sp.img
    ? `<img class="face__img" src="${sp.img}" alt="">`
    : `<span class="face__eyes">${esc(sp.face)}</span><span class="face__cheek face__cheek--l"></span><span class="face__cheek face__cheek--r"></span>`;
  return `<div class="face face--${size} ${silhouette ? 'face--silhouette' : ''} ${cls}" style="--c:${color};--ink-on:${readableOn(color)}" ${attrs}>${inner}</div>`;
}

// ── 토스트 / 모달 ────────────────────────────────
export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 400); }, 2200);
}

export function modal({ title, body, actions }) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'modal';
    el.innerHTML = `<div class="modal__card">
      <h3 class="modal__title">${title}</h3>
      <div class="modal__body">${body}</div>
      <div class="modal__actions">${actions.map((a, i) => `<button class="btn ${a.primary ? 'btn--primary' : 'btn--ghost'}" data-i="${i}">${a.label}</button>`).join('')}</div>
    </div>`;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      el.classList.remove('is-in');
      setTimeout(() => el.remove(), 300);
      resolve(actions[b.dataset.i].value);
    });
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
  });
}

// ── 좌우 스와이프 ────────────────────────────────
export function onSwipe(el, cb) {
  let x0 = null, y0 = 0;
  el.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
  el.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) cb(dx < 0 ? 1 : -1);
  });
  el.addEventListener('pointercancel', () => { x0 = null; });
}

// ── 아이콘 (선 드로잉, 잉크색) ───────────────────
const svg = (d, extra = '') => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const ICON = {
  back: svg('<path d="M19 7l-9 9 9 9"/>'),
  prev: svg('<path d="M19 8l-8 8 8 8"/>'),
  next: svg('<path d="M13 8l8 8-8 8"/>'),
  close: svg('<path d="M9 9l14 14M23 9L9 23"/>'),
  shelf: svg('<path d="M5 25h22M5 14h22"/><path d="M9 14v-3.5a1 1 0 011-1h1.5a1 1 0 011 1V14M17 14V8.5a1 1 0 011-1h1a1 1 0 011 1V14M11 25v-4.5a1.2 1.2 0 011.2-1.2h1.6a1.2 1.2 0 011.2 1.2V25M20 25v-3a1 1 0 011-1h1a1 1 0 011 1v3"/>'),
  diary: svg('<rect x="8" y="5" width="17" height="22" rx="2"/><path d="M8 9H6M8 14H6M8 19H6M8 24H6M13 11h8M13 15h6"/>'),
  book: svg('<path d="M16 9c-3-2-7-2.5-10-2v17c3-.5 7 0 10 2 3-2 7-2.5 10-2V7c-3-.5-7 0-10 2zM16 9v17"/>'),
  pen: svg('<path d="M7 25l2-6L21 7l4 4-12 12-6 2zM18 10l4 4"/>'),
  image: svg('<rect x="5" y="7" width="22" height="18" rx="2"/><circle cx="12" cy="13" r="2"/><path d="M27 21l-6-6-12 10"/>'),
  sparkle: svg('<path d="M16 5v6M16 21v6M5 16h6M21 16h6M9 9l3 3M20 20l3 3M23 9l-3 3M12 20l-3 3"/>'),
};

// 날씨는 이미지로 고른다
export const WEATHER = [
  { id: 'sun', label: '맑음', svg: svg('<circle cx="16" cy="16" r="5.5"/><path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M24.5 7.5l-2 2M9.5 22.5l-2 2"/>') },
  { id: 'partly', label: '구름 조금', svg: svg('<circle cx="12" cy="12" r="4.5"/><path d="M12 3.5v2M3.5 12h2M6 6l1.4 1.4M18 6l-1.4 1.4"/><path d="M13 26h11a4.5 4.5 0 00-.6-9 6 6 0 00-11.3 1.4A3.8 3.8 0 0013 26z"/>') },
  { id: 'cloud', label: '흐림', svg: svg('<path d="M9 24h15a5 5 0 00-.8-9.9A7 7 0 009.8 16 4 4 0 009 24z"/>') },
  { id: 'rain', label: '비', svg: svg('<path d="M9 19h15a5 5 0 00-.8-9.9A7 7 0 009.8 11 4 4 0 009 19z"/><path d="M11 23l-1.5 3M17 23l-1.5 3M23 23l-1.5 3"/>') },
  { id: 'snow', label: '눈', svg: svg('<path d="M9 18h15a5 5 0 00-.8-9.9A7 7 0 009.8 10 4 4 0 009 18z"/><path d="M11 23v.1M16 26v.1M21 23v.1M13.5 28v.1M18.5 28v.1" stroke-width="2.6"/>') },
];
