// 볼따구 카드: 도감 한 장처럼
import { db, photoURL } from '../db.js';
import { back, go } from '../nav.js';
import { dexNo, recipe, slotName, speciesById } from '../species.js';
import { rename } from '../store.js';
import { $, ICON, esc, face, hm, longDate, dateKey, shortDate } from '../ui.js';

export async function render(root, [id]) {
  const bol = await db.get('boltagus', id);
  if (!bol) return go('storage', { replace: true });
  const sp = speciesById(bol.species);
  const skies = await Promise.all(bol.photoIds.map((pid) => db.get('photos', pid)));
  root.style.setProperty('--c', bol.color);

  root.innerHTML = `
    <header class="bar bar--paper">
      <button class="bar__btn" data-act="back">${ICON.back}</button>
      <span class="bar__title">볼따구 카드</span>
      <span class="bar__btn"></span>
    </header>
    <article class="card">
      <p class="card__no">No.${dexNo(sp.id)} · ${sp.name}${sp.kind === 'hidden' ? ' <em>HIDDEN</em>' : ''}</p>
      <div class="card__hero">${face(sp.id, { color: bol.color, size: 'xl' })}</div>
      <button class="card__name" data-act="rename" title="이름 바꾸기">${esc(bol.name)}</button>
      <dl class="card__facts">
        <div><dt>탄생일</dt><dd>${longDate(dateKey(new Date(bol.born)))}</dd></div>
        <div><dt>재료</dt><dd>${recipe(sp)}</dd></div>
        <div><dt>빛깔</dt><dd><span class="mini-drop" style="--c:${bol.color}"></span>${bol.color.toUpperCase()}</dd></div>
      </dl>
      <p class="card__desc">${sp.desc}</p>
      <h4 class="card__sub">재료가 된 하늘</h4>
      <div class="card__skies">
        ${skies.map((p) => p ? `<button class="sky" data-photo="${p.id}">
          <img src="${photoURL(p)}" alt="">
          <span>${shortDate(p.date)} ${slotName(p.slot)} ${hm(p.ts)}</span>
        </button>` : '').join('')}
      </div>
    </article>`;

  root.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-act], [data-photo]');
    if (!t) return;
    if (t.dataset.photo) go(`viewer/${t.dataset.photo}`);
    if (t.dataset.act === 'back') back('storage');
    if (t.dataset.act === 'rename') {
      const name = prompt('새 이름', bol.name)?.trim();
      if (name) { bol.name = name.slice(0, 10); await rename(bol.id, bol.name); t.textContent = bol.name; }
    }
  });
  $('.card__hero .face', root).addEventListener('click', (e) => {
    e.currentTarget.classList.remove('petted'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('petted');
  });
}
