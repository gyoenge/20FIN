"use client";

import { useMemo, useState } from "react";
import { AssetIcon, PioSays } from "@/components/Brand";
import { TimelineLoading } from "@/components/timeline/TimelineStore";
import { PersonalContextBar } from "@/components/PersonalContextBar";
import { useOpportunities } from "@/lib/domain/useOpportunities";
import { timingBucket, type RankedOpportunity, type TimingBucket, type UserCtx } from "@/lib/domain/opportunity-rank";
import type { Opportunity } from "@/lib/domain/timeline";

/**
 * 지금의 기회 = Timeline-aware Opportunity Radar (설계 §8).
 * 1차 구조는 "언제 챙겨야 하는가"(지금/곧/미리)이고, 금융 목적은 필터 칩으로 좁힌다.
 */
const PURPOSE: Record<string, { label: string; asset: string }> = {
  save: { label: "돈 모으기", asset: "event-savings" },
  independence: { label: "독립 준비", asset: "event-housing" },
  education: { label: "학업·학자금", asset: "event-student-loan" },
  earn: { label: "소득 늘리기", asset: "event-first-salary" },
  relief: { label: "금융 부담 줄이기", asset: "utility-protection" },
  claim: { label: "돌려받기", asset: "utility-opportunity" },
};
const PURPOSE_ORDER = ["save", "independence", "education", "earn", "relief", "claim"];

const TIMING: Record<TimingBucket, { emoji: string; title: string; description: string }> = {
  now: { emoji: "🔥", title: "지금 확인하세요", description: "신청 마감이 가까워 지금 챙겨야 하는 기회" },
  soon: { emoji: "🌱", title: "곧 필요해요", description: "내 현재 상태·다가오는 계획과 연결된 기회" },
  later: { emoji: "🔭", title: "미리 알아두세요", description: "미리 알아두면 좋은 관련 정보" },
};
const TIMING_ORDER: TimingBucket[] = ["now", "soon", "later"];

/** 각 기회를 하나의 금융 목적 그룹에 배정한다 (필터 칩용). */
function purposeOf(opp: Opportunity): string {
  if (opp.category === "education") return "education";
  switch (opp.opportunityType) {
    case "save":
      return "save";
    case "earn":
      return "earn";
    case "claim":
      return "claim";
    case "borrow":
    case "reduce":
      return opp.category === "housing" ? "independence" : "relief";
  }
  switch (opp.category) {
    case "housing":
      return "independence";
    case "employment":
      return "earn";
    case "asset":
      return "save";
    default:
      return "relief";
  }
}

interface Item {
  r: RankedOpportunity;
  purpose: string;
  bucket: TimingBucket;
}

