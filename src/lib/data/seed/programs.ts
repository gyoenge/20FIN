/**
 * 20FIN 지금의 기회 — 20대 금융 프로그램 큐레이션 seed (docs/opportunity-expansion.md §6).
 *
 * 정책 실시간 API(온통청년·LH) 만으로는 "복지 추천"처럼 보이므로, 20대의 실제 금융 니즈
 * (모으기·덜 빌리기·덜 쓰기·지원받기·소득 늘리기)를 대표하는 국가·서울시 프로그램을
 * 정보 기준일 시점의 공식값으로 직접 큐레이션해 데모 기간에 항상 노출한다.
 *
 * ⚠️ 정보 기준일: 2026-09-07. 각 항목의 혜택·조건은 공식 공고 기준값이며,
 *    최종 신청 가능 여부·최신 조건은 반드시 공식 페이지에서 확인해야 한다(카드 하단 고지).
 *    변동 가능성이 큰 수치(세제개편 정부안 등)는 현행 확정치 또는 정성 표현을 우선했다.
 */

export const PROGRAM_SNAPSHOT_DATE = "2026-09-07";
export const PROGRAM_SOURCE = "20FIN 큐레이션 (공식 공고 기준 · 2026-09-07)";

export interface ProgramRecord {
  id: string;
  title: string;
  provider: string;
  category: "housing" | "employment" | "asset" | "education" | "finance";
  opportunityType: "save" | "earn" | "borrow" | "reduce" | "claim";
  /** 핵심 혜택 요약 (공식값) */
  benefit: string;
  /** 대상 요약 (자연어) */
  eligibility: string;
  minAge?: number;
  maxAge?: number;
  /** "전국" 또는 광역 지자체명 (지역 랭킹 판별용) */
  region: string;
  officialUrl: string;
  /** 마감이 정해진 경우만 (YYYY-MM-DD) */
  endDate?: string;
}

export const PROGRAMS_REAL: ProgramRecord[] = [
  /* ── 돈 모으기 (save) ─────────────────────────────────────────── */
  {
    id: "youth-future-savings",
    title: "청년미래적금",
    provider: "서민금융진흥원 · KB국민은행",
    category: "asset",
    opportunityType: "save",
    benefit: "월 최대 50만원 · 3년 만기 · 정부기여금(일반 6% 매칭, 3년 최대 108만원) + 이자소득 비과세",
    eligibility: "만 19~34세, 개인소득 6,000만원 이하(가구소득 요건 포함)",
    minAge: 19,
    maxAge: 34,
    region: "전국",
    officialUrl: "https://www.kinfa.or.kr/",
  },
  {
    id: "seoul-hope-double",
    title: "희망두배 청년통장",
    provider: "서울특별시",
    category: "asset",
    opportunityType: "save",
    benefit: "본인 월 15만원 저축 시 서울시가 동일액 매칭 · 2~3년 · 만기 최대 1,080만원(3년)",
    eligibility: "서울 거주 만 18~34세 근로청년, 본인 월소득 세전 255만원 이하",
    minAge: 18,
    maxAge: 34,
    region: "서울",
    officialUrl: "https://youth.seoul.go.kr/",
  },
  {
    id: "youth-tomorrow-savings",
    title: "청년내일저축계좌",
    provider: "보건복지부",
    category: "asset",
    opportunityType: "save",
    benefit: "본인 월 10만원 저축 시 정부 월 30만원 지원 · 3년 만기 원금 최대 1,440만원",
    eligibility: "만 15~39세 근로청년, 기준 중위소득 50% 이하(신규), 월 10만원 이상 근로·사업소득",
    minAge: 15,
    maxAge: 39,
    region: "전국",
    officialUrl: "https://www.bokjiro.go.kr/",
  },

  /* ── 금융 부담 줄이기 (borrow) ────────────────────────────────── */
  {
    id: "sunshine-loan-youth",
    title: "햇살론유스",
    provider: "서민금융진흥원",
    category: "finance",
    opportunityType: "borrow",
    benefit: "저금리 생활안정자금 · 금리 연 3.6% 이내 · 한도 1,200만원",
    eligibility: "만 19~34세, 연소득 3,500만원 이하(사회초년생·취업준비생·청년사업자)",
    minAge: 19,
    maxAge: 34,
    region: "전국",
    officialUrl: "https://www.kinfa.or.kr/",
  },

  /* ── 소득 늘리기 (earn) ───────────────────────────────────────── */
  {
    id: "national-employment-support",
    title: "국민취업지원제도 (청년 특례)",
    provider: "고용노동부 · 고용24",
    category: "employment",
    opportunityType: "earn",
    benefit: "구직촉진수당 월 60만원 × 6개월(최대 360만원) + 취업지원 서비스",
    eligibility: "만 15~34세 청년, 가구 중위소득 120% 이하, 재산 5억원 이하",
    minAge: 15,
    maxAge: 34,
    region: "전국",
    officialUrl: "https://www.work24.go.kr/",
  },
  {
    id: "tomorrow-learning-card",
    title: "국민내일배움카드",
    provider: "고용노동부 · 고용24",
    category: "employment",
    opportunityType: "earn",
    benefit: "직업훈련비 지원 (5년간 300만~500만원, 요건별) · 훈련장려금",
    eligibility: "국민 누구나(구직자·재직자·청년 포함, 일부 소득 상한)",
    region: "전국",
    officialUrl: "https://www.work24.go.kr/",
  },
  {
    id: "future-work-experience",
    title: "미래내일 일경험",
    provider: "고용노동부",
    category: "employment",
    opportunityType: "earn",
    benefit: "기업 일경험(인턴형·프로젝트형·기업탐방형) 참여 + 활동수당",
    eligibility: "미취업 청년(만 15~34세)",
    minAge: 15,
    maxAge: 34,
    region: "전국",
    officialUrl: "https://www.work24.go.kr/",
  },

  /* ── 돌려받기 (claim) ─────────────────────────────────────────── */
  {
    id: "earned-income-tax-credit",
    title: "근로장려금 (EITC)",
    provider: "국세청",
    category: "finance",
    opportunityType: "claim",
    benefit: "가구유형별 최대 165만~330만원(단독 165 · 홑벌이 285 · 맞벌이 330) 현금 환급",
    eligibility: "저소득 근로·사업·종교인 가구 (소득·재산 요건)",
    region: "전국",
    officialUrl: "https://www.hometax.go.kr/",
  },
  {
    id: "monthly-rent-tax-credit",
    title: "월세 세액공제",
    provider: "국세청",
    category: "finance",
    opportunityType: "claim",
    benefit: "월세액의 15~17% 세액공제 · 한도 연 1,000만원 · 최대 약 170만원 환급",
    eligibility: "무주택 세대주, 총급여 8,000만원 이하, 전용 85㎡ 이하 전입신고 주택",
    region: "전국",
    officialUrl: "https://www.hometax.go.kr/",
  },

  /* ── 금융 부담 줄이기 (reduce) ────────────────────────────────── */
  {
    id: "youth-finance-counsel",
    title: "청년 재무·채무 무료상담",
    provider: "서민금융진흥원 서민금융통합지원센터",
    category: "finance",
    opportunityType: "reduce",
    benefit: "무료 재무설계·채무 상담 및 채무조정 연계 (전국 센터·비대면)",
    eligibility: "재무·부채 고민이 있는 청년 누구나",
    region: "전국",
    officialUrl: "https://www.kinfa.or.kr/",
  },
];
