"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetIcon, PioSays } from "@/components/Brand";
import { TimelineLoading } from "@/components/timeline/TimelineStore";
import { PersonalContextBar } from "@/components/PersonalContextBar";
import { useOpportunities } from "@/lib/domain/useOpportunities";
import type { RankedOpportunity } from "@/lib/domain/opportunity-rank";
import type { Opportunity } from "@/lib/domain/timeline";

/**
 * 지금의 기회는 "출처"가 아니라 "금융 목적"으로 묶는다 (docs/opportunity-expansion.md §4).
 * 큐레이션 데이터는 opportunityType 을, 라이브 소스(청년정책·LH)는 category 를 근거로 분류한다.
 */
const PURPOSE: Record<string, { label: string; description: string; asset: string }> = {
  save: { label: "돈 모으기", description: "적금·통장으로 자산을 모으는 기회", asset: "event-savings" },
  independence: { label: "독립 준비", description: "주거·보증금 등 독립에 드는 비용을 줄이는 기회", asset: "event-housing" },
  education: { label: "학업·학자금", description: "등록금·학자금 부담을 더는 장학·지원", asset: "event-student-loan" },
  earn: { label: "소득 늘리기", description: "취업지원·훈련·수당으로 소득을 만드는 기회", asset: "event-first-salary" },
  relief: { label: "금융 부담 줄이기", description: "저금리 자금·상담으로 부담을 더는 기회", asset: "utility-protection" },
  claim: { label: "돌려받기", description: "받을 수 있는 환급·공제를 챙기는 기회", asset: "utility-opportunity" },
};
const PURPOSE_ORDER = ["save", "independence", "education", "earn", "relief", "claim"];

/** 각 기회를 하나의 금융 목적 그룹에 배정한다. */
function purposeOf(opp: Opportunity): string {
  switch (opp.opportunityType) {
    case "save":
      return "save";
    case "earn":
      return "earn";
    case "claim":
      return opp.category === "education" ? "education" : "claim";
    case "borrow":
    case "reduce":
      return opp.category === "housing" ? "independence" : "relief";
  }
  // 라이브 소스(opportunityType 없음)는 category 로 대체 분류
  switch (opp.category) {
    case "housing":
      return "independence";
    case "employment":
      return "earn";
    case "education":
      return "education";
    case "asset":
      return "save";
    default:
      return "relief";
  }
}

export default function OpportunitiesPage() {
  const { ranked, bundle, loading, error } = useOpportunities();
  const groups = useMemo(() => {
    const byPurpose = new Map<string, RankedOpportunity[]>();
    for (const item of ranked) {
      const key = purposeOf(item.opp);
      const list = byPurpose.get(key) ?? [];
      list.push(item);
      byPurpose.set(key, list);
    }
    return [...byPurpose.entries()].sort((a, b) => PURPOSE_ORDER.indexOf(a[0]) - PURPOSE_ORDER.indexOf(b[0]));
  }, [ranked]);
  const [active, setActive] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (groups.length && !groups.some(([key]) => key === active)) setActive(groups[0][0]);
  }, [groups, active]);

  const selected = groups.find(([key]) => key === active);
  const visible = selected ? (expanded ? selected[1] : selected[1].slice(0, 6)) : [];
  const activeMeta = PURPOSE[active] ?? PURPOSE.save;

  return <div className="space-y-6">
    <header className="page-header opportunity-header"><div><p className="eyebrow">OPPORTUNITIES FOR YOU</p><h1>지금의 기회</h1><p>내 계획에 가까운 금융 기회를 목적별로 모았어요.</p></div><AssetIcon name="utility-opportunity" size={100} /></header>
    <PersonalContextBar />
    {bundle && !loading && <div className="opportunity-summary"><span>금융정보 <strong>{bundle.total}개</strong> 확인</span><span aria-hidden="true">→</span><span>나이 · 지역 · 계획 · 마감 기준</span><strong>관련 정보 {ranked.length}개</strong></div>}
    {loading && <TimelineLoading />}
    {error && <PioSays>정보를 불러오지 못했어요. 잠시 후 다시 방문해 주세요.</PioSays>}
    {!loading && !error && ranked.length === 0 && <PioSays>지금 보여드릴 기회를 찾지 못했어요. 새로운 계획이 있다면 타임라인에 추가해보세요.</PioSays>}
    {!loading && !error && groups.length > 0 && <>
      <nav className="opportunity-groups" aria-label="기회 목적">
        {groups.map(([key, items]) => { const meta = PURPOSE[key] ?? PURPOSE.save; return <button key={key} type="button" aria-pressed={active === key} onClick={() => { setActive(key); setExpanded(false); }}><AssetIcon name={meta.asset} size={34} /><span><strong>{meta.label}</strong><small>{items.length}개</small></span></button>; })}
      </nav>
      {selected && <section className="opportunity-section" aria-live="polite">
        <div className="section-heading opportunity-section-heading"><div><h2>{activeMeta.label}</h2><p>{activeMeta.description}</p></div><span>{selected[1].length}개</span></div>
        <ul className="grid gap-5 xl:grid-cols-2">{visible.map(item => <OpportunityCard key={item.opp.id} r={item} purposeKey={active} />)}</ul>
        {selected[1].length > 6 && <button className="button opportunity-more" type="button" onClick={() => setExpanded(v => !v)}>{expanded ? "간단히 보기" : `${selected[1].length - 6}개 더 보기`}</button>}
      </section>}
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
