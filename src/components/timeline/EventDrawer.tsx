"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AssetIcon, eventAsset, Pio } from "@/components/Brand";
import { useTimeline } from "@/components/timeline/TimelineStore";
import { regenerateFinEvents, setFinEventStatus, updateLifeEvent } from "@/lib/domain/state";
import { computeReadiness } from "@/lib/domain/readiness";
import { daysUntil, formatEventDate, monthsUntil, shiftEventDate, type LifeEvent } from "@/lib/domain/timeline";
const LABEL = { confirmed: "✓ 확정", expected: "◇ 예상", goal: "☆ 목표" };
export function EventDrawer({ event, onClose }: { event: LifeEvent; onClose: () => void ;}) {
  const { state, update } = useTimeline(); const dialog = useRef<HTMLDialogElement>(null);
  const [whatif, setWhatif] = useState<number | null>(null);
  useEffect(() => { const el = dialog.current; const prior = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; el?.showModal(); document.body.style.overflow = "hidden"; return () => { el?.close(); document.body.style.overflow = overflow; prior?.focus() ;} ;}, []);
  // What-if 로 시점을 바꾸면 상태가 갱신되므로, 표시는 항상 스토어의 최신 이벤트를 따른다.
  const ev = state.lifeEvents.find(e => e.id === event.id) ?? event;
  const checks = state.finEvents.filter(f => f.lifeEventId === event.id).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")); const completed = checks.filter(f => f.status === "completed").length; const ratio = checks.length ? Math.round(completed / checks.length * 100) : 0; const d = daysUntil(ev.date);
  const financial = state.financialContext; const hasFinancial = financial?.savings !== undefined && financial?.emergencyFund !== undefined && financial?.monthlyIncome !== undefined && financial?.monthlyExpense !== undefined; const readiness = hasFinancial ? computeReadiness(event, checks, financial) : null;
  // Future-to-Now: 역산된 체크포인트 중 "지금 시점"(마감 임박·지난 첫 미완료, 없으면 다음 미완료)을 찾는다.
  const pendingDated = checks.filter(f => f.status !== "completed" && f.dueDate);
  const currentCheck = pendingDated.find(f => (daysUntil(f.dueDate) ?? 999) <= 30) ?? pendingDated[0];
  const isFuture = ev.status !== "past";
  // What-if: 결정론적 시뮬레이션 (설계 §40 — 수치 계산은 규칙 엔진).
  const simDate = whatif !== null ? shiftEventDate(ev.date, whatif) : null;
  const beforeM = monthsUntil(ev.date), afterM = simDate ? monthsUntil(simDate) : null;
  const DEPOSIT_TARGET = 5_000_000;
  const needSave = (months: number | null) => (months && months > 0 ? Math.max(0, DEPOSIT_TARGET - (financial?.savings ?? 0)) / months : null);
  const showSaving = (ev.subtype === "independence" || ev.subtype === "independence-fund") && financial?.savings != null;
  const won = (n: number | null) => (n === null ? "—" : `약 ${Math.round(n / 10000).toLocaleString()}만원`);
  const applyWhatif = () => { if (simDate) update(s => regenerateFinEvents(updateLifeEvent(s, event.id, { date: simDate }))); setWhatif(null); };
  return <dialog ref={dialog} className="fin-dialog" aria-labelledby="event-title" onCancel={e => { e.preventDefault(); onClose() ;}} onClick={e => { if (e.target === e.currentTarget) onClose() ;}}><div className="drawer-layout"><header className="drawer-header"><AssetIcon name={eventAsset(event)} size={64} /><div><span className={`status-badge ${ev.certainty}`}>{LABEL[ev.certainty]}</span><h2 id="event-title">{ev.title}</h2><p>{formatEventDate(ev.date)}{d !== null && d > 0 ? ` · D-${d}` : ""}</p></div><button onClick={onClose} className="icon-button" aria-label="이벤트 상세 닫기" autoFocus>×</button></header>
    <div className="drawer-content"><section><div className="readiness-header"><h3>준비 체크포인트</h3><strong>{completed}<small style={{ fontSize: 14, color: "#637580" }}> / {checks.length}</small></strong></div><div className="progress-track" role="progressbar" aria-label="체크포인트 완료율" aria-valuenow={ratio} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${ratio}%` }} /></div>{isFuture && currentCheck ? <p className="futurenow-banner">🎯 <strong>오늘은 ‘{currentCheck.title}’ 시점</strong>이에요{d !== null && d > 0 ? ` · ${event.title}까지 D-${d}` : ""}</p> : <p style={{ marginTop: 10 }}>완료한 준비를 표시하면 다음 할 일을 살펴보기 쉬워요.</p>}</section>
      <section>{checks.length > 0 ? <><h3>준비 로드맵</h3><p className="roadmap-hint">미래의 {event.title}에서 지금 해야 할 준비를 역산했어요.</p>{checks.map(f => { const cd = daysUntil(f.dueDate); const isNow = f.id === currentCheck?.id; return <label key={f.id} className={`checklist-row ${f.status === "completed" ? "done" : ""} ${isNow ? "current" : ""}`}><input type="checkbox" checked={f.status === "completed"} onChange={e => update(s => setFinEventStatus(s, f.id, e.target.checked ? "completed" : "pending"))} /><span><strong>{f.title}{isNow && <em className="now-tag">지금</em>}{f.sourceOpportunityId && <em className="now-tag saved">담은 기회</em>}</strong>{f.note && <small>{f.note}</small>}<small>{formatEventDate(f.dueDate)} 예정{cd !== null ? ` · ${cd > 0 ? `D-${cd}` : cd === 0 ? "오늘" : "지남"}` : ""}</small></span></label>; })}</> : <div className="unknown-readiness"><h3>아직 체크포인트가 없어요.</h3><p>피오에게 이 계획을 위해 무엇을 준비하면 좋을지 물어보세요.</p></div>}</section>
      {readiness ? <section><div className="readiness-header"><h3>금융 준비도</h3><strong>{readiness.overallScore}%</strong></div><p>입력한 금융정보와 체크포인트에 따른 참고 지표예요.</p><div className="readiness-dims">{readiness.dimensions.map(dim => <div key={dim.key}><label>{dim.label}</label><div className="progress-track"><span style={{ width: `${dim.score}%` }} /></div><span>{dim.score}%</span></div>)}</div></section> : <section className="unknown-readiness"><h3>금융 준비도 · 확인 필요</h3><p>소득·지출·저축·비상금 정보가 충분하지 않아 점수를 표시하지 않았어요.</p></section>}
      {isFuture && ev.date && <section className="whatif"><h3>What-if · 시점을 바꾸면?</h3><p>{ev.title} 시점을 옮기면 준비 계획이 어떻게 달라지는지 미리 봐요.</p>
        <div className="whatif-options">{[-3, 3, 6].map(m => <button key={m} type="button" aria-pressed={whatif === m} onClick={() => setWhatif(whatif === m ? null : m)}>{m < 0 ? `${-m}개월 앞당기기` : `${m}개월 미루기`}</button>)}</div>
        {whatif !== null && simDate && <div className="whatif-preview"><div className="whatif-row"><span>시점</span><strong>{formatEventDate(ev.date)} → {formatEventDate(simDate)}</strong></div><div className="whatif-row"><span>준비 기간</span><strong>{beforeM ?? "—"}개월 → {afterM ?? "—"}개월</strong></div>{showSaving && <div className="whatif-row"><span>필요 월 저축 (보증금 목표 기준)</span><strong>{won(needSave(beforeM))} → {won(needSave(afterM))}</strong></div>}<p className="whatif-note">준비 체크포인트도 함께 {whatif < 0 ? "앞당겨" : "미뤄"}집니다.</p><button type="button" className="button button-primary" onClick={applyWhatif}>이 시점으로 Timeline 변경</button></div>}
      </section>}
      <section className="drawer-insight"><Pio mood={completed === checks.length && checks.length > 0 ? "celebrate" : "guide"} size={48} /><div><strong>피오의 한마디</strong><p>{ev.status === "past" ? "지나온 경험도 다음 계획의 소중한 출발점이에요." : d !== null && d > 0 ? `${ev.title}까지 약 ${Math.max(1, Math.round(d / 30))}개월 남았어요. 예정된 체크포인트부터 차근차근 확인해보세요.` : "정확한 시점을 알게 되면 준비 계획을 더 구체적으로 세울 수 있어요."}</p></div></section>
      <Link href="/opportunities" className="aside-item"><AssetIcon name="utility-opportunity" size={44} /><span><strong>함께 확인할 기회</strong><small>내 계획과 관련된 청년지원 살펴보기</small></span><span className="chevron">›</span></Link></div>
    <footer className="drawer-footer"><Link href={`/ask?event=${encodeURIComponent(event.id)}`} className="button button-primary">피오에게 {event.title} 계획 물어보기 ↗</Link></footer></div></dialog>;
}
