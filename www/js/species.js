// 볼따구 17종. 종은 규칙이, 색은 그날의 하늘이 정한다.
import { deltaE, family } from './color.js';

export const SLOTS = [
  { id: 'dawn', name: '새벽', range: '04–07' },
  { id: 'morning', name: '아침', range: '07–11' },
  { id: 'noon', name: '점심', range: '11–16' },
  { id: 'evening', name: '저녁', range: '16–19' },
  { id: 'night', name: '밤', range: '19–04' },
];
export const slotName = (id) => SLOTS.find((s) => s.id === id)?.name ?? '';

export function slotOf(date) {
  const h = date.getHours();
  if (h >= 4 && h < 7) return 'dawn';
  if (h >= 7 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'noon';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

// face: 일러스트 PNG 가 오기 전까지 쓰는 텍스트 이모티콘.
// img 에 투명 PNG 경로를 넣으면 자동으로 이미지로 바뀌고, 실루엣은 CSS filter 로 처리된다.
export const SPECIES = [
  { id: 'chirp', name: '찍찍따구', kind: 'same', slots: ['dawn'], face: '˙ө˙', img: null,
    desc: '아무도 깨지 않은 새벽, 제일 먼저 찍찍 인사하는 아이. 목소리가 작아서 잘 안 들려요.' },
  { id: 'blue', name: '파란따구', kind: 'same', slots: ['morning'], face: '•ᴗ•', img: null,
    desc: '맑은 아침 하늘만 세 번 모으면 찾아와요. 기분이 좋으면 볼이 더 파래진대요.' },
  { id: 'glutton', name: '먹보따구', kind: 'same', slots: ['noon'], face: '´ㅂ`', img: null,
    desc: '점심 하늘을 꼭꼭 씹어 먹고 자란 아이. 구름을 보면 솜사탕인 줄 알아요.' },
  { id: 'glow', name: '노을따구', kind: 'same', slots: ['evening'], face: '˘ᵕ˘', img: null,
    desc: '노을이 질 때만 조용히 나타나요. 하루가 끝나가는 게 조금 아쉬운 얼굴.' },
  { id: 'sleepy', name: '잠꾸러기따구', kind: 'same', slots: ['night'], face: '-ω-', img: null,
    desc: '밤하늘을 이불처럼 덮고 자는 아이. 깨우면 볼이 말랑하게 부어요.' },

  { id: 'day', name: '하루따구', kind: 'mix', slots: ['morning', 'noon', 'evening'], face: '•‿•', img: null,
    desc: '아침부터 저녁까지, 평범한 하루를 전부 기억하고 있는 아이.' },
  { id: 'midnight-snack', name: '야식따구', kind: 'mix', slots: ['noon', 'evening', 'night'], face: 'ㅎㅅㅎ', img: null,
    desc: '점심을 먹고, 저녁을 먹고, 밤에 또 뭔가를 먹는 아이. 후회는 내일 해요.' },
  { id: 'diligent', name: '부지런따구', kind: 'mix', slots: ['dawn', 'morning', 'noon'], face: '•̀ᴗ•́', img: null,
    desc: '해보다 먼저 일어나 점심까지 쉬지 않은 날에 태어나요.' },
  { id: 'owl', name: '올빼미따구', kind: 'mix', slots: ['dawn', 'evening', 'night'], face: '◉ᴗ◉', img: null,
    desc: '해가 떠 있는 동안에는 어디 있었는지 아무도 몰라요.' },
  { id: 'patter', name: '종종따구', kind: 'mix', slots: ['dawn', 'morning', 'evening'], face: '･ө･', img: null,
    desc: '짧은 다리로 종종종, 하루의 가장자리만 골라 걸어 다녀요.' },
  { id: 'insomnia', name: '불면따구', kind: 'mix', slots: ['dawn', 'morning', 'night'], face: '⊙_⊙', img: null,
    desc: '밤에도, 새벽에도, 아침에도 깨어 있었어요. 괜찮은 척하는 중.' },
  { id: 'oversleep', name: '늦잠따구', kind: 'mix', slots: ['dawn', 'noon', 'evening'], face: '=ᴗ=', img: null,
    desc: '새벽에 잠깐 깼다가… 눈 떠 보니 점심이었대요.' },
  { id: 'irregular', name: '불규칙따구', kind: 'mix', slots: ['dawn', 'noon', 'night'], face: '•ᴗ<', img: null,
    desc: '규칙 같은 건 없어요. 그래도 하늘은 꼬박꼬박 봤어요.' },
  { id: 'busy', name: '바쁨따구', kind: 'mix', slots: ['morning', 'noon', 'night'], face: '•̀ㅁ•́', img: null,
    desc: '저녁 하늘은 놓쳤어요. 너무 바빴거든요. 그래서 밤하늘은 꼭 봤대요.' },
  { id: 'offwork', name: '퇴근따구', kind: 'mix', slots: ['morning', 'evening', 'night'], face: 'ᵔᴗᵔ', img: null,
    desc: '출근길 하늘과 퇴근길 하늘을 모아 둔 아이. 퇴근 후가 제일 행복해요.' },

  { id: 'rainbow', name: '알록따구', kind: 'hidden', face: '✦ᴗ✦', img: null,
    hint: '세 색이 서로 다른 계열', desc: '서로 전혀 닮지 않은 세 하늘이 만나 태어난 아이. 볼마다 색이 조금씩 달라요.' },
  { id: 'twin', name: '닮은꼴따구', kind: 'hidden', face: '•ㅅ•', img: null,
    hint: '세 색이 거의 같은 톤', desc: '거의 같은 하늘을 세 번 담았어요. 어제와 오늘이 닮아 있던 날들.' },
];
export const speciesById = (id) => SPECIES.find((s) => s.id === id);
export const dexNo = (id) => String(SPECIES.findIndex((s) => s.id === id) + 1).padStart(2, '0');

const ORDER = SLOTS.map((s) => s.id);
const key = (slots) => [...slots].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).join('+');

// 병 3개 → 종 판정. 히든(색 기반)이 먼저, 그다음 시간대 규칙.
export function judge(bottles) {
  const colors = bottles.map((b) => b.color);
  const fams = colors.map(family);
  if (!fams.includes('neutral') && new Set(fams).size === 3) return 'rainbow';
  const pairs = [[0, 1], [0, 2], [1, 2]];
  if (pairs.every(([a, b]) => deltaE(colors[a], colors[b]) < 8)) return 'twin';

  const slots = bottles.map((b) => b.slot);
  const distinct = new Set(slots);
  if (distinct.size === 1) return SPECIES.find((s) => s.kind === 'same' && s.slots[0] === slots[0]).id;
  if (distinct.size === 3) return SPECIES.find((s) => s.kind === 'mix' && key(s.slots) === key(slots)).id;
  // 2+1 조합은 기획서에 없음 → 두 번 나온 시간대의 동일 시간대 종으로 태어난다
  const major = slots.find((s, i) => slots.indexOf(s) !== i);
  return SPECIES.find((s) => s.kind === 'same' && s.slots[0] === major).id;
}

export const recipe = (sp) =>
  sp.kind === 'hidden' ? sp.hint : sp.kind === 'same' ? `${slotName(sp.slots[0])} × 3` : sp.slots.map(slotName).join(' + ');
