import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export interface DetailTopicMeta {
  code: string;
  title: string;
  subject: string;
  examStage: "1차" | "2차";
  patterns: RegExp[];
}

/**
 * [별표 7] 공식 출제범위 + 문항 수 균형 분할 65개 세부 목차 및 정밀 분류 룰
 */
export const CURRICULUM_DETAIL_TOPICS: DetailTopicMeta[] = [
  // =========================================================================
  // 1차 · 민법 (13개)
  // =========================================================================
  {
    code: "CIV_05_LIMIT",
    title: "기간·소멸시효",
    subject: "민법",
    examStage: "1차",
    patterns: [/소멸시효|제척기간|시효중단|시효의\s*중단|시효정지|시효이익|기간의\s*계산|초일\s*불산입/],
  },
  {
    code: "CIV_03_AGENCY",
    title: "대리",
    subject: "민법",
    examStage: "1차",
    patterns: [/대리권|대리행위|복대리|표현대리|무권대리|자기계약|쌍방대리|현명주의|수권행위|대리인이|본인을\s*대리/],
  },
  {
    code: "CIV_02_INTENT",
    title: "의사표시",
    subject: "민법",
    examStage: "1차",
    patterns: [/진의\s*아닌|비진의|통정허위|허위표시|착오로\s*인한|중대한\s*과실.*착오|사기·강박|사기\s*또는\s*강박|의사표시의\s*효력|도달주의|발신주의|격지자/],
  },
  {
    code: "CIV_04_VOID_COND",
    title: "무효·취소·조건·기한",
    subject: "민법",
    examStage: "1차",
    patterns: [/법률행위의\s*무효|법률행위의\s*취소|무효와\s*취소|일부무효|무효행위의\s*전환|추인할\s*수|법정추인|취소권|조건부|정지조건|해제조건|조건과\s*기한|기한의\s*이익|기한부/],
  },
  {
    code: "CIV_07_USUF",
    title: "용익물권(지상·지역·전세)",
    subject: "민법",
    examStage: "1차",
    patterns: [/지상권|법정지상권|분묘기지권|지역권|승역지|요역지|전세권|전세금/],
  },
  {
    code: "CIV_08_SEC",
    title: "담보물권(유치·질권·저당)",
    subject: "민법",
    examStage: "1차",
    patterns: [/유치권|질권|저당권|근저당|일괄경매|물상대위|공동저당|담보물권|법정질권/],
  },
  {
    code: "CIV_06B_OWN_CO",
    title: "소유권·상린관계·공동소유",
    subject: "민법",
    examStage: "1차",
    patterns: [/소유권|취득시효|상린관계|주위토지통행권|공유물|공유지분|합유|총유|공동소유|선점|습득|첨부|부합|명의신탁|부동산실명법/],
  },
  {
    code: "CIV_06A_CHANGE_POS",
    title: "물권변동·등기·점유권",
    subject: "민법",
    examStage: "1차",
    patterns: [/물권변동|물권적\s*청구권|물권법|본등기|가등기|점유권|점유자|간접점유|자주점유|타주점유|혼동|선의취득/],
  },
  {
    code: "CIV_10B_LEASE_TORT",
    title: "임대차·주임법·부당이득·불법행위",
    subject: "민법",
    examStage: "1차",
    patterns: [/임대차|임차인|임대인|부속물매수|지상물매수|주택임대차보호법|상가건물|사무관리|부당이득|불법행위|사용자책임|공작물|공동불법행위/],
  },
  {
    code: "CIV_10A_SALE_WORK",
    title: "매매·도급·위임 등 계약각론",
    subject: "민법",
    examStage: "1차",
    patterns: [/매매계약|매도인|매수인|계약금|해약금|담보책임|환매|도급|수급인|위임|수임인|현상광고|소비대차|증여|교환/],
  },
  {
    code: "CIV_09_CONT_GEN",
    title: "채권총칙·계약총칙",
    subject: "민법",
    examStage: "1차",
    patterns: [/채권자지체|이행지체|이행불능|불완전이행|채무불이행|손해배상액의\s*예정|채권자대위|채권자취소|사해행위|연대채무|불가분채무|보증채무|채권양도|채무인수|변제|대물변제|공탁|상계|경개|면제|청약과\s*승낙|계약의\s*성립|계약체결상의\s*과실|동시이행|위험부담|제3자를\s*위한\s*계약|계약의\s*해제|계약의\s*해지|약관의\s*규제/],
  },
  {
    code: "CIV_01B_CORP_OBJ",
    title: "법인·비법인사단·물건",
    subject: "민법",
    examStage: "1차",
    patterns: [/법인|정관|이사|청산|비법인사단|권리능력\s*없는\s*사단|민법상\s*물건|물건에\s*관한|부동산과\s*동산|주물|종물|원물|과실/],
  },
  {
    code: "CIV_01A_PERSON",
    title: "민법서설·신의칙·자연인(제한능력)",
    subject: "민법",
    examStage: "1차",
    patterns: [/관습법|신의성실|권리남용|태아|권리능력|의사능력|행위능력|제한능력|미성년자|피성년후견|피한정후견|실종선고|동시사망|부재자/],
  },
  {
    code: "CIV_01C_ACT",
    title: "권리변동·법률행위 일반",
    subject: "민법",
    examStage: "1차",
    patterns: [/법률행위|처분행위|반사회|불공정|강행규정|단속규정|권리의\s*변동|원시취득|승계취득/],
  },

  // =========================================================================
  // 1차 · 회계원리 (11개)
  // =========================================================================
  {
    code: "ACC_08_COST_CVP",
    title: "CVP분석·의사결정회계",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/손익분기점|CVP|공헌이익|안전한계|영업레버리지|특별주문|자가제조|외부구입|부문폐지|제약자원|자본예산|순현재가치|내부수익률|회수기간|목표이익|목표영업이익|관련원가|매몰원가|기회원가/],
  },
  {
    code: "ACC_07_COST_PROC",
    title: "종합원가·결합·표준원가",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/종합원가|완성품환산량|완성품원가|공손품|정상공손|비정상공손|결합원가|연산품|분리점|변동원가계산|전부원가계산|초변동원가|표준원가|가격차이|능률차이|임률차이|조업도차이|소비차이|예산차이/],
  },
  {
    code: "ACC_06_COST_JOB",
    title: "원가배부·개별원가",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/원가회계|원가의\s*분류|제조원가|직접재료|직접노무|제조간접|부문별\s*원가|보조부문|직접배부|단계배부|상호배부|활동기준원가|ABC|개별원가계산|정상원가계산|배부차이|원가행태|고정원가|변동원가|고저점법|기초원가|가공원가/],
  },
  {
    code: "ACC_03B_TANG_ETC",
    title: "유형손상·재평가·무형·투자부동산",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/재평가모형|재평가잉여금|손상차손|회수가능액|사용가치|무형자산|영업권|개발비|연구비|투자부동산|차입원가|정부보조금|복구충당/],
  },
  {
    code: "ACC_03A_TANG_COST",
    title: "유형자산 취득·감가상각·처분",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/유형자산|감가상각|정액법|정률법|연수합계법|이중체감법|생산량비례법|취득원가|교환취득|자본적지출|수익적지출|기계장치|건물.*처분/],
  },
  {
    code: "ACC_04B_LIAB_BOND",
    title: "부채·사채·충당부채·리스",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/사채|유효이자|할인발행|할증발행|상환손익|전환사채|충당부채|우발부채|우발자산|유동부채|비유동부채|리스|복합금융상품/],
  },
  {
    code: "ACC_04A_FIN_ASSET",
    title: "금융자산·지분법",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/금융자산|당기손익-공정가치|기타포괄손익|상각후원가|관계기업|지분법/],
  },
  {
    code: "ACC_02C_INV_VAL",
    title: "재고자산 (저가법·감모·추정)",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/소매재고법|매출총이익률법|저가법|평가손실|감모손실|정상감모|비정상감모|순실현가능가치/],
  },
  {
    code: "ACC_02B_INV",
    title: "재고자산 (원가흐름·수량·포함여부)",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/재고자산|선입선출|후입선출|이동평균|총평균|가중평균|미착상품|적송품|시송품|기말재고|매출원가/],
  },
  {
    code: "ACC_02A_CASH_AR",
    title: "현금·수취채권",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/현금및현금성자산|은행계정조정|소액현금|당좌예금|수취채권|매출채권|대손충당금|대손상각|손상차손.*채권|어음할인/],
  },
  {
    code: "ACC_05_EQ_FS",
    title: "자본·수익·현금흐름표·비율",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/자본금|주식발행|자기주식|주식배당|현금배당|이익잉여금|기타포괄손익누계액|자본변동표|보통주|우선주|주당이익|수익인식|고객과의\s*계약|진행기준|건설계약|상품권|용역제공|계약부채|계약자산|현금흐름표|영업활동|투자활동|재무활동|회계정책|회계추정|오류수정|재무비율|유동비율|부채비율|재고자산회전율|매출총이익률/],
  },
  {
    code: "ACC_01B_CYCLE",
    title: "회계순환·결산수정분개·감사",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/수정분개|이연|발생|선급비용|선급보험료|선수수익|미수수익|미수이자|미지급비용|미지급급여|소모품|시산표|결산|감사의견|한정의견|외부감사|총포괄이익.*기초자산/],
  },
  {
    code: "ACC_01A_CONCEPT",
    title: "회계개념체계·질적특성·총론",
    subject: "회계원리",
    examStage: "1차",
    patterns: [/개념체계|질적특성|근본적\s*질적특성|보강적\s*질적특성|계속기업|발생주의|거래의\s*8요소|회계상\s*거래|회계정보|재무제표\s*표시/],
  },

  // =========================================================================
  // 1차 · 공동주택시설개론 (12개)
  // =========================================================================
  {
    code: "FAC_04_EST",
    title: "건축적산·견적(장기수선 기준)",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/적산|견적|품셈|소요량|할증률|시멘트\s*포대|벽돌\s*매수|거푸집\s*면적|철근량|타일\s*매수|도배|페인트량|정미량|노무비|경비|일반관리비/],
  },
  {
    code: "FAC_08_ELEC",
    title: "전기·피뢰·홈네트워크",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/전기설비|전압|전류|전력|역률|수변전|변압기|차단기|전선|배선|간선|조명|조도|광속|광도|휘도|연색성|피뢰|접지|홈네트워크|지능형|정보통신|약전|인터폰|전동기|역상/],
  },
  {
    code: "FAC_09_FIRE_ELV",
    title: "소방·가스·승강기설비",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/소화기|옥내소화전|옥외소화전|스프링클러|화재감지|자동화재탐지|연결송수관|제연설비|피난기구|가스설비|도시가스|액화석유가스|승강기|엘리베이터|에스컬레이터|조속기|완충기|권상기|와이어로프/],
  },
  {
    code: "FAC_05B_HOTWATER",
    title: "급탕설비·가열·순환",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/급탕|저탕조|저탕량|가열장치|팽창관|팽창탱크|순환펌프|리버스리턴|역환수|기수혼합|간접가열|직접가열/],
  },
  {
    code: "FAC_05A_WATER",
    title: "급수설비·수질·펌프",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/급수|수질|경도|잔류염소|대장균|급수방식|수도직결|고가수조|압력탱크|부스터|펌프|양정|캐비테이션|수격작용|워터해머|유량|관경|크로스커넥션/],
  },
  {
    code: "FAC_06_DRAIN",
    title: "배수·통기·위생·오수정화",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/배수|트랩|봉수|통기관|루프통기|신정통기|습윤통기|배수구배|배수수평지관|위생기구|대변기|세정밸브|세정탱크|오수|정화조|분뇨|BOD|COD|활성오니/],
  },
  {
    code: "FAC_07_HVAC",
    title: "난방·환기·배관설비",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/난방|증기난방|온수난방|복사난방|패널히팅|지역난방|방열기|증기트랩|보일러|환기|제1종|제2종|제3종|배관|동관|강관|신축이음|밸브|게이트밸브|글로브밸브|체크밸브|송풍기|공조|냉동|열손실/],
  },
  {
    code: "FAC_03B_FINISH",
    title: "창호·유리·미장·타일·도장",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/창호|여닫이|미서기|프로젝트창|자재|유리|복층유리|강화유리|미장|모르타르|회반죽|테라조|타일|석공사|도장|페인트|수장|바닥공사|금속공사/],
  },
  {
    code: "FAC_03A_ROOF_WTR",
    title: "지붕·방수·단열·결로",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/지붕|방수|아스팔트방수|시트방수|도막방수|실링|코킹|단열|결로|열관류율|열교|방습|투습/],
  },
  {
    code: "FAC_02B_STL_MAS",
    title: "철골·조적구조",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/철골|고장력볼트|용접|리벳|H형강|좌굴|판보|플레이트보|조적|벽돌|블록|돌쌓기|아치|인방보|테두리보|목구조/],
  },
  {
    code: "FAC_02A_RC",
    title: "철근콘크리트구조",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/철근콘크리트|콘크리트|시멘트|물시멘트비|물결합재비|슬럼프|양생|중성화|알칼리골재|배합|거푸집|철근|피복두께|정착|이음|스터럽|플랫슬래브|내력벽/],
  },
  {
    code: "FAC_01_FOUND",
    title: "구조총론·기초·토공사",
    subject: "공동주택시설개론",
    examStage: "1차",
    patterns: [/구조총론|하중|응력|모멘트|전단력|부정정|라멘|트러스|지반조사|표준관입|보링|토질|지하수|흙막이|어스앵커|히빙|보일링|파이핑|부동침하|기초|독립기초|복합기초|줄기초|온통기초|말뚝|지내력|토공사|터파기/],
  },

  // =========================================================================
  // 2차 · 주택관리관계법규 (16개: [별표 7] 13대 법률 + 대형법 2분할)
  // =========================================================================
  {
    code: "LAW_04_PRIVATE_RENT",
    title: "민간임대주택에 관한 특별법",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/민간임대주택/],
  },
  {
    code: "LAW_05_PUBLIC_RENT",
    title: "공공주택 특별법",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/공공주택\s*특별법|공공주택사업자|공공임대주택|영구임대|국민임대|행복주택/],
  },
  {
    code: "LAW_11_URBAN_REDEV",
    title: "도시 및 주거환경정비법",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/도시\s*및\s*주거환경정비법/],
  },
  {
    code: "LAW_12_RENEW_SPEC",
    title: "도시재정비 촉진을 위한 특별법",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/도시재정비\s*촉진|재정비촉진지구|재정비촉진계획/],
  },
  {
    code: "LAW_13_CONDO",
    title: "집합건물의 소유 및 관리에 관한 법률",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/집합건물의\s*소유\s*및\s*관리|집합건물법|관리단집회|전유부분과\s*공용부분|구분소유자/],
  },
  {
    code: "LAW_08_ELEVATOR",
    title: "승강기 안전관리법",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/승강기\s*안전관리법|승강기시설\s*안전관리법|승강기법령|정밀안전검사.*승강기|승강기.*안전관리자/],
  },
  {
    code: "LAW_09_ELECTRIC",
    title: "전기사업법 (KEC 포함)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/전기사업법|전기안전관리법|전기안전관리자|사용전점검|한국전기설비규정/],
  },
  {
    code: "LAW_10_FACIL_SAFE",
    title: "시설물의 안전 및 유지관리에 관한 특별법",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/시설물의\s*안전\s*및\s*유지관리|시설물안전법|1종시설물|2종시설물|3종시설물|제1종시설물|제2종시설물|제3종시설물|정밀안전진단|안전등급/],
  },
  {
    code: "LAW_07_FIRE",
    title: "소방기본법·화재예방·소방시설법",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/소방기본법|화재예방|화재의\s*예방|소방시설\s*설치|소방시설법|특정소방대상물|소방안전관리자|소방특별조사|화재안전조사/],
  },
  {
    code: "LAW_06B_BLDG_TECH",
    title: "건축법 (구조·피난·방화·면적)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/건축법.*(?:건폐율|용적률|높이|일조|피난|방화|내화|직통계단|비상용승강기|대수선|용도변경|시설군|조경|공개공지)/],
  },
  {
    code: "LAW_06A_BLDG_GEN",
    title: "건축법 (총칙·건축허가·대지도로)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/건축법|건축법령/],
  },
  {
    code: "LAW_01B_HOUSING_SUP",
    title: "주택법 (공급·전매·리모델링)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/주택법.*(?:공급|분양가상한제|투기과열지구|조정대상지역|전매|리모델링|저당권설정|입주자저축|주택상환사채)/],
  },
  {
    code: "LAW_01A_HOUSING_BUILD",
    title: "주택법 (용어·건설·사업승인·감리)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/주택법|주택법령/],
  },
  {
    code: "LAW_03_APT_FIN",
    title: "공동주택관리법 (관리비·장기수선·하자)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/관리비|사용료|관리비예치금|회계감사|회계서류|장기수선|충당금|하자담보|하자보수|하자심사|하자판정|분쟁조정위원회.*하자|특별수선충당금/],
  },
  {
    code: "LAW_02B_APT_REP",
    title: "공동주택관리법 (입대의·규약·소장)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/입주자대표회의|동별\s*대표자|관리규약|관리사무소장|주택관리사|교육|층간소음|분쟁조정|행위허가|금지행위/],
  },
  {
    code: "LAW_02A_APT_ORG",
    title: "공동주택관리법 (관리방법·의무관리)",
    subject: "주택관리관계법규",
    examStage: "2차",
    patterns: [/공동주택관리법|관리주체|의무관리대상|주택관리업|위탁관리|자치관리|혼합주택단지|관리의\s*이관/],
  },

  // =========================================================================
  // 2차 · 공동주택관리실무 (13개: [별표 7] 9대 영역 + 대형단원 세분화)
  // =========================================================================
  {
    code: "PRA_09_DEFECT",
    title: "공동주택 하자관리·보수공사",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/하자담보|하자보수|하자보증|하자조사|하자검사|하자심사|하자판정|내력구조부.*하자|보수공사|균열보수|하자분쟁/],
  },
  {
    code: "PRA_07_ENV",
    title: "환경·위생·조경관리",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/환경관리|실내공기질|라돈|에틸벤젠|스티렌|미세먼지|대기환경|저수조|수질검사|먹는물|소독|방역|바퀴|모기|폐기물|재활용|분리수거|음식물쓰레기|조경|전정|병충해|수목|어린이놀이시설.*위생/],
  },
  {
    code: "PRA_08_SAFETY",
    title: "안전·방재·소방·방범관리",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/안전관리계획|안전점검|해빙기|우기|동절기|월동기|풍수해|재난|소방훈련|소방안전|화재|방범|CCTV|범죄예방|어린이놀이시설|안전진단|보호구|산업안전|추락|감전/],
  },
  {
    code: "PRA_04_ACCOUNT",
    title: "공동주택 회계관리·예산·세무",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/회계처리기준|회계감사|예산|결산|재무상태표|운영성과표|관리비|일반관리비|사용료|수납|연체료|부가가치세|법인세|원천징수|세무|수익사업|검침|잡수입|충당금.*회계|충당금.*전입|감가상각/],
  },
  {
    code: "PRA_03B_INSURANCE",
    title: "4대 사회보험·퇴직급여·노사",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/국민연금|건강보험|고용보험|산재보험|산업재해보상|구직급여|실업급여|퇴직금|퇴직급여|직장가입자/],
  },
  {
    code: "PRA_03A_OFFICE_HR",
    title: "사무·인사관리·근로기준법",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/근로기준법|근로계약|취업규칙|근로시간|연장근로|휴게|휴일|연차|유급휴가|최저임금|임금|해고|노무|사무관리|문서|보존기간|인장|육아휴직|모성보호|출산휴가|일용근로|단시간근로/],
  },
  {
    code: "PRA_06_LTS_REMODEL",
    title: "장기수선계획·사업자선정·리모델링",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/장기수선|수선주기|수선율|수선교체|전면교체|부분수리|사업자\s*선정|주택관리업자.*선정|입찰방식|적격심사|최저낙찰|전자입찰|리모델링|수직증축/],
  },
  {
    code: "PRA_05C_ELEC_GAS",
    title: "시설실무 (전기·승강기·가스)",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/변압기|수변전|차단기|비상발전기|역률|조명|전압|전류|전기설비|피뢰|접지|승강기|엘리베이터|에스컬레이터|도시가스|가스사용시설|홈네트워크/],
  },
  {
    code: "PRA_05D_HVAC",
    title: "시설실무 (난방·열원·냉동·공조)",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/난방|보일러|열원|냉동|공조|환기|발열량|방열기|지역난방|기계실/],
  },
  {
    code: "PRA_05B_MECH",
    title: "시설실무 (급수·급탕·배수·배관)",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/배관|급수|급탕|배수|트랩|봉수|통기|펌프|밸브|수격/],
  },
  {
    code: "PRA_05A_ARCH",
    title: "시설실무 (건축·단열·방수·설비일반)",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/시설관리|유지관리|건축물|콘크리트|철근|방수|도장|기밀|결로|단열|난간|주차장|옥상|건축설비|에너지절약/],
  },
  {
    code: "PRA_02_RESIDENT",
    title: "입주자관리·입대의·대외업무",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/입주자관리|입주업무|입주자대표회의|동별\s*대표자|선거관리위원회|층간소음|민원|공동체|커뮤니티|대외업무|지방자치단체|행정관청|분쟁조정|주민공동시설/],
  },
  {
    code: "PRA_01B_PERMIT_RULE",
    title: "행위허가·관리규약·임대실무",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/행위허가|허가를\s*받거나.*신고|관리주체의\s*동의|관리규약|주택임대관리업|민간임대주택|영업\s*정지|과징금/],
  },
  {
    code: "PRA_01A_THEORY",
    title: "공동주거관리이론·관리방식",
    subject: "공동주택관리실무",
    examStage: "2차",
    patterns: [/공동주거관리|관리방식|자치관리|위탁관리|혼합관리|관리의\s*개념|관리주체|관리사무소장|주택관리업자|공동주택관리의|생애주기|LCC|위탁수수료|의무관리대상/],
  },
];

