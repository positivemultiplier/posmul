/**
 * PosMul Friends 공식 세계관 & 캐릭터 레지스트리
 * - 7대 도메인에 각각 전담 캐릭터가 매핑되어 플랫폼 가이드, 힐링룸 미니미, 방명록 스티커로 활용됩니다.
 */

export type PosMulFriendId =
  | "wavy"
  | "ollie"
  | "ongi"
  | "moa"
  | "ago"
  | "beomi"
  | "roomie";

export type PosMulCharacterViewKey = "front" | "three-quarter" | "side" | "back";

export interface PosMulFriendExpression {
  id: string;
  key: "expr-1" | "expr-2" | "expr-3" | "expr-4";
  label: string;
  caption: string;
  image: string;
}

export interface PosMulFriendProfile {
  id: PosMulFriendId;
  order: number;
  nameKo: string;
  nameEn: string;
  species: string;
  roleTitle: string;
  domainKey: string;
  domainLabel: string;
  domainHref: string;
  accentHex: string;
  surfaceClass: string;
  badgeClass: string;
  buttonClass: string;
  catchphrase: string;
  personality: string;
  backstory: string;
  signaturePropName: string;
  signaturePropDesc: string;
  views: Record<PosMulCharacterViewKey, string>;
  propImage: string;
  sheetImage: string;
  expressions: PosMulFriendExpression[];
  domainTips: string[];
}

export interface PosMulStickerItem {
  id: string;
  friendId: PosMulFriendId;
  friendName: string;
  label: string;
  caption: string;
  image: string;
}

function makeSpritePaths(id: PosMulFriendId, sheetFile: string) {
  return {
    views: {
      front: `/images/characters/sprites/${id}/front.png`,
      "three-quarter": `/images/characters/sprites/${id}/three-quarter.png`,
      side: `/images/characters/sprites/${id}/side.png`,
      back: `/images/characters/sprites/${id}/back.png`,
    } satisfies Record<PosMulCharacterViewKey, string>,
    propImage: `/images/characters/sprites/${id}/prop.png`,
    sheetImage: `/images/characters/sheets/${sheetFile}`,
  };
}

