// 다이어리 뷰어: 큰 사진 + 한 줄 메모. 좌우로 넘기며 지난 하늘을 본다.
import { photoURL } from '../db.js';
import { back } from '../nav.js';
import { slotName } from '../species.js';
import { photos, updateMemo } from '../store.js';
import { $, ICON, esc, longDate, onSwipe } from '../ui.js';

export async function render(root, [id]) {
  const all = await photos();
  let i = Math.max(0, all.findIndex((p) => p.id === id));
  if (!all.length) return back('diary');

  root.innerHTML = `
    <header class="bar bar--dark">
      <button class="bar__btn" data-act="back">${ICON.back}</button>
      <span class="bar__title viewer__when"></span>
      <span class="bar__btn viewer__count"></span>
    </header>
    <div class="viewer__stage"><img alt=""></div>
    <div class="viewer__memo"></div>
    <div class="viewer__arrows">
      <button class="icon-btn" data-step="-1" aria-label="이전 사진">${ICON.prev}</button>
      <button class="icon-btn" data-step="1" aria-label="다음 사진">${ICON.next}</button>
    </div>`;

  const img = $('.viewer__stage img', root);
  const memoEl = $('.viewer__memo', root);

  const show = (dir = 0) => {
    const p = all[i];
    img.classList.remove('from-l', 'from-r');
    void img.offsetWidth;
    if (dir) img.classList.add(dir > 0 ? 'from-r' : 'from-l');
    img.src = photoURL(p);
    $('.viewer__when', root).textContent = `${longDate(p.date)} · ${slotName(p.slot)}`;
    $('.viewer__count', root).textContent = `${i + 1} / ${all.length}`;
    root.querySelector('[data-step="-1"]').disabled = i === 0;
    root.querySelector('[data-step="1"]').disabled = i === all.length - 1;
    memoEl.innerHTML = p.memo
      ? `<button class="viewer__text" data-act="edit">${esc(p.memo)}</button>`
      : `<button class="viewer__text is-empty" data-act="edit">한 줄 글을 남겨보세요</button>`;
    history.replaceState(null, '', `#/viewer/${p.id}`);
  };
  const step = (dir) => {
    if (!all[i + dir]) return;
    i += dir;
    show(dir);
  };

  const edit = () => {
    const p = all[i];
    memoEl.innerHTML = `<form class="viewer__form"><input maxlength="40" value="${esc(p.memo)}" placeholder="한 줄 글을 남겨보세요"><button class="btn btn--small">완료</button></form>`;
    const input = $('input', memoEl);
    input.focus();
    $('form', memoEl).onsubmit = async (e) => {
      e.preventDefault();
      p.memo = input.value.trim();
      await updateMemo(p.id, p.memo);
      show();
    };
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act], [data-step]');
    if (!t) return;
    if (t.dataset.act === 'back') back('diary');
    if (t.dataset.act === 'edit') edit();
    if (t.dataset.step) step(Number(t.dataset.step));
  });
  onSwipe($('.viewer__stage', root), step);
  show();
}
