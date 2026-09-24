// 다이어리: 스프링 노트 한 장 = 하루. 날짜 · 날씨 · 기분 → 그날의 사진 → 메모
import { photoURL } from '../db.js';
import { back, go } from '../nav.js';
import { day, photos, saveDay } from '../store.js';
import { $, $$, ICON, WEATHER, dateKey, esc, filmStamp, longDate, onSwipe } from '../ui.js';

export async function render(root, [dateParam]) {
  const all = await photos();
  const today = dateKey();
  const dates = [...new Set([...all.map((p) => p.date), today])].sort();
  const date = dates.includes(dateParam) ? dateParam : (all.some((p) => p.date === today) || !all.length ? today : all.at(-1).date);
  const idx = dates.indexOf(date);
  const list = all.filter((p) => p.date === date);
  const d = await day(date);

  root.innerHTML = `
    <header class="bar bar--paper">
      <button class="bar__btn" data-act="back">${ICON.back}</button>
      <span class="bar__title">다이어리</span>
      <span class="bar__btn"></span>
    </header>

    <div class="notebook">
      <div class="spiral" aria-hidden="true">${'<i></i>'.repeat(11)}</div>
      <article class="page">
        <div class="page__nav">
          <button class="icon-btn" data-step="-1" ${idx === 0 ? 'disabled' : ''} aria-label="이전 날">${ICON.prev}</button>
          <h2 class="page__date">${longDate(date)}</h2>
          <button class="icon-btn" data-step="1" ${idx === dates.length - 1 ? 'disabled' : ''} aria-label="다음 날">${ICON.next}</button>
        </div>

        <div class="page__meta">
          <div class="weather" role="radiogroup" aria-label="날씨">
            ${WEATHER.map((w) => `<button class="weather__opt ${d.weather === w.id ? 'on' : ''}" data-w="${w.id}" title="${w.label}" aria-label="${w.label}">${w.svg}</button>`).join('')}
          </div>
          <label class="mood"><span>기분</span><input maxlength="16" placeholder="어떤 하루였어요?" value="${esc(d.mood)}"></label>
        </div>

        ${list.length ? `<div class="page__grid">
          ${list.map((p) => `<button class="thumb" data-id="${p.id}" aria-label="${filmStamp(p.ts)}">
            <img src="${photoURL(p)}" alt="" loading="lazy">
          </button>`).join('')}
        </div>` : `<p class="page__empty">이 날은 아직 채집한 하늘이 없어요.<br>고개를 들어 하늘을 한 번 봐 주세요.</p>`}

        <textarea class="page__note hand" placeholder="오늘의 하늘을 적어두는 곳">${esc(d.note)}</textarea>
      </article>
    </div>`;

  let timer, dirty = false;
  const save = () => { dirty = true; clearTimeout(timer); timer = setTimeout(() => saveDay(d), 350); };

  $('[data-act="back"]', root).onclick = () => back();
  $$('[data-step]', root).forEach((b) => (b.onclick = () => go(`diary/${dates[idx + Number(b.dataset.step)]}`, { replace: true })));
  onSwipe($('.page__grid, .page__empty', root), (dir) => {
    const next = dates[idx + dir];
    if (next) go(`diary/${next}`, { replace: true });
  });
  $$('.weather__opt', root).forEach((b) => (b.onclick = () => {
    d.weather = d.weather === b.dataset.w ? null : b.dataset.w;
    $$('.weather__opt', root).forEach((o) => o.classList.toggle('on', o.dataset.w === d.weather));
    save();
  }));
  $('.mood input', root).oninput = (e) => { d.mood = e.target.value; save(); };
  $('.page__note', root).oninput = (e) => { d.note = e.target.value; save(); };
  $$('.thumb', root).forEach((t) => (t.onclick = () => go(`viewer/${t.dataset.id}`)));

  return () => { clearTimeout(timer); if (dirty) saveDay(d); };
}
