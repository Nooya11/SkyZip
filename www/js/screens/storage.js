// 보관함 ⇄ 놀이터 (옆으로 넘기기)
import { back, go } from '../nav.js';
import { slotName, speciesById } from '../species.js';
import { boltagus, freeBottles, state } from '../store.js';
import { $, $$, ICON, bottle, esc, face, shortDate, toast } from '../ui.js';

const PET_LINES = ['헤헤', '쫀득', '더 해줘', '간지러워', '좋아…', '♪'];

export async function render(root, [page]) {
  const [free, bols] = await Promise.all([freeBottles(), boltagus()]);
  state.selected = state.selected.filter((id) => free.some((b) => b.id === id));

  root.innerHTML = `
    <header class="bar bar--paper">
      <button class="bar__btn" data-act="back">${ICON.back}</button>
      <nav class="tabs"><button data-page="0">보관함</button><button data-page="1">놀이터</button></nav>
      <span class="bar__btn"></span>
    </header>

    <div class="pager">
      <section class="pager__page shelfroom">
        <h3 class="section-title">모은 병 <small>${free.length}</small></h3>
        ${free.length ? `<div class="jar-grid">
          ${free.map((b) => `<button class="jar" data-id="${b.id}">
            ${bottle({ size: 'sm', color: b.color })}
            <span class="jar__meta">${shortDate(b.date)}<br>${slotName(b.slot)}</span>
            <i class="jar__no"></i>
          </button>`).join('')}
        </div>` : '<p class="empty">아직 모은 병이 없어요.<br>홈에서 하늘을 채집해 병에 담아보세요.</p>'}

        <h3 class="section-title">태어난 볼따구 <small>${bols.length}</small></h3>
        ${bols.length ? `<div class="bol-grid">
          ${bols.slice().reverse().map((b) => `<button class="bol" data-bol="${b.id}">
            ${face(b.species, { color: b.color, size: 'sm' })}
            <span>${esc(b.name)}</span>
          </button>`).join('')}
        </div>` : '<p class="empty">병 세 개로 첫 번째 볼따구를 만들어보세요.</p>'}

        <div class="actionbar">
          <div class="actionbar__picked"></div>
          <button class="btn btn--primary" data-act="make">볼따구 만들기</button>
        </div>
      </section>

      <section class="pager__page playground">
        <div class="playground__sky"></div>
        <div class="playground__field"></div>
        ${bols.length ? '' : '<p class="empty playground__empty">여기는 볼따구들이 노는 곳이에요.<br>아직은 조용하네요.</p>'}
        <button class="dex-btn" data-act="dex" aria-label="볼따구 도감">${ICON.book}<span>도감</span></button>
      </section>
    </div>`;

  // ── 페이저 ──
  const pager = $('.pager', root);
  const tabs = $$('.tabs button', root);
  const syncTabs = () => {
    const i = Math.round(pager.scrollLeft / pager.clientWidth);
    tabs.forEach((t, k) => t.classList.toggle('on', k === i));
  };
  pager.addEventListener('scroll', syncTabs, { passive: true });
  tabs.forEach((t) => (t.onclick = () => pager.scrollTo({ left: t.dataset.page * pager.clientWidth, behavior: 'smooth' })));
  if (page === '1') requestAnimationFrame(() => { pager.scrollLeft = pager.clientWidth; syncTabs(); });
  syncTabs();

  // ── 병 고르기 (최대 3) ──
  const refresh = () => {
    $$('.jar', root).forEach((j) => {
      const n = state.selected.indexOf(j.dataset.id);
      j.classList.toggle('is-picked', n >= 0);
      $('.jar__no', j).textContent = n >= 0 ? n + 1 : '';
    });
    const picked = state.selected.map((id) => free.find((b) => b.id === id));
    $('.actionbar__picked', root).innerHTML = [0, 1, 2].map((k) =>
      picked[k] ? `<span class="mini-drop" style="--c:${picked[k].color}"></span>` : '<span class="mini-drop is-empty"></span>').join('')
      + `<em>${picked.length}/3</em>`;
    const make = $('[data-act="make"]', root);
    make.disabled = picked.length !== 3;
    root.classList.toggle('has-picked', picked.length > 0);
  };
  refresh();

  root.addEventListener('click', (e) => {
    const jar = e.target.closest('.jar');
    if (jar) {
      const id = jar.dataset.id;
      if (state.selected.includes(id)) state.selected = state.selected.filter((x) => x !== id);
      else if (state.selected.length >= 3) toast('병은 세 개까지 고를 수 있어요');
      else state.selected.push(id);
      return refresh();
    }
    const bol = e.target.closest('[data-bol]');
    if (bol) return go(`boltagu/${bol.dataset.bol}`);
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'back') back();
    if (act === 'dex') go('dex');
    if (act === 'make' && state.selected.length === 3) go('birth');
  });

  // ── 놀이터 ──
  const stopPlay = playground($('.playground__field', root), bols.slice(-8));
  return stopPlay;
}