export const POSMUL_FRIENDS: ReadonlyArray<PosMulFriendProfile> = [
  {
    id: "wavy",
    order: 1,
    nameKo: "웨이비",
    nameEn: "Wavy",
    species: "황금 꼬리 아기 수달",
    roleTitle: "MoneyWave 파동 리더 · 경제 회계사",
    domainKey: "economy",
    domainLabel: "경제 · 지갑 · MoneyWave",
    domainHref: "/economy",
    accentHex: "#f59e0b",
    surfaceClass: "from-amber-950/50 via-slate-900/90 to-slate-950 border-amber-500/30",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/35",
    buttonClass: "bg-amber-500 hover:bg-amber-400 text-slate-950",
    catchphrase: "작은 파동이 모이면 세상을 바꾸는 거대한 물결이 돼!",
    personality:
      "평소엔 강물에 둥둥 떠서 낮잠을 즐기는 여유파지만, 매시 정각 MoneyWave가 차오를 때면 누구보다 빠르게 순환 수치를 계산하는 천재 리더.",
    backstory:
      "포스멀 타운 중앙 모래시계 강가에서 태어났어요. 꼬리 끝의 황금 물결 무늬는 시민들의 작은 참여가 승수 효과를 타고 커질 때마다 반짝입니다.",
    signaturePropName: "황금 모래시계 펜던트",
    signaturePropDesc: "1시간마다 차오르는 MoneyWave 상금풀과 PMP→PMC 순환을 기록하는 목걸이",
    ...makeSpritePaths("wavy", "01-wavy-sheet.png"),
    expressions: [
      {
        id: "wavy-expr-1",
        key: "expr-1",
        label: "머니웨이브 환호!",
        caption: "상금풀이 빵빵하게 차올랐어!",
        image: "/images/characters/sprites/wavy/expr-1.png",
      },
      {
        id: "wavy-expr-2",
        key: "expr-2",
        label: "정밀 분석 중",
        caption: "음, 이번 파동 흐름이 심상치 않은데?",
        image: "/images/characters/sprites/wavy/expr-2.png",
      },
      {
        id: "wavy-expr-3",
        key: "expr-3",
        label: "강물 위 낮잠",
        caption: "정산 전까지 잠깐만 충전할게 Zzz",
        image: "/images/characters/sprites/wavy/expr-3.png",
      },
      {
        id: "wavy-expr-4",
        key: "expr-4",
        label: "변동성 깜짝!",
        caption: "어엇?! 갑자기 파동이 요동친다!",
        image: "/images/characters/sprites/wavy/expr-4.png",
      },
    ],
    domainTips: [
      "PMP는 소비와 공론 참여로 얻는 안전한 활동 포인트, PMC는 예측 적중과 MoneyWave로 얻는 나눔 자산이에요!",
      "매시 정각마다 MoneyWave 상금풀이 재분배되니 예측 마켓의 실시간 파동을 놓치지 마세요.",
      "모은 PMC는 기부 도메인에서 현실의 선한 영향력으로 바꿀 수 있답니다.",
    ],
  },
  {
    id: "ollie",
    order: 2,
    nameKo: "올리",
    nameEn: "Ollie",
    species: "예측 탐정 아기 올빼미",
    roleTitle: "집단지성 데이터 애널리스트",
    domainKey: "prediction",
    domainLabel: "예측 마켓 (Prediction)",
    domainHref: "/prediction",
    accentHex: "#38bdf8",
    surfaceClass: "from-sky-950/50 via-slate-900/90 to-slate-950 border-sky-500/30",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/35",
    buttonClass: "bg-sky-500 hover:bg-sky-400 text-slate-950",
    catchphrase: "데이터는 거짓말하지 않지… 음, 가끔 빼고!",
    personality:
      "밤새 뉴스와 지표를 분석하느라 다크서클이 짙은 지성파 탐정. 진지하게 추리하다가도 예측이 빗나가면 머리 깃털이 삐죽 솟으며 당황하는 허당미가 매력.",
    backstory:
      "포스멀 도서관 꼭대기 탑에서 전 세계 뉴스와 우리 동네 날씨까지 돋보기로 훑으며 내일의 확률을 짚어냅니다.",
    signaturePropName: "황금 테두리 진실 돋보기",
    signaturePropDesc: "수많은 뉴스 소음 속에서 진짜 핵심 시그널만 확대해서 보여주는 탐정 도구",
    ...makeSpritePaths("ollie", "02-ollie-sheet.png"),
    expressions: [
      {
        id: "ollie-expr-1",
        key: "expr-1",
        label: "날카로운 추리",
        caption: "근거와 확률을 꼼꼼히 따져보자!",
        image: "/images/characters/sprites/ollie/expr-1.png",
      },
      {
        id: "ollie-expr-2",
        key: "expr-2",
        label: "예측 적중! ✨",
        caption: "내가 그랬제!! 완벽하게 들어맞았어!",
        image: "/images/characters/sprites/ollie/expr-2.png",
      },
      {
        id: "ollie-expr-3",
        key: "expr-3",
        label: "예상 빗나감 쇼크",
        caption: "이, 이럴 리가 없는데?! 변수가 뭐지?!",
        image: "/images/characters/sprites/ollie/expr-3.png",
      },
      {
        id: "ollie-expr-4",
        key: "expr-4",
        label: "밤샘 차트 분석",
        caption: "커피 한 잔 더 마시고 다음 라운드 분석 중…",
        image: "/images/characters/sprites/ollie/expr-4.png",
      },
    ],
    domainTips: [
      "전국 이슈부터 우리 동네 생활 예측까지! 내 직관과 데이터 분석으로 PMP를 PMC로 키워보세요.",
      "정산이 완료된 적중 기록은 힐링룸 명예의 전당과 전국/동네 랭킹에 기록됩니다!",
      "관심 있는 주제가 없다면 '예측 만들기'로 직접 마켓을 열어볼 수도 있어요.",
    ],
  },
  {
    id: "ongi",
    order: 3,
    nameKo: "온기",
    nameEn: "Ongi",
    species: "나눔 배달부 사모예드",
    roleTitle: "공익 물품·나눔 메신저",
    domainKey: "donation",
    domainLabel: "기부 · 나눔 (Donation)",
    domainHref: "/donation",
    accentHex: "#fb7185",
    surfaceClass: "from-rose-950/45 via-slate-900/90 to-slate-950 border-rose-500/30",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/35",
    buttonClass: "bg-rose-500 hover:bg-rose-400 text-white",
    catchphrase: "당신의 마음이 닿는 곳에 따뜻한 기적이 피어나요!",
    personality:
      "누군가의 PMC가 현실의 기부 물품으로 바뀔 때마다 너무 기뻐서 꼬리가 프로펠러처럼 돌아가는 순수 결정체. 작은 칭찬에도 눈물이 그렁그렁해집니다.",
    backstory:
      "작은 파스텔 날개 망토를 두르고 포스멀 타운과 현실 세계를 오가며 운동화, 가전, 장학금 등 따뜻한 선물을 배달해요.",
    signaturePropName: "노란 하트 우체부 가방",
    signaturePropDesc: "시민들이 보낸 PMC의 온기를 식지 않게 담아 배달하는 마법의 우편 가방",
    ...makeSpritePaths("ongi", "03-ongi-sheet.png"),
    expressions: [
      {
        id: "ongi-expr-1",
        key: "expr-1",
        label: "하트 뿜뿜 환호",
        caption: "와아! 따뜻한 나눔이 도착했어요!",
        image: "/images/characters/sprites/ongi/expr-1.png",
      },
      {
        id: "ongi-expr-2",
        key: "expr-2",
        label: "기부 선물 배달",
        caption: "소중한 마음, 안전하게 전달할게요!",
        image: "/images/characters/sprites/ongi/expr-2.png",
      },
      {
        id: "ongi-expr-3",
        key: "expr-3",
        label: "폭풍 감동 눈물",
        caption: "너무 따뜻해서 눈물이 나요… 고마워요!",
        image: "/images/characters/sprites/ongi/expr-3.png",
      },
      {
        id: "ongi-expr-4",
        key: "expr-4",
        label: "고마운 인사",
        caption: "오늘도 세상이 조금 더 포근해졌어요.",
        image: "/images/characters/sprites/ongi/expr-4.png",
      },
    ],
    domainTips: [
      "K-물품 직접기부부터 3단계 마일스톤 검증 NGO까지 투명하게 나의 PMC를 나눌 수 있어요.",
      "작은 기부라도 횟수가 쌓이면 힐링룸 '영광의 선반'에 명예 트로피가 해금됩니다!",
      "물품 기부는 필요한 이웃을 돕고 국내 제조사의 선순환까지 일으키는 승수 효과를 만듭니다.",
    ],
  },
  {
    id: "moa",
    order: 4,
    nameKo: "모아",
    nameEn: "Moa",
    species: "볼빵빵 가치소비 쿼카",
    roleTitle: "시간·소비·임팩트 큐레이터",
    domainKey: "consume",
    domainLabel: "가치 소비 (Consume)",
    domainHref: "/consume",
    accentHex: "#34d399",
    surfaceClass: "from-emerald-950/45 via-slate-900/90 to-slate-950 border-emerald-500/30",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    buttonClass: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    catchphrase: "일상의 시간도, 소비도 모이면 든든한 자산이 돼요!",
    personality:
      "언제나 해맑게 웃으며 좋은 캠페인과 동네 상점을 찾아다니는 알뜰 살림꾼. 양쪽 볼 안에는 늘 도토리 대신 PMP 코인이 한가득 들어있습니다.",
    backstory:
      "민트색 앞치마를 두르고 Major League(시간 가치화)부터 지역 상생 스토어까지 발 빠르게 누비며 가치를 채곡채곡 모아요.",
    signaturePropName: "황금 스톱워치 & 크림 에코백",
    signaturePropDesc: "1분의 시간 참여도 놓치지 않고 PMP로 담아주는 타임워치와 장바구니",
    ...makeSpritePaths("moa", "04-moa-sheet.png"),
    expressions: [
      {
        id: "moa-expr-1",
        key: "expr-1",
        label: "볼빵빵 적립!",
        caption: "오늘도 PMP가 볼 한가득 모였어요!",
        image: "/images/characters/sprites/moa/expr-1.png",
      },
      {
        id: "moa-expr-2",
        key: "expr-2",
        label: "시간 꼼꼼 체크",
        caption: "딱 1분만 투자해도 보상이 쏙!",
        image: "/images/characters/sprites/moa/expr-2.png",
      },
      {
        id: "moa-expr-3",
        key: "expr-3",
        label: "꿀혜택 발견!",
        caption: "우와! 여기 진짜 착한 브랜드 캠페인이야!",
        image: "/images/characters/sprites/moa/expr-3.png",
      },
      {
        id: "moa-expr-4",
        key: "expr-4",
        label: "만세 환호",
        caption: "작은 소비가 모여서 큰 힘이 되네요!",
        image: "/images/characters/sprites/moa/expr-4.png",
      },
    ],
    domainTips: [
      "Major League 브랜드 캠페인에 참여하면 예측 게임과 힐링룸에 쓸 수 있는 PMP가 적립돼요!",
      "모은 PMP는 무위험 활동 재화라서 부담 없이 힐링룸을 꾸미거나 예측에 도전할 수 있습니다.",
      "시간과 관심을 가치로 바꾸는 PosMul 선순환의 첫 관문이 바로 이곳이에요!",
    ],
  },
  {
    id: "ago",
    order: 5,
    nameKo: "아고",
    nameEn: "Ago",
    species: "아고라 사회자 아기 펭귄",
    roleTitle: "공론장 중재자 · 집단지성 서기",
    domainKey: "forum",
    domainLabel: "포럼 · 공론장 (Forum)",
    domainHref: "/forum",
    accentHex: "#60a5fa",
    surfaceClass: "from-blue-950/50 via-slate-900/90 to-slate-950 border-blue-500/30",
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/35",
    buttonClass: "bg-blue-500 hover:bg-blue-400 text-white",
    catchphrase: "다름이 부딪혀야 비로소 더 나은 합의가 탄생하죠!",
    personality:
      "모두의 이야기를 차분히 필기해 주는 점잖은 사회자지만, 논리 없는 억지 주장이 나오면 짧은 날개를 파닥거리며 '근거를 대시오!' 하고 열변을 토합니다.",
    backstory:
      "남극 대신 뜨거운 시민 토론장이 좋아 포스멀 아고라에 눌러앉은 아기 황제펭귄. 오늘도 공론장 연단에서 꼼꼼히 메모를 남깁니다.",
    signaturePropName: "방송 헤드셋 마이크 & 메모 수첩",
    signaturePropDesc: "시민들의 모든 제안과 반론을 한 줄도 놓치지 않고 기록하는 아고라 키트",
    ...makeSpritePaths("ago", "05-ago-sheet.png"),
    expressions: [
      {
        id: "ago-expr-1",
        key: "expr-1",
        label: "꼼꼼한 메모",
        caption: "오호, 그 관점 아주 흥미로운데요?",
        image: "/images/characters/sprites/ago/expr-1.png",
      },
      {
        id: "ago-expr-2",
        key: "expr-2",
        label: "열정 토론 중!",
        caption: "잠깐만요! 거기 근거를 제시해 주세요!",
        image: "/images/characters/sprites/ago/expr-2.png",
      },
      {
        id: "ago-expr-3",
        key: "expr-3",
        label: "합의 성공 엄지척",
        caption: "멋진 집단지성! 모두의 의견이 모였어요!",
        image: "/images/characters/sprites/ago/expr-3.png",
      },
      {
        id: "ago-expr-4",
        key: "expr-4",
        label: "진땀 중재 중",
        caption: "양쪽 다 일리가 있어서 땀이 나네요…",
        image: "/images/characters/sprites/ago/expr-4.png",
      },
    ],
    domainTips: [
      "이슈 갤러리와 시민 아고라에서 글·댓글로 숙의에 참여하면 +10 PMP 보상이 지급됩니다!",
      "공공 뉴스·예산 감시·정책 브레인스토밍을 통해 나만의 예측 인사이트도 함께 길러보세요.",
      "추천 3개 이상을 받은 개념글은 더 많은 시민들과 MoneyWave 공론에 연결됩니다.",
    ],
  },
  {
    id: "beomi",
    order: 6,
    nameKo: "범이",
    nameEn: "Beomi",
    species: "불꽃 갈기 아기 호랑이",
    roleTitle: "실시간 챌린지 & 명예의 전당 챔피언",
    domainKey: "ranking",
    domainLabel: "랭킹 · 맞짱 챌린지 · 라이브",
    domainHref: "/ranking",
    accentHex: "#f97316",
    surfaceClass: "from-orange-950/50 via-slate-900/90 to-slate-950 border-orange-500/30",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/35",
    buttonClass: "bg-orange-500 hover:bg-orange-400 text-slate-950",
    catchphrase: "1등 가즈아!! …잠깐, 나 3분만 쉬고 다시 뛸게!",
    personality:
      "머리의 불꽃 갈기만큼 승부욕이 활활 타오르는 열혈파! 하지만 체력이 딱 3분짜리라서 챌린지가 끝나면 힐링룸 바닥에 대자로 뻗어 자는 반전 매력의 소유자.",
    backstory:
      "전국 읍·면·동 명예의 전당과 맞짱 챌린지 경기장을 종횡무진 누비며 시민들의 열정을 끌어올리는 응원 대장입니다.",
    signaturePropName: "번개 헤어밴드 & 골드 트로피",
    signaturePropDesc: "LIVE 열기와 랭킹 최상위 시민의 영예를 상징하는 승부사의 트로피",
    ...makeSpritePaths("beomi", "06-beomi-sheet.png"),
    expressions: [
      {
        id: "beomi-expr-1",
        key: "expr-1",
        label: "불꽃 질주!",
        caption: "포기란 없다! 지금 바로 도전하자!",
        image: "/images/characters/sprites/beomi/expr-1.png",
      },
      {
        id: "beomi-expr-2",
        key: "expr-2",
        label: "트로피 영광!",
        caption: "어흥! 내가 바로 우리 동네 1등이다!",
        image: "/images/characters/sprites/beomi/expr-2.png",
      },
      {
        id: "beomi-expr-3",
        key: "expr-3",
        label: "3분 체력 방전",
        caption: "으아앙… 에너지 완전 바닥났어… 살려줘…",
        image: "/images/characters/sprites/beomi/expr-3.png",
      },
      {
        id: "beomi-expr-4",
        key: "expr-4",
        label: "자신만만 윙크",
        caption: "한 판 붙어볼래? 내가 응원해 줄게!",
        image: "/images/characters/sprites/beomi/expr-4.png",
      },
    ],
    domainTips: [
      "우리 동네(시·도/구·군/동·읍·면)와 직업군별 명예의 전당에서 내 기여 순위를 확인해 보세요!",
      "친구들과 30초 만에 여는 '맞짱 챌린지'로 승부를 겨루면 열기가 두 배가 됩니다.",
      "치열하게 달린 뒤엔 루미의 힐링룸에서 잠깐 쉬어가는 것도 잊지 마세요!",
    ],
  },
  {
    id: "roomie",
    order: 7,
    nameKo: "루미",
    nameEn: "Roomie",
    species: "다락방 주인 아기 나무늘보",
    roleTitle: "힐링룸 호스트 · Lo-Fi BGM 큐레이터",
    domainKey: "healing-room",
    domainLabel: "힐링룸 (Healing Room)",
    domainHref: "/healing-room",
    accentHex: "#a78bfa",
    surfaceClass: "from-violet-950/50 via-slate-900/90 to-slate-950 border-violet-500/30",
    badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/35",
    buttonClass: "bg-violet-500 hover:bg-violet-400 text-white",
    catchphrase: "오늘도 수고 많았어. 여기선 그냥 너만의 속도로 쉬어가.",
    personality:
      "바깥 세상과 치열한 예측에서 돌아온 친구들이 유일하게 무장 해제되는 다락방 주인. 느긋하지만 방에 놀러 온 친구 취향의 BGM을 귀신같이 골라주는 감성 장인.",
    backstory:
      "노을빛 다락방 창가에서 따뜻한 차를 우리며, 현실의 내가 아닌 'PosMul에서의 나'가 온전히 쉴 수 있는 공간을 지켜줍니다.",
    signaturePropName: "레트로 무선 헤드셋 & 온기 머그컵",
    signaturePropDesc: "얼어붙은 온기와 눈꽃 멜로디가 흘러나오는 힐링룸의 심장",
    ...makeSpritePaths("roomie", "07-roomie-sheet.png"),
    expressions: [
      {
        id: "roomie-expr-1",
        key: "expr-1",
        label: "BGM 리듬 타기",
        caption: "이 멜로디 들으니까 마음이 사르르 녹네~",
        image: "/images/characters/sprites/roomie/expr-1.png",
      },
      {
        id: "roomie-expr-2",
        key: "expr-2",
        label: "따뜻한 차 한 모금",
        caption: "호호~ 따뜻한 차 마시고 천천히 숨 고르기",
        image: "/images/characters/sprites/roomie/expr-2.png",
      },
      {
        id: "roomie-expr-3",
        key: "expr-3",
        label: "나른한 하품 인사",
        caption: "잘 왔어~ 오늘은 어떤 BGM을 틀어줄까?",
        image: "/images/characters/sprites/roomie/expr-3.png",
      },
      {
        id: "roomie-expr-4",
        key: "expr-4",
        label: "다락방 미소",
        caption: "당신의 선한 활동이 여기 트로피로 반짝여요",
        image: "/images/characters/sprites/roomie/expr-4.png",
      },
    ],
    domainTips: [
      "활동으로 모은 PMP로 미니룸 테마·가구·포스멀 프렌즈 미니미를 자유롭게 꾸며보세요!",
      "일촌 파도타기로 이웃의 방에 놀러 가 방명록에 귀여운 프렌즈 스티커를 남길 수 있어요.",
      "기부·예측 실적은 상점에서 살 수 없는 '영광의 선반' 명예 트로피로만 빛납니다.",
    ],
  },
];

