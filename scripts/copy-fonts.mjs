// 폰트를 www/fonts 로 복사한다. 앱은 오프라인에서도 같은 분위기를 유지해야 하니 CDN 대신 로컬 번들.
// 본문 Noto Sans KR 은 안드로이드 시스템 기본 한글 폰트(Noto Sans CJK)를 그대로 쓴다.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const FONTS = [
  { pkg: 'gowun-batang', weights: [400, 700] },
  { pkg: 'gaegu', weights: [400, 700] },
  { pkg: 'cutive-mono', weights: [400] },
  { pkg: 'nanum-gothic-coding', weights: [400] },
];

const out = 'www/fonts';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let css = '/* 자동 생성: npm run fonts */\n';
for (const { pkg, weights } of FONTS) {
  const src = join('node_modules/@fontsource', pkg);
  mkdirSync(join(out, pkg), { recursive: true });
  for (const w of weights) {
    let text = readFileSync(join(src, `${w}.css`), 'utf8');
    // woff 폴백은 버리고 woff2 만 남긴다
    text = text.replace(/,\s*url\([^)]+\.woff\)\s*format\('woff'\)/g, '');
    text = text.replace(/url\(\.\/files\/([^)]+\.woff2)\)/g, (_, file) => {
      copyFileSync(join(src, 'files', file), join(out, pkg, file));
      return `url(./${pkg}/${file})`;
    });
    css += text + '\n';
  }
}
writeFileSync(join(out, 'fonts.css'), css);
console.log('fonts → www/fonts');
