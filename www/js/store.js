// 앱 데이터 로직: 채집 · 병 · 볼따구 탄생
import { db, flags, uid } from './db.js';
import { blend } from './color.js';
import { judge, slotOf } from './species.js';
import { dateKey } from './ui.js';

export const DAILY_LIMIT = 3;

// 화면 사이에서 잠깐 들고 다니는 값들 (새로고침하면 사라져도 되는 것만)
export const state = {
  pending: null, // 방금 찍은 사진 { blob, url, ts, slot, color, spot }
  selected: [], // 보관함에서 고른 병 id
  newBottleId: null,
};

export const debug = new URLSearchParams(location.search).has('debug');
export const currentSlot = (d = new Date()) => (debug && flags.get('debugSlot')) || slotOf(d);

const byTs = (a, b) => a.ts - b.ts;

export async function photos() { return (await db.all('photos')).sort(byTs); }
export async function bottles() { return (await db.all('bottles')).sort(byTs); }
export async function boltagus() { return (await db.all('boltagus')).sort((a, b) => a.born - b.born); }

export async function todayBottles() {
  const today = dateKey();
  return (await bottles()).filter((b) => b.date === today);
}
export async function freeBottles() { return (await bottles()).filter((b) => !b.usedBy); }

// 채집 저장. 오늘 병이 3개 미만이면 병에도 담고, 아니면 사진(다이어리)만.
export async function collect({ blob, ts, slot, color, memo = '' }) {
  const canBottle = (await todayBottles()).length < DAILY_LIMIT;
  const date = dateKey(new Date(ts));
  const photo = { id: uid(), ts, date, slot, color, memo, bottled: canBottle, blob };
  await db.put('photos', photo);
  let bottle = null;
  if (canBottle) {
    bottle = { id: uid(), photoId: photo.id, ts, date, slot, color, usedBy: null };
    await db.put('bottles', bottle);
    // 생애 첫 병 3개가 모인 순간 → 보관함 안내 1회
    if ((await bottles()).length === 3 && !flags.get('guideShown')) flags.set('guidePending', 1);
  }
  return { photo, bottle };
}

export async function updateMemo(photoId, memo) {
  const p = await db.get('photos', photoId);
  p.memo = memo;
  await db.put('photos', p);
}

export async function day(date) { return (await db.get('days', date)) ?? { date, weather: null, mood: '', note: '' }; }
export const saveDay = (d) => db.put('days', d);

// 병 3개 → 종 판정 + 색 블렌딩 (저장 전 미리보기용)
export async function preview(bottleIds) {
  const list = await Promise.all(bottleIds.map((id) => db.get('bottles', id)));
  return { bottles: list, species: judge(list), color: blend(list.map((b) => b.color)) };
}

export async function hatch(bottleIds, name) {
  const { bottles: list, species, color } = await preview(bottleIds);
  const bol = {
    id: uid(), species, name, born: Date.now(), color,
    bottleIds, photoIds: list.map((b) => b.photoId),
  };
  await db.put('boltagus', bol);
  for (const b of list) await db.put('bottles', { ...b, usedBy: bol.id });
  return bol;
}

export async function rename(id, name) {
  const b = await db.get('boltagus', id);
  b.name = name;
  await db.put('boltagus', b);
}