export const POSMUL_FRIEND_MAP: Record<PosMulFriendId, PosMulFriendProfile> = POSMUL_FRIENDS.reduce(
  (acc, friend) => {
    acc[friend.id] = friend;
    return acc;
  },
  {} as Record<PosMulFriendId, PosMulFriendProfile>
);

export function getFriendById(id: string | null | undefined): PosMulFriendProfile {
  if (id && id in POSMUL_FRIEND_MAP) {
    return POSMUL_FRIEND_MAP[id as PosMulFriendId];
  }
  return POSMUL_FRIEND_MAP.wavy;
}

const DOMAIN_FRIEND_MAP: Record<string, PosMulFriendId> = {
  forum: "ago",
  consume: "moa",
  prediction: "ollie",
  donation: "ongi",
  ranking: "beomi",
  challenge: "beomi",
  live: "beomi",
  economy: "wavy",
  wallet: "wavy",
  other: "wavy",
  "healing-room": "roomie",
};

export function getFriendByDomain(domain: string): PosMulFriendProfile {
  const id = DOMAIN_FRIEND_MAP[domain] ?? "wavy";
  return POSMUL_FRIEND_MAP[id];
}

/** 힐링룸 minimiStyle id ('friend-ollie' 등) -> PosMulFriendProfile 매핑 */
export function getFriendFromMinimiStyle(minimiStyle: string): PosMulFriendProfile | null {
  if (!minimiStyle.startsWith("friend-")) return null;
  const rawId = minimiStyle.slice("friend-".length);
  if (rawId in POSMUL_FRIEND_MAP) {
    return POSMUL_FRIEND_MAP[rawId as PosMulFriendId];
  }
  return null;
}

