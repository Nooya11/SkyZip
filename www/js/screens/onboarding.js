import { flags } from '../db.js';
import { go } from '../nav.js';
import { $, $$, bottle, face } from '../ui.js';

const SLIDES = [
  {
    art: () => `<div class="ob-art ob-art--cloud"><div class="ob-cloud"></div>${bottle({ size: 'xl', color: '#9DB7CC', level: 0.35, cls: 'ob-bottle' })}</div>`,
    title: '지나가는 하늘을<br>채집해요',
    text: '오늘 본 하늘을 사진으로 붙잡으면,<br>그 안에 가장 많이 담긴 색 한 방울이 병에 모여요.',
  },
  {
    art: () => `<div class="ob-art ob-art--three">
      ${bottle({ size: 'md', color: '#C6B3C9', cls: 'ob-b1' })}
      ${bottle({ size: 'md', color: '#9FC2DD', cls: 'ob-b2' })}
      ${bottle({ size: 'md', color: '#E8A77F', cls: 'ob-b3' })}
    </div>`,
    title: '병은 하루에<br>세 개까지',
    text: '사진은 얼마든지 찍을 수 있지만<br>병에 담기는 건 하루 세 번뿐이에요.<br>그래서 조금 더 오래 올려다보게 돼요.',
  },
  {
    art: () => `<div class="ob-art ob-art--born">${face('day', { color: '#B9A7B8', size: 'xl' })}</div>`,
    title: '병 세 개가 모이면<br>볼따구가 태어나요',
    text: '어느 시간의 하늘을 모았는지에 따라<br>다른 아이가 찾아와요. 색은 그날의 하늘이 정하고요.',
  },
];

export function render(root) {
  root.innerHTML = `
    <button class="ob-skip" data-act="done">건너뛰기</button>
    <div class="ob-track">
      ${SLIDES.map((s, i) => `<section class="ob-slide" data-i="${i}">
        ${s.art()}
        <h2 class="ob-title">${s.title}</h2>
        <p class="ob-text">${s.text}</p>
      </section>`).join('')}
    </div>
    <footer class="ob-foot">
      <div class="dots">${SLIDES.map(() => '<span></span>').join('')}</div>
      <button class="btn btn--primary btn--wide" data-act="next">다음</button>
    </footer>`;

  const track = $('.ob-track', root);
  const btn = $('[data-act="next"]', root);
  let i = 0;
  const sync = () => {
    i = Math.round(track.scrollLeft / track.clientWidth);
    $$('.dots span', root).forEach((d, k) => d.classList.toggle('on', k === i));
    $$('.ob-slide', root).forEach((s, k) => s.classList.toggle('is-active', k === i));
    btn.textContent = i === SLIDES.length - 1 ? '첫 하늘 채집하러 가기' : '다음';
  };
  track.addEventListener('scroll', sync, { passive: true });
  sync();

  const done = () => { flags.set('onboarded', 1); go('home', { replace: true }); };
  $('[data-act="done"]', root).onclick = done;
  btn.onclick = () => {
    if (i === SLIDES.length - 1) return done();
    track.scrollTo({ left: (i + 1) * track.clientWidth, behavior: 'smooth' });
  };
}
