# 지금의 기회 확장 설계 — Opportunity 를 20FIN의 핵심 금융 섹션으로

> 목적: `지금의 기회`를 "청년정책 추천"에서 **"20대 금융 Opportunity Agent"**로 넓힌다.
> 기준일 정책: 모든 큐레이션 데이터는 공식값을 반영하되 **정보 기준일**을 표기하고 **"최종 조건·신청 가능 여부는 공식 공고에서 확인"**을 고지한다.

---

## 1. 배경 — 지금의 한계

현재 소스는 **온통청년(청년정책) · LH(주거공고) · 한국장학재단(장학금)** 뿐이라, 사용자에게 "복지·정책 추천"처럼 보인다. 20대의 실제 금융 니즈(모으기·덜 빌리기·덜 쓰기·지원받기·소득 늘리기)를 포괄하지 못한다.

## 2. Opportunity 재정의

> **Opportunity = 지금 내 금융상황 또는 가까운 Life Event에 실제 도움이 되는 금융상품·지원정책·주거기회·교육/취업지원·절감기회**

정책뿐 아니라 **돈을 모으고, 덜 빌리고, 덜 쓰고, 지원받고, 소득을 늘릴 수 있는 모든 기회**를 다룬다.

---

## 3. 데이터 모델 확장

`Opportunity`(현재: `src/lib/domain/timeline.ts`)에 다음을 추가한다.

```ts
export type OpportunityType =
  | "save"    // 돈을 모으는 기회 (자산형성 적금·통장)
  | "earn"    // 소득을 늘리는 기회 (취업지원·훈련·수당)
  | "borrow"  // 낮은 비용으로 자금 조달 (저금리 청년대출)
  | "reduce"  // 비용을 줄이는 기회 (주거비 지원·전환대출·상담)
  | "claim";  // 받을 수 있는 지원을 받는 것 (세금환급·공제·급여)

export interface Opportunity {
  // ...기존 필드...
  opportunityType?: OpportunityType;   // 금융 목적 축 (신규)
  benefitType?: "cash" | "matching" | "loan" | "tax" | "housing" | "training" | "counsel";
  benefit?: string;         // "월 최대 50만원 · 정부기여금 매칭 · 3년" 같은 요약(공식값)
  snapshotDate?: string;    // 큐레이션 데이터의 정보 기준일 (YYYY-MM-DD)
}
```

### 세 축의 관계

| 축 | 값 | 용도 |
| --- | --- | --- |
| `category` (기존) | housing/employment/asset/education/finance | 소스 정규화·데이터 분류 |
| `opportunityType` (신규) | save/earn/borrow/reduce/claim | **20대 경제활동과 연결** — 랭킹 근거·라벨 |
| UI 금융목적 그룹 (§4) | 돈 모으기/독립 준비/… | 화면 묶음(사용자 노출) |

---

## 4. UI는 "출처"가 아니라 "금융 목적"으로 묶는다

사용자에게 `온통청년/LH/서민금융진흥원`을 노출하는 건 의미 없다. 금융 목적으로 그룹핑한다.

| 그룹(UI) | 아이콘 | 매핑(category / opportunityType) |
| --- | --- | --- |
| 돈 모으기 | 💰 | asset / `save` |
| 독립 준비 | 🏠 | housing / `reduce`·`borrow` |
| 학업·학자금 | 🎓 | education / `claim`·`borrow` |
| 소득 늘리기 | 💼 | employment / `earn` |
| 금융 부담 줄이기 | 💳 | finance / `borrow`·`reduce` |
| 돌려받기 | 🧾 | finance / `claim` |

> 출처(source)는 카드 하단 "출처: … · 실시간/기준일"로만 표시한다.

---

## 5. 데이터 소스 맵

연동 방식: **live**(실시간 API) · **curated**(정적 실데이터 seed, 기준일 표기) · **future**(신규 API 필요, 뒤로).

