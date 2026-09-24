// 해시 라우터. 안드로이드 뒤로가기는 WebView 히스토리를 따라가므로 해시 이동만으로 자연스럽게 동작한다.
import { flags } from './db.js';
import { go, track } from './nav.js';
import { debug } from './store.js';
import * as onboarding from './screens/onboarding.js';
import * as home from './screens/home.js';
import * as capture from './screens/capture.js';
import * as diary from './screens/diary.js';
import * as viewer from './screens/viewer.js';
import * as storage from './screens/storage.js';
import * as birth from './screens/birth.js';
import * as detail from './screens/detail.js';
import * as dex from './screens/dex.js';
import { mountDebug } from './debug.js';

const ROUTES = { onboarding, home, capture, diary, viewer, storage, birth, boltagu: detail, dex };
const app = document.getElementById('app');
let current = null; // { el, cleanup }

async function route() {
  const [name, ...params] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (!flags.get('onboarded') && name !== 'onboarding') return go('onboarding', { replace: true });
  const screen = ROUTES[name];
  if (!screen) return go('home', { replace: true });
  track(location.hash);

  const prev = current;
  const el = document.createElement('main');
  el.className = `screen screen--${name}`;
  current = { el, cleanup: null };
  prev?.cleanup?.();
  app.append(el);
  current.cleanup = (await screen.render(el, params)) ?? null;
  requestAnimationFrame(() => el.classList.add('is-in'));
  if (prev) {
    prev.el.classList.add('is-out');
    setTimeout(() => prev.el.remove(), 320);
  }
}

window.addEventListener('hashchange', route);
route();
if (debug) mountDebug();
