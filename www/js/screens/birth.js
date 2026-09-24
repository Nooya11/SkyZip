// 탄생: 병 세 개를 기울여 섞으면 → 알이 흔들리고 → 볼따구가 태어난다
import { mix } from '../color.js';
import { back, go } from '../nav.js';
import { dexNo, speciesById } from '../species.js';
import { boltagus, hatch, preview, state } from '../store.js';
import { $, ICON, bottle, face, josa, wait } from '../ui.js';

export async function render(root) {
  if (state.selected.length !== 3) return go('storage', { replace: true });
  const ids = [...state.selected];
  const { bottles: list, species, color } = await preview(ids);
  const sp = speciesById(species);
  const isNew = !(await boltagus()).some((b) => b.species === species);
  let alive = true;

  root.style.setProperty('--born', color);
  root.style.setProperty('--born-soft', mix(color, '#ECE6D9', 0.45));
  root.innerHTML = `
    <header class="bar bar--clear">
      <button class="bar__btn" data-act="back">${ICON.back}</button>
      <span class="bar__title"></span>
      <span class="bar__btn"></span>
    </header>
    <div class="birth__stage">
      <div class="birth__jars">${list.map((b, i) => bottle({ size: 'md', color: b.color, cls: `birth__jar birth__jar--${i}` })).join('')}</div>
      <div class="birth__orb" style="--c1:${list[0].color};--c2:${list[1].color};--c3:${list[2].color}"></div>
      <div class="birth__face">${face(species, { color, size: 'xl' })}</div>
      <div class="birth__sparkles" aria-hidden="true">${'<i></i>'.repeat(10)}</div>
    </div>
    <p class="birth__line hand">세 개의 하늘을 섞는 중…</p>
    <form class="birth__form" hidden>
      <p class="birth__badge">${sp.kind === 'hidden' ? '히든 볼따구 발견!' : isNew ? `NEW · 도감 No.${dexNo(species)}` : `도감 No.${dexNo(species)}`}</p>
      <h2 class="birth__species">${josa(sp.name, '이', '가')} 태어났어요</h2>
      <input class="birth__name" maxlength="10" placeholder="${sp.name}" aria-label="이름">
      <button class="btn btn--primary btn--wide">이 이름으로 할래요</button>
    </form>`;

  $('[data-act="back"]', root).onclick = () => { alive = false; back('storage'); };

  const form = $('.birth__form', root);
  form.onsubmit = async (e) => {
    e.preventDefault();
    form.querySelector('button').disabled = true;
    const name = $('.birth__name', root).value.trim() || sp.name;
    const bol = await hatch(ids, name);
    state.selected = [];
    go(`boltagu/${bol.id}`, { replace: true });
  };

  // 연출은 화면이 뜬 뒤 흘러가도록 기다리지 않고 돌린다
  (async () => {
    const line = $('.birth__line', root);
    const steps = [
      [300, 'is-tilt', '세 개의 하늘을 섞는 중…'],
      [1500, 'is-mixing', '색이 천천히 섞이고 있어요'],
      [1600, 'is-wobble', '어… 뭔가 움직여요'],
      [1500, 'is-born', ''],
    ];
    for (const [ms, cls, text] of steps) {
      await wait(ms);
      if (!alive) return;
      root.classList.add(cls);
      line.textContent = text;
    }
    await wait(900);
    if (!alive) return;
    form.hidden = false;
    requestAnimationFrame(() => form.classList.add('is-in'));
  })();

  return () => { alive = false; };
}
