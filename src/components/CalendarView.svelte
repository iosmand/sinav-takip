<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExamResult, CalendarMode, DaySummary } from '../lib/types';
  import { getResults, getDaySummaries, getResultsForDate, getStreak } from '../lib/store';

  let results: ExamResult[] = $state([]);
  let summaries: Map<string, DaySummary> = $state(new Map());
  let mode: CalendarMode = $state('monthly');
  let selectedDate = $state(new Date());
  let selectedDayKey = $state('');

  onMount(() => {
    results = getResults();
    summaries = getDaySummaries(results);
  });

  const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const DAYS_TR = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

  function toKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  function pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  // --- Period stats ---
  let periodResults = $derived.by(() => {
    if (mode === 'daily' && selectedDayKey) {
      return getResultsForDate(results, selectedDayKey);
    }
    return results.filter((r) => {
      const d = r.date.slice(0, 10);
      if (mode === 'yearly') return d.startsWith(selectedDate.getFullYear().toString());
      if (mode === 'monthly') {
        const prefix = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}`;
        return d.startsWith(prefix);
      }
      if (mode === 'weekly') {
        const weekStart = getWeekStart(selectedDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return d >= toKey(weekStart) && d <= toKey(weekEnd);
      }
      return true;
    });
  });

  let periodStats = $derived.by(() => {
    let total = 0, correct = 0, wrong = 0, blank = 0, net = 0;
    for (const r of periodResults) {
      total += r.correct + r.wrong + r.blank;
      correct += r.correct;
      wrong += r.wrong;
      blank += r.blank;
      net += r.netScore;
    }
    return {
      total, correct, wrong, blank,
      net: Math.round(net * 100) / 100,
      count: periodResults.length,
      streak: getStreak(summaries),
    };
  });

  // --- Navigation ---
  function sod(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  let canGoForward = $derived.by(() => {
    const now = new Date();
    const d = selectedDate;
    if (mode === 'yearly') return d.getFullYear() < now.getFullYear();
    if (mode === 'monthly') {
      return d.getFullYear() < now.getFullYear() ||
        (d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth());
    }
    if (mode === 'weekly') {
      const cur = getWeekStart(d);
      const todayWeek = getWeekStart(now);
      return cur.getTime() < todayWeek.getTime();
    }
    return sod(d).getTime() < sod(now).getTime();
  });

  function prev() {
    const d = new Date(selectedDate);
    if (mode === 'yearly') d.setFullYear(d.getFullYear() - 1);
    else if (mode === 'monthly') d.setMonth(d.getMonth() - 1);
    else if (mode === 'weekly') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    selectedDate = d;
    selectedDayKey = toKey(d);
  }

  function next() {
    if (!canGoForward) return;
    const d = new Date(selectedDate);
    if (mode === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else if (mode === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (mode === 'weekly') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    selectedDate = d;
    selectedDayKey = toKey(d);
  }

  function selectDay(key: string) {
    selectedDayKey = key;
    selectedDate = new Date(key + 'T00:00:00');
    mode = 'daily';
  }

  let periodLabel = $derived.by(() => {
    if (mode === 'yearly') return selectedDate.getFullYear().toString();
    if (mode === 'monthly') return `${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    if (mode === 'weekly') {
      const ws = getWeekStart(selectedDate);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return `${ws.getDate()} ${MONTHS_TR[ws.getMonth()]} - ${we.getDate()} ${MONTHS_TR[we.getMonth()]}`;
    }
    return `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  });

  // --- Monthly grid ---
  function getWeekStart(d: Date): Date {
    const result = new Date(d);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    return result;
  }

  let monthGrid = $derived.by(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days: { key: string; day: number; inMonth: boolean; summary: DaySummary | undefined }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const key = toKey(d);
      days.push({ key, day: d.getDate(), inMonth: false, summary: summaries.get(key) });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const key = `${year}-${pad(month + 1)}-${pad(d)}`;
      days.push({ key, day: d, inMonth: true, summary: summaries.get(key) });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const key = toKey(d);
        days.push({ key, day: d.getDate(), inMonth: false, summary: summaries.get(key) });
      }
    }
    return days;
  });

  // --- Yearly: 12 month cards ---
  interface MonthSummary {
    month: number;
    label: string;
    total: number;
    correct: number;
    wrong: number;
    blank: number;
    net: number;
    examCount: number;
    activeDays: number;
  }

  let yearMonths = $derived.by(() => {
    const year = selectedDate.getFullYear();
    const months: MonthSummary[] = [];
    for (let m = 0; m < 12; m++) {
      const prefix = `${year}-${pad(m + 1)}`;
      const monthResults = results.filter((r) => r.date.slice(0, 7) === prefix);
      let total = 0, correct = 0, wrong = 0, blank = 0, net = 0;
      const daySet = new Set<string>();
      for (const r of monthResults) {
        total += r.correct + r.wrong + r.blank;
        correct += r.correct;
        wrong += r.wrong;
        blank += r.blank;
        net += r.netScore;
        daySet.add(r.date.slice(0, 10));
      }
      months.push({
        month: m,
        label: MONTHS_TR[m],
        total, correct, wrong, blank,
        net: Math.round(net * 100) / 100,
        examCount: monthResults.length,
        activeDays: daySet.size,
      });
    }
    return months;
  });

  let yearMaxTotal = $derived(Math.max(1, ...yearMonths.map((m) => m.total)));

  function goToMonth(m: number) {
    const d = new Date(selectedDate);
    d.setMonth(m);
    selectedDate = d;
    mode = 'monthly';
  }

  // --- Weekly bars ---
  let weekDays = $derived.by(() => {
    const ws = getWeekStart(selectedDate);
    const days: { key: string; label: string; summary: DaySummary | undefined }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      const key = toKey(d);
      days.push({ key, label: `${DAYS_TR[i]} ${d.getDate()}`, summary: summaries.get(key) });
    }
    return days;
  });

  let weekMax = $derived(
    Math.max(1, ...weekDays.map((d) => d.summary?.totalQuestions ?? 0))
  );

  function pct(v: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((v / total) * 1000) / 10;
  }

  function fmtDate(d: string): string {
    return new Date(d).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
</script>

<div class="cal-view">
  <!-- Mode selector -->
  <div class="mode-bar">
    {#each (['yearly','monthly','weekly','daily'] as const) as m}
      <button class="mode-btn" class:active={mode === m} onclick={() => { mode = m; }}>
        {m === 'yearly' ? 'Yıllık' : m === 'monthly' ? 'Aylık' : m === 'weekly' ? 'Haftalık' : 'Günlük'}
      </button>
    {/each}
  </div>

  <!-- Period nav -->
  <div class="period-nav">
    <button class="nav-arrow" onclick={prev} aria-label="Önceki">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <span class="period-label">{periodLabel}</span>
    <button class="nav-arrow" onclick={next} aria-label="Sonraki" disabled={!canGoForward}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  </div>

  <!-- Stats row -->
  <div class="stats-row">
    <div class="stat-box"><span class="sn">{periodStats.total}</span><span class="sl">Soru</span></div>
    <div class="stat-box" data-color="correct"><span class="sn">{periodStats.correct}</span><span class="sl">Doğru</span></div>
    <div class="stat-box" data-color="wrong"><span class="sn">{periodStats.wrong}</span><span class="sl">Yanlış</span></div>
    <div class="stat-box" data-color="blank"><span class="sn">{periodStats.blank}</span><span class="sl">Boş</span></div>
    <div class="stat-box net"><span class="sn">{periodStats.net}</span><span class="sl">Ort Net</span></div>
    <div class="stat-box streak"><span class="sn">{periodStats.streak}</span><span class="sl">Seri</span></div>
  </div>

  <!-- Calendar body -->
  <div class="cal-body glass-card">
    {#if mode === 'yearly'}
      <div class="year-grid">
        {#each yearMonths as ms}
          <button class="ym-card" class:empty={ms.total === 0} onclick={() => goToMonth(ms.month)}>
            <div class="ym-header">
              <span class="ym-name">{ms.label}</span>
              {#if ms.total > 0}
                <span class="ym-badge">{ms.examCount} sınav</span>
              {/if}
            </div>
            {#if ms.total > 0}
              <div class="seg-bar">
                {#if ms.correct > 0}<div class="seg correct" style="flex: {ms.correct}"><span class="seg-lbl">{pct(ms.correct, ms.total)}%</span></div>{/if}
                {#if ms.wrong > 0}<div class="seg wrong" style="flex: {ms.wrong}"><span class="seg-lbl">{pct(ms.wrong, ms.total)}%</span></div>{/if}
                {#if ms.blank > 0}<div class="seg blank" style="flex: {ms.blank}"><span class="seg-lbl">{pct(ms.blank, ms.total)}%</span></div>{/if}
              </div>
              <div class="ym-stats">
                <span class="ym-s">{ms.total} soru</span>
                <span class="ym-s correct">D:{ms.correct}</span>
                <span class="ym-s wrong">Y:{ms.wrong}</span>
                <span class="ym-s blank">B:{ms.blank}</span>
              </div>
              <div class="ym-footer">
                <span class="ym-net">Net: {ms.net}</span>
                <span class="ym-days">{ms.activeDays} gün</span>
              </div>
            {:else}
              <div class="ym-empty-txt">Veri yok</div>
            {/if}
          </button>
        {/each}
      </div>

    {:else if mode === 'monthly'}
      <div class="month-view">
        <div class="mv-header">
          {#each DAYS_TR as d}
            <span class="mv-day-name">{d}</span>
          {/each}
        </div>
        <div class="mv-grid">
          {#each monthGrid as cell}
            <button
              class="mv-cell"
              class:out={!cell.inMonth}
              class:has-data={!!cell.summary}
              class:today={cell.key === toKey(new Date())}
              onclick={() => selectDay(cell.key)}
            >
              <div class="mv-top">
                <span class="mv-num">{cell.day}</span>
                {#if cell.summary}
                  <span class="mv-badge">{cell.summary.examCount}</span>
                {/if}
              </div>
              {#if cell.summary}
                {@const s = cell.summary}
                {@const tot = s.totalQuestions}
                <div class="seg-bar xs">
                  {#if s.correct > 0}<div class="seg correct" style="flex: {s.correct}"><span class="seg-lbl">{pct(s.correct, tot)}%</span></div>{/if}
                  {#if s.wrong > 0}<div class="seg wrong" style="flex: {s.wrong}"><span class="seg-lbl">{pct(s.wrong, tot)}%</span></div>{/if}
                  {#if s.blank > 0}<div class="seg blank" style="flex: {s.blank}"><span class="seg-lbl">{pct(s.blank, tot)}%</span></div>{/if}
                </div>
                <div class="mv-stats">
                  <span class="mv-total">{tot} soru</span>
                  <span class="mv-s correct">D:{s.correct}</span>
                  <span class="mv-s wrong">Y:{s.wrong}</span>
                  <span class="mv-s blank">B:{s.blank}</span>
                </div>
                <span class="mv-net">Net: {s.netScore}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

    {:else if mode === 'weekly'}
      <div class="week-chart">
        {#each weekDays as wd}
          {@const s = wd.summary}
          {@const tot = s ? s.totalQuestions : 0}
          {@const scale = tot / weekMax}
          <div class="wc-row">
            <span class="wc-label">{wd.label}</span>
            <div class="wc-bar-outer">
              <div class="wc-bar-inner" style="width: {scale * 100}%">
                {#if s && tot > 0}
                  <div class="seg-bar sm">
                    {#if s.correct > 0}<div class="seg correct" style="flex: {s.correct}"><span class="seg-lbl">{pct(s.correct, tot)}%</span></div>{/if}
                    {#if s.wrong > 0}<div class="seg wrong" style="flex: {s.wrong}"><span class="seg-lbl">{pct(s.wrong, tot)}%</span></div>{/if}
                    {#if s.blank > 0}<div class="seg blank" style="flex: {s.blank}"><span class="seg-lbl">{pct(s.blank, tot)}%</span></div>{/if}
                  </div>
                {/if}
              </div>
            </div>
            <span class="wc-val">{tot}</span>
            <button class="wc-go" onclick={() => selectDay(wd.key)} aria-label="Detay">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        {/each}
      </div>

    {:else if mode === 'daily'}
      {#if periodResults.length === 0}
        <div class="daily-empty">Bu gün için kayıt bulunmuyor</div>
      {:else}
        <div class="daily-list">
          {#each periodResults as r (r.id)}
            {@const rTotal = r.correct + r.wrong + r.blank}
            <div class="daily-item">
              <div class="di-top">
                <span class="di-name">{r.examName || r.configName}</span>
                <span class="di-subj">{r.subject || '-'}</span>
              </div>
              {#if rTotal > 0}
                <div class="seg-bar">
                  {#if r.correct > 0}<div class="seg correct" style="flex: {r.correct}"><span class="seg-lbl">{pct(r.correct, rTotal)}%</span></div>{/if}
                  {#if r.wrong > 0}<div class="seg wrong" style="flex: {r.wrong}"><span class="seg-lbl">{pct(r.wrong, rTotal)}%</span></div>{/if}
                  {#if r.blank > 0}<div class="seg blank" style="flex: {r.blank}"><span class="seg-lbl">{pct(r.blank, rTotal)}%</span></div>{/if}
                </div>
              {/if}
              <div class="di-stats">
                <span class="di-s correct">D: {r.correct}</span>
                <span class="di-s wrong">Y: {r.wrong}</span>
                <span class="di-s blank">B: {r.blank}</span>
                <span class="di-s net">Net: {r.netScore}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .cal-view { display: flex; flex-direction: column; gap: 16px; }

  .mode-bar {
    display: flex;
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-full);
    padding: 4px;
    box-shadow: var(--shadow-glass);
  }
  .mode-btn {
    flex: 1;
    padding: 10px 8px;
    border-radius: var(--radius-full);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-secondary);
    transition: all 0.2s;
  }
  .mode-btn:hover { color: var(--text-primary); }
  .mode-btn.active {
    background: var(--color-primary);
    color: white;
    box-shadow: var(--shadow-glow-primary);
  }

  .period-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
  .nav-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    transition: all 0.15s;
  }
  .nav-arrow:hover:not(:disabled) { color: var(--color-primary); background: var(--color-primary-bg); }
  .nav-arrow:disabled { opacity: 0.25; cursor: not-allowed; }
  .period-label { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); min-width: 180px; text-align: center; }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  @media (min-width: 640px) { .stats-row { grid-template-columns: repeat(6, 1fr); } }

  .stat-box {
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-md);
    padding: 12px 8px;
    text-align: center;
    box-shadow: var(--shadow-glass);
  }
  .stat-box[data-color='correct'] { border-top: 2px solid var(--color-correct); }
  .stat-box[data-color='wrong'] { border-top: 2px solid var(--color-wrong); }
  .stat-box[data-color='blank'] { border-top: 2px solid var(--color-blank); }
  .stat-box.net { border-top: 2px solid var(--color-primary); }
  .stat-box.streak { border-top: 2px solid #f59e0b; }

  .sn { display: block; font-size: 1.3rem; font-weight: 800; color: var(--text-primary); }
  .stat-box[data-color='correct'] .sn { color: var(--color-correct); }
  .stat-box[data-color='wrong'] .sn { color: var(--color-wrong); }
  .stat-box[data-color='blank'] .sn { color: var(--color-blank); }
  .stat-box.net .sn { color: var(--color-primary); }
  .stat-box.streak .sn { color: #f59e0b; }

  .sl {
    display: block;
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }

  .glass-card {
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-glass);
    padding: 20px;
    overflow: hidden;
  }

  /* Yearly month grid */
  .year-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  @media (min-width: 480px) { .year-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 768px) { .year-grid { grid-template-columns: repeat(4, 1fr); } }

  .ym-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-glass);
    background: var(--bg-glass-subtle);
    transition: all 0.2s;
    text-align: left;
  }
  .ym-card:hover { background: var(--color-primary-bg); border-color: var(--color-primary); transform: translateY(-2px); }
  .ym-card.empty { opacity: 0.5; }
  .ym-card.empty:hover { opacity: 0.8; }

  .ym-header { display: flex; justify-content: space-between; align-items: center; }
  .ym-name { font-size: 0.9rem; font-weight: 800; color: var(--text-primary); }
  .ym-badge { font-size: 0.6rem; font-weight: 700; color: var(--color-primary); background: var(--color-primary-bg); padding: 2px 7px; border-radius: var(--radius-full); }

  .ym-stats { display: flex; gap: 6px; flex-wrap: wrap; }
  .ym-s { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); }
  .ym-s.correct { color: var(--color-correct); }
  .ym-s.wrong { color: var(--color-wrong); }
  .ym-s.blank { color: var(--color-blank); }

  .ym-footer { display: flex; justify-content: space-between; align-items: center; }
  .ym-net { font-size: 0.78rem; font-weight: 800; color: var(--color-primary); }
  .ym-days { font-size: 0.68rem; font-weight: 600; color: var(--text-tertiary); }

  .ym-empty-txt { font-size: 0.78rem; color: var(--text-tertiary); padding: 8px 0; }

  /* Monthly view - enriched day cards */
  .month-view { display: flex; flex-direction: column; gap: 4px; }
  .mv-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
  .mv-day-name { font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; padding: 6px 0; }
  .mv-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .mv-cell {
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    gap: 3px;
    border: 1px solid var(--border-glass);
    transition: all 0.15s;
    padding: 5px;
    min-height: 44px;
    text-align: left;
    background: var(--bg-glass-subtle);
  }
  .mv-cell:hover { border-color: var(--color-primary); background: var(--color-primary-bg); transform: translateY(-1px); }
  .mv-cell.out { opacity: 0.3; background: transparent; border-color: transparent; }
  .mv-cell.out:hover { opacity: 0.5; }
  .mv-cell.today { border-color: var(--color-primary); box-shadow: 0 0 8px var(--color-primary-glow); }
  .mv-top { display: flex; justify-content: space-between; align-items: center; }
  .mv-num { font-size: 0.72rem; font-weight: 700; color: var(--text-primary); }
  .mv-badge {
    font-size: 0.5rem; font-weight: 700;
    color: var(--color-primary); background: var(--color-primary-bg);
    min-width: 16px; height: 16px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .mv-stats { display: flex; gap: 3px; flex-wrap: wrap; }
  .mv-total { font-size: 0.6rem; font-weight: 800; color: var(--text-primary); }
  .mv-s { font-size: 0.55rem; font-weight: 700; }
  .mv-s.correct { color: var(--color-correct); }
  .mv-s.wrong { color: var(--color-wrong); }
  .mv-s.blank { color: var(--color-blank); }
  .mv-net { font-size: 0.62rem; font-weight: 800; color: var(--color-primary); }

  @media (max-width: 479px) {
    .mv-stats { display: none; }
    .mv-net { display: none; }
  }
  @media (min-width: 480px) {
    .mv-cell { padding: 6px; gap: 4px; min-height: 70px; }
  }
  @media (min-width: 768px) {
    .mv-cell { padding: 8px; gap: 5px; min-height: 90px; }
    .mv-num { font-size: 0.8rem; }
    .mv-total { font-size: 0.65rem; }
    .mv-s { font-size: 0.6rem; }
    .mv-net { font-size: 0.68rem; }
  }

  /* Unified segment bar */
  .seg-bar {
    display: flex; gap: 4px; height: 26px;
  }
  .seg-bar .seg {
    height: 100%; border-radius: 6px; min-width: 38px;
    transition: flex 0.5s ease;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .seg-bar .seg.correct { background: var(--bar-correct); border: 2px solid var(--bar-correct-border); }
  .seg-bar .seg.wrong { background: var(--bar-wrong); border: 2px solid var(--bar-wrong-border); }
  .seg-bar .seg.blank { background: var(--bar-blank); border: 2px solid var(--bar-blank-border); }
  .seg-bar .seg-lbl {
    font-size: 0.62rem; font-weight: 800; color: var(--text-secondary);
    white-space: nowrap; letter-spacing: 0.01em;
  }

  .seg-bar.sm { height: 22px; gap: 3px; }
  .seg-bar.sm .seg { border-width: 1.5px; border-radius: 5px; min-width: 32px; }
  .seg-bar.sm .seg-lbl { font-size: 0.58rem; }

  .seg-bar.xs { height: 6px; gap: 2px; }
  .seg-bar.xs .seg { border-width: 1px; border-radius: 3px; min-width: 0; }
  .seg-bar.xs .seg-lbl { display: none; }
  @media (min-width: 480px) {
    .seg-bar.xs { height: 14px; }
    .seg-bar.xs .seg { border-radius: 4px; }
  }
  @media (min-width: 768px) {
    .seg-bar.xs { height: 20px; gap: 3px; }
    .seg-bar.xs .seg { border-width: 1.5px; border-radius: 5px; min-width: 24px; }
    .seg-bar.xs .seg-lbl { display: inline; font-size: 0.52rem; }
  }

  /* Weekly chart */
  .week-chart { display: flex; flex-direction: column; gap: 12px; }
  .wc-row { display: flex; align-items: center; gap: 10px; }
  .wc-label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); width: 60px; flex-shrink: 0; }
  .wc-bar-outer {
    flex: 1; height: 24px;
  }
  .wc-bar-inner {
    height: 100%; transition: width 0.5s ease; min-width: 0;
  }
  .wc-val { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); width: 36px; text-align: right; }
  .wc-go {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    color: var(--text-tertiary);
    transition: all 0.15s;
  }
  .wc-go:hover { color: var(--color-primary); background: var(--color-primary-bg); }

  /* Daily */
  .daily-empty { text-align: center; padding: 40px 16px; color: var(--text-tertiary); font-size: 0.9rem; }
  .daily-list { display: flex; flex-direction: column; gap: 10px; }
  .daily-item {
    padding: 14px 18px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-glass);
    background: var(--bg-glass-subtle);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .di-top { display: flex; justify-content: space-between; align-items: center; }
  .di-name { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); }
  .di-subj { font-size: 0.8rem; color: var(--text-tertiary); font-weight: 600; }
  .di-stats { display: flex; gap: 12px; flex-wrap: wrap; }
  .di-s { font-size: 0.82rem; font-weight: 700; }
  .di-s.correct { color: var(--color-correct); }
  .di-s.wrong { color: var(--color-wrong); }
  .di-s.blank { color: var(--color-blank); }
  .di-s.net { color: var(--color-primary); }
</style>