// 볼따구들이 어슬렁거리는 곳. 톡 치면 쓰다듬기, 옆으로 끌면 볼이 쭈욱 늘어난다.
function playground(field, bols) {
  const timers = new Map(); // 볼따구별 다음 산책 타이머
  field.innerHTML = bols.map((b, i) => `<div class="critter" data-i="${i}" style="--x:${10 + ((i * 37) % 70)}%;--y:${(i * 23) % 40}%">
      <span class="critter__say"></span>
      ${face(b.species, { color: b.color, size: 'md' })}
      <span class="critter__name">${esc(b.name)}</span>
    </div>`).join('');

  $$('.critter', field).forEach((el, i) => {
    const body = $('.face', el);
    // 어슬렁
    const wander = () => {
      if (!el.classList.contains('is-held')) {
        const x = 6 + Math.random() * 74;
        const cur = parseFloat(el.style.getPropertyValue('--x'));
        el.classList.toggle('is-left', x < cur);
        el.style.setProperty('--x', x + '%');
        el.style.setProperty('--y', Math.random() * 45 + '%');
      }
      timers.set(i, setTimeout(wander, 3500 + Math.random() * 4000));
    };
    timers.set(i, setTimeout(wander, 600 + i * 400));

    // 볼 늘리기 / 쓰다듬기
    let x0 = null, pulled = false;
    el.addEventListener('pointerdown', (e) => {
      x0 = e.clientX; pulled = false;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-held');
      body.classList.remove('boing');
    });
    el.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 6) pulled = true;
      if (!pulled) return;
      const s = 1 + Math.min(Math.abs(dx), 160) / 160 * 0.9;
      body.style.transformOrigin = dx > 0 ? 'left center' : 'right center';
      body.style.setProperty('--sx', s);
      body.style.setProperty('--sy', 1 - (s - 1) * 0.25);
      body.classList.toggle('pull-r', dx > 0);
      body.classList.toggle('pull-l', dx < 0);
    });
    const release = () => {
      if (x0 === null) return;
      x0 = null;
      el.classList.remove('is-held');
      if (pulled) {
        body.style.setProperty('--sx', 1);
        body.style.setProperty('--sy', 1);
        body.classList.remove('pull-l', 'pull-r');
        body.classList.add('boing');
        say(el, '말랑');
      } else {
        body.classList.remove('petted'); void body.offsetWidth; body.classList.add('petted');
        heart(el);
        say(el, PET_LINES[Math.floor(Math.random() * PET_LINES.length)]);
      }
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  });
  return () => timers.forEach((t) => clearTimeout(t));
}

function say(el, text) {
  const b = $('.critter__say', el);
  b.textContent = text;
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
}

function heart(el) {
  const h = document.createElement('span');
  h.className = 'heart';
  h.textContent = '♥';
  h.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
  el.append(h);
  setTimeout(() => h.remove(), 1100);
}
