// 홈: 구름 모양 창으로 보는 실시간 하늘 + 오늘의 채집 선반
import { flags } from '../db.js';
import { dominantColor } from '../color.js';
import { go } from '../nav.js';
import { slotName } from '../species.js';
import { DAILY_LIMIT, currentSlot, photos, state, todayBottles } from '../store.js';
import { $, ICON, bottle, dateKey, filmStamp, longDate, modal, toast } from '../ui.js';

const CLOUD = 'M22 31C20 15 40 5 52 15C60 3 85 7 83 27C97 29 101 49 91 58C101 70 93 91 76 86C68 99 45 99 41 89C27 99 4 91 11 74C-1 66 1 44 14 41C10 36 15 30 22 31Z';

export async function render(root) {
  const slot = currentSlot();
  root.innerHTML = `
    <header class="home-head">
      <h1 class="hand home-title">오늘의 하늘</h1>
      <p class="home-date">${longDate(dateKey())} · <span class="slot-chip">${slotName(slot)}</span></p>
    </header>

    <section class="shelf" aria-label="오늘의 채집 선반">
      <div class="shelf__row"></div>
      <div class="shelf__plank"></div>
      <p class="shelf__label">오늘의 채집 선반 <b class="shelf__count"></b></p>
    </section>

    <div class="cam">
      <div class="cam__frame">
        <video class="cam__video" playsinline muted autoplay></video>
        <div class="cam__fallback">
          <p>카메라를 열 수 없어요</p>
          <small>셔터를 누르면 사진을 골라 채집할 수 있어요</small>
        </div>
        <div class="cam__flash"></div>
      </div>
      <svg class="cam__outline" viewBox="-2 -2 104 104" preserveAspectRatio="none" aria-hidden="true">
        <path d="${CLOUD}" vector-effect="non-scaling-stroke"/>
        <path class="stitch" d="${CLOUD}" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="hint-bubble" hidden>오늘의 첫 하늘을<br>담아볼까요?</div>
    </div>

    <nav class="dock">
      <button class="dock__btn" data-go="storage"><span class="ico">${ICON.shelf}</span>보관함</button>
      <button class="shutter" aria-label="셔터"><span></span></button>
      <button class="dock__btn" data-go="diary"><span class="ico">${ICON.diary}</span>다이어리</button>
    </nav>
    <input type="file" accept="image/*" capture="environment" hidden class="cam__file">`;

  root.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go)));
  await renderShelf(root);
  if ((await photos()).length === 0) $('.hint-bubble', root).hidden = false;

  // ── 카메라 ──
  const video = $('.cam__video', root);
  const frame = $('.cam__frame', root);
  let stream = null;
  let alive = true;
  const start = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      if (!alive) return stop();
      video.srcObject = stream;
      await video.play();
      frame.classList.add('is-live');
    } catch {
      frame.classList.add('is-fallback');
    }
  };
  const stop = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; frame.classList.remove('is-live'); };
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  start();

  // ── 셔터 ──
  const fileInput = $('.cam__file', root);
  $('.shutter', root).onclick = async () => {
    if (!stream) return fileInput.click();
    frame.classList.remove('flash'); void frame.offsetWidth; frame.classList.add('flash');
    const aspect = frame.clientWidth / frame.clientHeight;
    await develop(cropTo(video, video.videoWidth, video.videoHeight, aspect));
  };
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    await develop(cropTo(img, img.naturalWidth, img.naturalHeight, img.naturalWidth / img.naturalHeight));
  };

  // 생애 첫 병 3개 → 보관함 안내 (1회)
  if (flags.get('guidePending')) {
    flags.set('guideShown', 1);
    flags.set('guidePending', '');
    setTimeout(guide, 900);
  }

  return () => { alive = false; stop(); document.removeEventListener('visibilitychange', onVis); };
}

async function renderShelf(root) {
  const today = await todayBottles();
  const slots = Array.from({ length: DAILY_LIMIT }, (_, i) => today[i]);
  $('.shelf__row', root).innerHTML = slots.map((b) =>
    b ? bottle({ size: 'sm', color: b.color, cls: b.id === state.newBottleId ? 'is-new' : '' })
      : bottle({ size: 'sm', cork: false })).join('');
  $('.shelf__count', root).textContent = `${today.length}/${DAILY_LIMIT}`;
  state.newBottleId = null;
}

// 화면 비율에 맞게 가운데를 잘라 캔버스로
function cropTo(src, w, h, aspect) {
  let sw = w, sh = w / aspect;
  if (sh > h) { sh = h; sw = h * aspect; }
  const W = Math.round(Math.min(1080, sw));
  const H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  c.getContext('2d').drawImage(src, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, W, H);
  return c;
}

// 현상: 색 추출 → 촬영 시각 각인 → 결과 화면으로
async function develop(canvas) {
  const ts = Date.now();
  const { color, spot } = dominantColor(canvas); // 각인 전에 뽑아야 주황 글씨가 섞이지 않는다
  await stamp(canvas, ts);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.88));
  if (state.pending) URL.revokeObjectURL(state.pending.url);
  state.pending = { blob, url: URL.createObjectURL(blob), ts, slot: currentSlot(new Date(ts)), color, spot };
  go('capture');
}

// 필름 카메라 날짜처럼 사진 자체에 시각을 인쇄한다 (지워지지 않는 하드 인쇄)
export async function stamp(canvas, ts) {
  const ctx = canvas.getContext('2d');
  const px = Math.round(canvas.width * 0.05);
  try { await document.fonts.load(`${px}px "Cutive Mono"`); } catch { /* 폴백 모노 */ }
  ctx.save();
  ctx.font = `${px}px "Cutive Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(255, 110, 30, 0.75)';
  ctx.shadowBlur = px * 0.45;
  ctx.fillStyle = '#FFA54A';
  ctx.globalAlpha = 0.92;
  ctx.fillText(filmStamp(ts), canvas.width - px * 0.9, canvas.height - px * 0.9);
  ctx.restore();
}

async function guide() {
  const ok = await modal({
    title: '병이 세 개 모였어요',
    body: `<ol class="guide">
      <li><b>보관함</b>에서 모은 병을 눌러 <b>세 개</b>를 골라요</li>
      <li>아래 <b>볼따구 만들기</b>를 누르면</li>
      <li>그 세 하늘로 작은 볼따구가 태어나요</li>
    </ol><p class="muted">어느 시간대의 병을 고르느냐에 따라 다른 아이가 찾아와요.</p>`,
    actions: [{ label: '나중에', value: false }, { label: '보관함 가보기', value: true, primary: true }],
  });
  if (ok) go('storage');
  else toast('보관함은 왼쪽 아래에 있어요');
}