export default function OpportunitiesPage() {
  const { ranked, ctx, bundle, loading, error } = useOpportunities();

  const items = useMemo<Item[]>(
    () => ranked.map((r) => ({ r, purpose: purposeOf(r.opp), bucket: timingBucket(r, ctx as UserCtx) })),
    [ranked, ctx],
  );

  // 데이터에 실제 존재하는 목적만 칩으로 노출한다.
  const purposes = useMemo(() => {
    const present = new Set(items.map((i) => i.purpose));
    return PURPOSE_ORDER.filter((p) => present.has(p));
  }, [items]);

  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const shown = filter === "all" ? items : items.filter((i) => i.purpose === filter);
  const sections = TIMING_ORDER.map((b) => [b, shown.filter((i) => i.bucket === b)] as const).filter(([, list]) => list.length);

  return <div className="space-y-6">
    <header className="page-header opportunity-header"><div><p className="eyebrow">OPPORTUNITY RADAR</p><h1>지금의 금융 기회</h1><p>내 조건과 Timeline을 기준으로 오늘 챙길 기회를 시점별로 모았어요.</p></div><AssetIcon name="utility-opportunity" size={100} /></header>
    <PersonalContextBar />
    {bundle && !loading && <p className="opportunity-radar-summary">20FIN이 오늘 <strong>{bundle.total}개</strong>의 정보를 확인했어요. 지금 볼 만한 기회는 <strong>{ranked.length}개</strong>입니다.</p>}
    {loading && <TimelineLoading />}
    {error && <PioSays>정보를 불러오지 못했어요. 잠시 후 다시 방문해 주세요.</PioSays>}
    {!loading && !error && ranked.length === 0 && <PioSays>지금 보여드릴 기회를 찾지 못했어요. 새로운 계획이 있다면 타임라인에 추가해보세요.</PioSays>}
    {!loading && !error && items.length > 0 && <>
      <nav className="opportunity-chips" aria-label="금융 목적 필터">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>전체 <small>{items.length}</small></button>
        {purposes.map((p) => { const n = items.filter((i) => i.purpose === p).length; return <button key={p} type="button" aria-pressed={filter === p} onClick={() => setFilter(p)}>{PURPOSE[p].label} <small>{n}</small></button>; })}
      </nav>
      {sections.length === 0 && <PioSays>이 조건에 맞는 기회가 아직 없어요. 다른 필터를 눌러보세요.</PioSays>}
      {sections.map(([bucket, list]) => {
        const meta = TIMING[bucket];
        const open = expanded[bucket];
        const visible = open ? list : list.slice(0, 6);
        return <section key={bucket} className="opportunity-section timing-section" aria-live="polite">
          <div className="section-heading timing-heading"><div><h2><span aria-hidden="true">{meta.emoji}</span> {meta.title}</h2><p>{meta.description}</p></div><span>{list.length}개</span></div>
          <ul className="grid gap-5 xl:grid-cols-2">{visible.map((i) => <OpportunityCard key={i.r.opp.id} r={i.r} purposeKey={i.purpose} />)}</ul>
          {list.length > 6 && <button className="button opportunity-more" type="button" onClick={() => setExpanded((e) => ({ ...e, [bucket]: !open }))}>{open ? "간단히 보기" : `${list.length - 6}개 더 보기`}</button>}
        </section>;
      })}
    </>}
    {bundle && <p className="opportunity-source">출처: {bundle.sources.map(s => `${s.label} ${s.count}건`).join(" · ")}<br />관련성에 따른 안내이며, 최종 조건·신청 가능 여부는 공식 공고에서 확인해주세요.</p>}
  </div>;
}

function OpportunityCard({ r, purposeKey }: { r: RankedOpportunity; purposeKey: string }) {
  const { opp, reasons, dday } = r;
  const meta = PURPOSE[purposeKey] ?? PURPOSE.save;
  const amount = opp.benefit ?? (opp.eligibility as { amount?: string }).amount;
  return <li className="card-soft opportunity-card"><div className="flex items-start gap-4"><span className="asset-tile"><AssetIcon name={meta.asset} size={52} /></span><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap gap-2"><span className="status-badge confirmed">{meta.label}</span>{dday !== null && <span className="status-badge deadline">D-{dday}</span>}</div><h2>{opp.title}</h2><p className="provider">{opp.provider}</p></div></div>{amount && <p className="opportunity-benefit">{amount}</p>}{reasons.length > 0 && <div className="reasons"><p>내 계획과 어떤 관련이 있나요?</p><ul>{reasons.map((why, i) => <li key={i}><span className="text-fin-green-700">✓ </span>{why}</li>)}</ul></div>}{opp.officialUrl ? <a href={opp.officialUrl} target="_blank" rel="noopener noreferrer" className="button button-secondary">공식 정보 확인하기 ↗</a> : <p className="text-sm text-ink-500">신청 경로는 제공 기관에 확인해주세요.</p>}{opp.snapshotDate && <p className="opportunity-snapshot">기준일 {opp.snapshotDate} · 공식 공고에서 확인</p>}</li>;
}
