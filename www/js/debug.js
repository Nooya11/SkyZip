// ?debug 로 열면 나오는 테스트 패널: 시간대 강제 · 가짜 하늘 병 만들기 · 초기화
import { db, flags, uid } from './db.js';
import { hex } from './color.js';
import { SLOTS } from './species.js';
import { dateKey } from './ui.js';

// 시간대별 대략적인 하늘색 — 가짜 사진을 그릴 때 쓴다
const SKY = {
  dawn: ['#3E4A6B', '#B79AB8'], morning: ['#7FB3E0', '#D6E8F5'], noon: ['#5E9FDB', '#BFDDF6'],
  evening: ['#F0A070', '#6C6FA0'], night: ['#141A33', '#3A3F66'],
};

export function mountDebug() {
  const el = document.createElement('aside');
  el.className = 'debug';
  el.innerHTML = `
    <b>debug</b>
    <label>시간대 <select>${['', ...SLOTS.map((s) => s.id)].map((id) =>
      `<option value="${id}">${id ? SLOTS.find((s) => s.id === id).name : '실제 시각'}</option>`).join('')}</select></label>
    <button data-d="fake">가짜 병 +1 (선택 시간대)</button>
    <button data-d="reset">전체 초기화</button>`;
  document.body.append(el);
  const sel = el.querySelector('select');
  sel.value = flags.get('debugSlot') || '';
  sel.onchange = () => { flags.set('debugSlot', sel.value); location.reload(); };

  el.onclick = async (e) => {
    const d = e.target.dataset.d;
    if (d === 'fake') {
      const slot = sel.value || 'noon';
      const [a, b] = SKY[slot];
      const jitter = (h) => hex(h.match(/\w\w/g).map((x) => Math.max(0, Math.min(255, parseInt(x, 16) + (Math.random() * 40 - 20)))));
      const c = document.createElement('canvas');
      c.width = 600; c.height = 700;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 700);
      g.addColorStop(0, jitter(a)); g.addColorStop(1, jitter(b));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 700);
      const { dominantColor } = await import('./color.js');
      const { color } = dominantColor(c);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8));
      const ts = Date.now();
      const photo = { id: uid(), ts, date: dateKey(), slot, color, memo: '', bottled: true, blob };
      await db.put('photos', photo);
      await db.put('bottles', { id: uid(), photoId: photo.id, ts, date: 'debug', slot, color, usedBy: null });
      location.reload();
    }
    if (d === 'reset' && confirm('모든 데이터를 지울까요?')) {
      await db.clear();
      flags.clear();
      location.hash = '';
      location.reload();
    }
  };
}
