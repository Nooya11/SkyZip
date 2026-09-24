// 앱 안에서 지나온 화면 스택. 뒤로가기 버튼이 브라우저/안드로이드 뒤로가기와 같은 길을 걷게 한다.
const stack = [];
let replacing = false;

export function go(path, { replace = false } = {}) {
  const hash = '#/' + path;
  if (location.hash === hash) return;
  replacing = replace;
  if (replace) location.replace(hash);
  else location.hash = hash;
}

export function track(hash) {
  const wasReplace = replacing;
  replacing = false;
  if (wasReplace && stack.length) stack[stack.length - 1] = hash;
  else if (stack.at(-2) === hash) stack.pop();
  else stack.push(hash);
}

export function back(fallback = 'home') {
  if (stack.length > 1) history.back();
  else go(fallback, { replace: true });
}