interface RawQRow {
  id: string;
  exam_year: number;
  exam_stage: string;
  subject: string;
  chapter_code: string | null;
  question_number: number;
  question_text: string;
  box_content: string | null;
}

interface RawOptRow {
  question_id: string;
  option_text: string;
}

function classifyQuestion(
  q: RawQRow,
  optionTexts: string[]
): { code: string; title: string } {
  const candidates = CURRICULUM_DETAIL_TOPICS.filter((t) => t.subject === q.subject);
  const bodyText = `${q.question_text} ${q.box_content || ""}`;
  const fullText = `${bodyText} ${optionTexts.join(" ")}`;

  // 1차 스캔: 본문(question_text + box_content) 우선 매칭
  for (const topic of candidates) {
    if (topic.patterns.some((re) => re.test(bodyText))) {
      return { code: topic.code, title: topic.title };
    }
  }

  // 2차 스캔: 선지 포함 전체 텍스트 매칭
  for (const topic of candidates) {
    if (topic.patterns.some((re) => re.test(fullText))) {
      return { code: topic.code, title: topic.title };
    }
  }

  // 3차 fallback: 기존 chapter_code 기반 안전한 기본 매핑
  const fallbackByChapter: Record<string, string> = {
    CIVIL_GEN: "CIV_01C_ACT",
    CIVIL_REAL: "CIV_06A_CHANGE_POS",
    CIVIL_OBLIG: "CIV_09_CONT_GEN",
    ACCT_FIN: "ACC_01A_CONCEPT",
    ACCT_COST: "ACC_06_COST_JOB",
    FACIL_STRUCT: "FAC_01_FOUND",
    FACIL_EQUIP: "FAC_05A_WATER",
    LAW_HOUSING: "LAW_01A_HOUSING_BUILD",
    LAW_APT_MGMT: "LAW_02A_APT_ORG",
    LAW_BUILDING: "LAW_06A_BLDG_GEN",
    LAW_RENT_REDEV: "LAW_04_PRIVATE_RENT",
    LAW_SAFETY_FACILITY: "LAW_07_FIRE",
    LAW_MINOR: "LAW_13_CONDO",
    PRAC_ORG_MGMT: "PRA_01A_THEORY",
    PRAC_LABOR: "PRA_03A_OFFICE_HR",
    PRAC_FACILITY: "PRA_05A_ARCH",
    PRAC_ENV_SAFETY: "PRA_07_ENV",
    PRAC_ACCOUNT_EXT: "PRA_04_ACCOUNT",
    PRAC_CUTOFF: "PRA_01A_THEORY",
  };
  const fbCode =
    (q.chapter_code && fallbackByChapter[q.chapter_code]) ||
    candidates[candidates.length - 1].code;
  const fbTopic = candidates.find((c) => c.code === fbCode) || candidates[candidates.length - 1];
  return { code: fbTopic.code, title: fbTopic.title };
}

