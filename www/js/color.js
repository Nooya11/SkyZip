// 색 추출 · 블렌딩 · 계열 판정

export const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// 사진에서 "가장 많은" 대표색 1개 + 그 색이 있는 위치.
// 48×48 로 줄인 뒤 채널당 3비트(512칸)로 양자화해 가장 붐비는 칸의 평균색을 고른다.
// 하늘은 그라데이션이 부드러워서 칸을 너무 잘게 나누면 표가 흩어진다.
export function dominantColor(source) {
  const size = 48;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, size, size);
  const px = ctx.getImageData(0, 0, size, size).data;
  const bins = new Map();
  for (let i = 0; i < px.length; i += 4) {
    const key = ((px[i] >> 5) << 6) | ((px[i + 1] >> 5) << 3) | (px[i + 2] >> 5);
    const b = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0, x: 0, y: 0 };
    const p = i / 4;
    b.n++; b.r += px[i]; b.g += px[i + 1]; b.b += px[i + 2]; b.x += p % size; b.y += Math.floor(p / size);
    bins.set(key, b);
  }
  let best = null;
  for (const b of bins.values()) if (!best || b.n > best.n) best = b;
  return {
    color: hex([best.r / best.n, best.g / best.n, best.b / best.n]),
    // 그 색이 모여 있는 곳(무게중심) — 스포이드가 찍을 자리
    spot: [(best.x / best.n + 0.5) / size, (best.y / best.n + 0.5) / size],
  };
}

// 선형광 공간에서 평균 — 물감을 섞듯 탁해지지 않고 빛처럼 섞인다
const toLin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toSrgb = (v) => 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

export function blend(hexes) {
  const lin = hexes.map((h) => rgb(h).map(toLin));
  const avg = [0, 1, 2].map((i) => lin.reduce((s, c) => s + c[i], 0) / lin.length);
  return hex(avg.map(toSrgb));
}

export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return hex(A.map((v, i) => v + (B[i] - v) * t));
}

export function hsl(h) {
  const [r, g, b] = rgb(h).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hue * 60, s, l];
}

// 글자색: 배경이 밝으면 잉크, 어두우면 종이색
export const readableOn = (h) => (hsl(h)[2] > 0.58 ? '#38332C' : '#F6F1E6');

function lab(h) {
  const [r, g, b] = rgb(h).map(toLin);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function deltaE(a, b) {
  const A = lab(a), B = lab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

// 색 계열. 채도가 낮거나 너무 어둡고 밝으면 무채색으로 본다.
export function family(h) {
  const [hue, s, l] = hsl(h);
  if (s < 0.18 || l < 0.12 || l > 0.92) return 'neutral';
  if (hue < 20 || hue >= 340) return 'red';
  if (hue < 70) return 'yellow';
  if (hue < 165) return 'green';
  if (hue < 255) return 'blue';
  if (hue < 300) return 'purple';
  return 'pink';
}