/** 7인 x 4표정 = 28종 카카오톡 스타일 방명록/댓글 스티커 */
export const POSMUL_STICKERS: ReadonlyArray<PosMulStickerItem> = POSMUL_FRIENDS.flatMap((friend) =>
  friend.expressions.map((expr) => ({
    id: expr.id,
    friendId: friend.id,
    friendName: friend.nameKo,
    label: expr.label,
    caption: expr.caption,
    image: expr.image,
  }))
);

export const POSMUL_STICKER_MAP: Record<string, PosMulStickerItem> = POSMUL_STICKERS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, PosMulStickerItem>
);

const STICKER_TOKEN_REGEX = /\[\[pm:([a-z]+-expr-[1-4])\]\]/;

export function encodeGuestbookStickerMessage(text: string, stickerId: string | null): string {
  const cleanText = text.replace(/\[\[pm:[a-z0-9-]+\]\]/g, "").trim();
  if (!stickerId || !(stickerId in POSMUL_STICKER_MAP)) {
    return cleanText;
  }
  const token = `[[pm:${stickerId}]]`;
  if (!cleanText) {
    // DB 2자 이상 검증 통과 및 의미 보존을 위해 토큰만 깔끔히 저장
    return token;
  }
  // DB 최대 200자 제한 보호
  const maxBodyLen = 200 - token.length - 1;
  return `${cleanText.slice(0, maxBodyLen)} ${token}`;
}

export function parseGuestbookStickerMessage(rawContent: string): {
  text: string;
  sticker: PosMulStickerItem | null;
} {
  const match = rawContent.match(STICKER_TOKEN_REGEX);
  if (!match) {
    return { text: rawContent, sticker: null };
  }
  const sticker = POSMUL_STICKER_MAP[match[1]] ?? null;
  const text = rawContent.replace(match[0], "").trim();
  return { text, sticker };
}