async function run() {
  const apply = process.argv.includes("--apply");

  const questions: RawQRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .schema("vertical_housing")
      .from("exam_questions")
      .select("id, exam_year, exam_stage, subject, chapter_code, question_number, question_text, box_content")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    questions.push(...(data as RawQRow[]));
    if (data.length < PAGE) break;
  }

  const optionsByQ = new Map<string, string[]>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .schema("vertical_housing")
      .from("exam_options")
      .select("question_id, option_text")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const o of data as RawOptRow[]) {
      if (!optionsByQ.has(o.question_id)) optionsByQ.set(o.question_id, []);
      optionsByQ.get(o.question_id)!.push(o.option_text);
    }
    if (data.length < PAGE) break;
  }

  const counts = new Map<string, number>();
  for (const t of CURRICULUM_DETAIL_TOPICS) counts.set(t.code, 0);

  const updates: Array<{ id: string; detail_code: string; detail_title: string }> = [];
  for (const q of questions) {
    const opts = optionsByQ.get(q.id) || [];
    const { code, title } = classifyQuestion(q, opts);
    counts.set(code, (counts.get(code) ?? 0) + 1);
    updates.push({ id: q.id, detail_code: code, detail_title: title });
  }

  console.log(
    `\n총 문항 수: ${questions.length}개 | 세부 목차 수: ${CURRICULUM_DETAIL_TOPICS.length}개\n`
  );
  let zeroCount = 0;
  for (const t of CURRICULUM_DETAIL_TOPICS) {
    const c = counts.get(t.code) ?? 0;
    if (c === 0) zeroCount++;
    console.log(
      `${t.examStage} | ${t.subject.padEnd(10, " ")} | ${t.code.padEnd(22, " ")} | ${t.title.padEnd(28, " ")} | ${String(c).padStart(4, " ")}문항`
    );
  }
  console.log(`\n0문항 항목 수: ${zeroCount}`);

  if (apply) {
    console.log("\nDB 업데이트 시작...");
    const BATCH = 100;
    for (let i = 0; i < updates.length; i += BATCH) {
      const slice = updates.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (u) => {
          const { error } = await supabase
            .schema("vertical_housing")
            .from("exam_questions")
            .update({ detail_code: u.detail_code, detail_title: u.detail_title })
            .eq("id", u.id);
          if (error) throw error;
        })
      );
    }
    console.log(`DB ${updates.length}문항 detail_code / detail_title 업데이트 완료!`);
  } else {
    console.log("\n(Dry-run 완료: 실제 반영하려면 --apply 옵션을 붙여서 실행하세요)");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
