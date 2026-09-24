// 캡처 결과: 스포이드로 한 방울 → 한 줄 남기기 → 병에 담기
import { go, back } from '../nav.js';
import { slotName } from '../species.js';
import { DAILY_LIMIT, collect, state, todayBottles } from '../store.js';
import { $, ICON, bottle, esc, hm, toast, wait } from '../ui.js';

export async function render(root) {
  const p = state.pending;
  if (!p) return go('home', { replace: true });
  const full = (await todayBottles()).length >= DAILY_LIMIT;
  let memo = '';

  root.innerHTML = `
    <header class="bar">
      <button class="bar__btn" data-act="retake">${ICON.back}<span>다시 찍기</span></button>
      <span class="bar__title">${slotName(p.slot)}의 하늘 · ${hm(p.ts)}</span>
      <span class="bar__btn"></span>
    </header>

    <div class="result">
      <figure class="photo-card">
        <div class="photo-card__img">
          <img src="${p.url}" alt="방금 채집한 하늘">
          <span class="dropper" style="--x:${p.spot[0]};--y:${p.spot[1]};--c:${p.color}">
            <svg viewBox="0 0 24 48"><path d="M8 1h8v11h2.5v4H16v19l-4 11-4-11V16H5.5v-4H8z"/></svg>
          </span>
        </div>
      </figure>

      <div class="drop-row">
        <span class="drop" style="--c:${p.color}"></span>
        <div class="drop-row__text">
          <b>오늘의 한 방울</b>
          <code>${p.color.toUpperCase()}</code>
        </div>
      </div>

      <div class="oneline">
        <button class="oneline__add" data-act="write">${ICON.pen}<span>한 줄 남기기</span></button>
      </div>
    </div>

    ${full ? `<p class="notice">오늘의 병은 이미 세 개 모두 채워졌어요.<br>이 하늘은 <b>사진으로만 다이어리에 저장</b>되고, 병에는 담기지 않아요.</p>` : ''}

    <footer class="result-foot">
      <button class="btn btn--primary btn--wide" data-act="save">${full ? '사진만 저장하기' : '병에 담기'}</button>
    </footer>`;

  // 스포이드가 색을 머금고 → 방울이 옆 스와치로 떨어지는 연출
  requestAnimationFrame(() => root.classList.add('is-dropping'));

  const line = $('.oneline', root);
  const showLine = () => {
    line.innerHTML = memo
      ? `<button class="oneline__text hand" data-act="write">“${esc(memo)}”</button>`
      : `<button class="oneline__add" data-act="write">${ICON.pen}<span>한 줄 남기기</span></button>`;
  };
  const edit = () => {
    line.innerHTML = `<form class="oneline__form">
      <input class="hand" maxlength="40" placeholder="이 하늘에게 한 마디" value="${esc(memo)}">
      <button class="btn btn--small">완료</button>
    </form>`;
    const input = $('input', line);
    input.focus();
    $('form', line).onsubmit = (e) => { e.preventDefault(); memo = input.value.trim(); showLine(); };
  };

  root.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'retake') back();
    if (act === 'write') edit();
    if (act === 'save') {
      e.target.closest('button').disabled = true;
      const input = $('.oneline__form input', root);
      if (input) memo = input.value.trim();
      const { bottle: b } = await collect({ blob: p.blob, ts: p.ts, slot: p.slot, color: p.color, memo });
      state.pending = null;
      if (b) {
        await pour(p, b);
        state.newBottleId = b.id;
      } else {
        toast('사진을 다이어리에 저장했어요');
      }
      go('home', { replace: true });
    }
  });
}

// 화면 중앙에 병이 뜨고 색이 차오른다
async function pour(p, b) {
  const el = document.createElement('div');
  el.className = 'pour';
  el.innerHTML = `
    <div class="pour__stage">
      <span class="pour__drop" style="--c:${b.color}"></span>
      ${bottle({ size: 'xl', color: b.color, level: 0.84, cls: 'pour__bottle' })}
    </div>
    <p class="pour__caption hand">${slotName(p.slot)}의 하늘을 병에 담았어요</p>`;
  document.body.append(el);
  await wait(30);
  el.classList.add('is-in');
  await wait(700);
  el.classList.add('is-filling');
  await wait(1600);
  el.classList.add('is-corked');
  await wait(1100);
  el.classList.add('is-out');
  await wait(350);
  el.remove();
}