| 영역 | 소스 | 가져올 기회 | 방식 |
| --- | --- | --- | --- |
| 청년정책 | 온통청년 | 중앙·지역 청년정책(고용/주거/교육/복지) | **live** (기존) |
| 주택 | LH | 청년임대 공고 | **live** (기존) |
| 장학금 | 한국장학재단 | 국가·지역 장학금 | **curated** (기존) |
| 자산형성 | 서민금융진흥원·금융위·서울시 | 청년미래적금, 희망두배 청년통장, 청년도약계좌 | **curated** (P0) |
| 서민금융 | 서민금융진흥원 | 햇살론유스, 청년 미래이음 대출, 미소금융 | **curated** (P0) |
| 소득·커리어 | 고용24 | 국민취업지원제도, 국민내일배움카드, 미래내일 일경험 | **curated** (P0) |
| 세금·환급 | 국세청 | 근로장려금, 월세 세액공제, 연말정산 안내 | **curated** (P0) |
| 금융상담 | 서민금융진흥원·신용회복위 | 무료 재무·신용상담, 채무조정 | **curated** (P0) |
| 학자금(대출) | 한국장학재단 | 취업후상환·일반상환·생활비대출, 국가근로 | **curated** (P1 — 기존 seed 확장) |
| 주거금융 | 주택도시기금·HUG | 청년 전세자금, 버팀목/중기청 | **curated** (P1) |
| 서울주거 | SH·청년안심주택 | 청년안심주택, 청년월세지원 | **future/curated** (P1) |
| 예·적금 비교 | 금감원 금융상품한눈에·은행연합회 | 시중 예·적금 금리비교 | **future** (P1) |
| 복지 | 복지로 | 연령무관 실제 해당 복지(주거·생계·의료) | **future** (P2) |
| 지자체 | 각 지역 청년포털 | 지역 자산형성·월세·취업 | **future** (P2, 광역까지) |
| 보험 | 보험다모아 | 사회초년생 보장 점검 | **future** (P2) |

---

## 6. P0 큐레이션 seed (지금 추가)

새 파일 `src/lib/data/seed/programs.ts` (장학금 seed와 동일 패턴). 각 항목은 **공식값 + 기준일 + 공식 URL**. 구현 시 상위 항목은 공식 페이지로 값 검증(WebFetch).

| 프로그램 | 제공 | 대상 | 핵심 혜택(기준 확인) | type | category | 공식 |
| --- | --- | --- | --- | --- | --- | --- |
| 청년미래적금 | 서민금융진흥원 | 만 19~34세 | 월 최대 50만원·3년, 정부기여금(일반6%/우대12%)·비과세 | save | asset | kinfa.or.kr |
| 희망두배 청년통장 | 서울시 | 서울 근로청년 | 본인 저축 동일액 매칭(월 15만원 기준) | save | asset | seoul.go.kr |
| 청년도약계좌 | 금융위 | 만 19~34세 | 정부기여금+비과세 자산형성(유지·후속 정보) | save | asset | 공식 |
| 햇살론유스 | 서민금융진흥원 | 만 19~34세, 연소득 3,500만원↓ | 저금리 생활안정자금 | borrow | finance | kinfa.or.kr |
| 청년 미래이음 대출 | 서민금융진흥원 | 금융이력 부족 청년 | 신용 형성 지원 대출(2026 출시) | borrow | finance | 공식 |
| 국민취업지원제도 | 고용24 | 취업취약·청년 | 구직촉진수당·취업지원 | earn | employment | work24.go.kr |
| 국민내일배움카드 | 고용24 | 국민(청년 포함) | 직업훈련비 지원 | earn | employment | work24.go.kr |
| 미래내일 일경험 | 고용24 | 청년 | 일경험(인턴/프로젝트) | earn | employment | work24.go.kr |
| 근로장려금(EITC) | 국세청 | 저소득 근로/사업 | 현금 환급 | claim | finance | hometax.go.kr |
| 월세 세액공제 | 국세청 | 무주택 근로자 | 월세액 세액공제 | claim | finance | hometax.go.kr |
| 청년 재무상담 | 서민금융진흥원 | 청년 | 무료 재무·채무 상담 | reduce | finance | kinfa.or.kr |

