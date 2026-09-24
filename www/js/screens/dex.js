// 도감: 17종. 못 만난 종은 검은 실루엣 + 물음표, 히든은 실루엣조차 숨긴다.
import { back, go } from '../nav.js';
import { SPECIES, dexNo, recipe } from '../species.js';
import { boltagus } from '../store.js';
import { ICON, esc, face, modal } from '../ui.js';

export async function render(root) {
  const bols = await boltagus();
  const met = new Map(); // species → 가장 최근에 태어난 아이
  for (const b of bols) met.set(b.species, b);
  const count = (id) => bols.filter((b) => b.species === id).length;

  root.innerHTML = `
    <header class="bar bar--paper">
      <button class="bar__btn" data-act="back">${ICON.back}</button>
      <span class="bar__title">볼따구 도감</span>
      <span class="bar__btn dex-progress">${met.size}/${SPECIES.length}</span>
    </header>
    <div class="dex">
      ${SPECIES.map((sp) => {
        const b = met.get(sp.id);
        if (b) return `<button class="dex__cell" data-sp="${sp.id}">
          <span class="dex__no">${dexNo(sp.id)}</span>${face(sp.id, { color: b.color, size: 'sm' })}<span class="dex__name">${sp.name}</span></button>`;
        if (sp.kind === 'hidden') return `<button class="dex__cell is-hidden" data-sp="${sp.id}">
          <span class="dex__no">${dexNo(sp.id)}</span><span class="dex__secret">?</span><span class="dex__name">???</span></button>`;
        return `<button class="dex__cell is-unknown" data-sp="${sp.id}">
          <span class="dex__no">${dexNo(sp.id)}</span>${face(sp.id, { size: 'sm', silhouette: true })}<b class="dex__q">?</b><span class="dex__name">???</span></button>`;
      }).join('')}
    </div>`;

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="back"]')) return back('storage');
    const cell = e.target.closest('[data-sp]');
    if (!cell) return;
    const sp = SPECIES.find((s) => s.id === cell.dataset.sp);
    const b = met.get(sp.id);
    if (b) {
      modal({
        title: `No.${dexNo(sp.id)} ${sp.name}`,
        body: `<div class="dex-sheet">${face(sp.id, { color: b.color, size: 'md' })}
          <p class="muted">${recipe(sp)} · 만난 수 ${count(sp.id)}</p><p>${sp.desc}</p></div>`,
        actions: [{ label: '닫기', value: null }, { label: `${esc(b.name)} 보러 가기`, value: b.id, primary: true }],
      }).then((id) => id && go(`boltagu/${id}`));
    } else {
      modal({
        title: `No.${dexNo(sp.id)} ???`,
        body: sp.kind === 'hidden'
          ? '<p>아직 아무도 본 적 없는 볼따구예요.<br>시간이 아니라, 하늘의 <b>색</b>이 부른대요.</p>'
          : `<p>이 아이는 <b>${recipe(sp)}</b>의 하늘을 좋아한대요.</p>`,
        actions: [{ label: '닫기', value: null, primary: true }],
      });
    }
  });
}