> 표의 수치는 **설계 참고값**이다. 구현 시 각 항목의 공식 페이지에서 최신값을 확인해 `benefit`·`snapshotDate`에 반영하고, UI에는 기존 고지문("최종 조건은 공식 공고에서 확인")을 유지한다. 변동 가능성이 큰 수치는 범위/정성 표현을 우선한다.

### 상품 추천의 경계 (중요)

특정 은행 상품을 무작위 추천하지 않는다. "A은행 적금 가입하세요"(X) → **"현재 조건에서 비교할 가치가 있는 금융상품군 + 공식 비교정보"**(O). 정책형 vs 시중상품은 향후 공식 비교공시(금감원·은행연합회)로만 노출한다.

---

## 7. 랭킹 반영

기존 `Score = Fit × Timing × Actionability`(`opportunity-rank.ts`)에 다음만 보강:
- `opportunityType`은 점수 축이 아니라 **라벨·근거·그룹핑**에 사용.
- Life Event ↔ opportunityType 연결로 근거 문구 강화:
  - 첫 취업/취업 예정 → `save`(자산형성) "첫 자산형성 단계와 관련", `earn`(취업지원) "취업 준비와 관련"
  - 독립 목표 → `reduce`/`borrow`(주거금융) "독립 자금 마련과 관련"
  - 학자금 보유 → `claim`/`borrow`(학자금) "학자금 부담과 관련"
- 지역 필터(이미 구현): 큐레이션 전국 프로그램은 `nationwide`로 분류돼 지역 무관 노출. 지자체형(희망두배=서울)은 `regionText`에 지역 포함 → 지역 매칭.

---

## 8. Opportunity Radar UX (지향점)

```text
이번 달 20FIN이 찾은 금융 기회
6개 소스의 214개 정보를 확인했어요.
지민님의 Timeline에 지금 의미 있는 기회는 5개입니다.

💰 돈 모으기 2   🏠 독립 준비 1   💼 소득 늘리기 1   🎓 학자금 1

🔥 지금 가장 먼저 확인 — 청년미래적금
첫 취업 이후 자산형성 계획과 관련  ·  월 최대 50만원 · 정부기여금(기준 확인)
왜 지금? 자산형성을 시작하는 단계이고 가입 일정이 열려 있어요.
[내 월 납입액으로 계산]  [공식 정보]     ※ 기준일 · 공식 공고에서 확인
```

`[내 월 납입액으로 계산]`은 규칙 기반 적금 계산기(비-LLM)로 연결 — 향후.

---

## 9. 구현 우선순위

**P0 (지금)** — 큐레이션만으로 즉시 풍부해짐
1. 모델: `opportunityType`·`benefit`·`snapshotDate` 추가
2. seed: `programs.ts`(자산형성·서민금융·소득·세금·상담) + 기존 장학금에 opportunityType 부여
3. source: `opportunity-source.ts`에 programs 소스 추가, 기존 소스에 opportunityType 매핑
4. UI: 금융 목적 그룹으로 묶기(§4) + 출처는 하단 표기

**P1** — 학자금(대출) 확장, 주거금융(주택도시기금), 금감원/은행연합회 금리비교, SH/청년안심주택
**P2** — 복지로, 지자체(광역), 국세청 API, 보험 비교

---

## 10. 영향 파일

| 파일 | 변경 |
| --- | --- |
| `src/lib/domain/timeline.ts` | `Opportunity`에 opportunityType/benefit/snapshotDate |
| `src/lib/data/seed/programs.ts` | 신규 — P0 큐레이션 프로그램 |
| `src/lib/agent/opportunity-source.ts` | programs 소스 병합, 소스별 opportunityType 매핑 |
| `src/lib/domain/opportunity-rank.ts` | opportunityType 기반 근거 문구, 그룹 키 |
| `src/app/opportunities/page.tsx` | 카테고리 → 금융 목적 그룹 렌더(병렬 작업과 조율 필요) |

> 결과: `정책/LH/장학금` → `자산형성/주거금융/학자금/저금리 금융/소득·취업/세금환급`까지 확장되어, 공모전 주제 **"청년층 자산 형성을 위한 AI 기반 포용적 금융서비스"**와의 연결이 강해진다.
