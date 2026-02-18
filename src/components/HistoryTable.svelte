<script lang="ts">
  import type { ExamResult } from '../lib/types';

  type DateFilter = 'day' | 'week' | 'month' | 'year';

  interface Props {
    results: ExamResult[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
    onExport: () => void;
    onImport: () => void;
  }

  let { results, selectedId, onSelect, onDelete, onClearAll, onExport, onImport }: Props = $props();
  let showConfirm = $state(false);
  let filter: DateFilter = $state('day');
  let anchor = $state(new Date());

  function sod(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function getRange(f: DateFilter, ref: Date): { start: Date; end: Date } {
    const d = sod(ref);
    if (f === 'day') {
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      return { start: d, end };
    }
    if (f === 'week') {
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(d);
      start.setDate(start.getDate() - diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    if (f === 'month') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return { start, end };
    }
    const start = new Date(d.getFullYear(), 0, 1);
    const end = new Date(d.getFullYear() + 1, 0, 1);
    return { start, end };
  }

  let canGoForward = $derived(() => {
    const now = new Date();
    const d = new Date(anchor);
    if (filter === 'day') return sod(d) < sod(now);
    if (filter === 'week') {
      const cur = getRange('week', d);
      const todayRange = getRange('week', now);
      return cur.start < todayRange.start;
    }
    if (filter === 'month') {
      return d.getFullYear() < now.getFullYear() || (d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth());
    }
    return d.getFullYear() < now.getFullYear();
  });

  function navigate(dir: -1 | 1) {
    if (dir === 1 && !canGoForward()) return;
    const d = new Date(anchor);
    if (filter === 'day') d.setDate(d.getDate() + dir);
    else if (filter === 'week') d.setDate(d.getDate() + dir * 7);
    else if (filter === 'month') d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    anchor = d;
  }

  function goToday() {
    anchor = new Date();
  }

  function setFilter(f: DateFilter) {
    filter = f;
    anchor = new Date();
  }

  let range = $derived(getRange(filter, anchor));

  let filteredResults = $derived(
    results.filter((r) => {
      const d = new Date(r.date);
      return d >= range.start && d < range.end;
    })
  );

  let isToday = $derived(isSameDay(anchor, new Date()));

  let filterLabel = $derived(() => {
    const ref = anchor;
    if (filter === 'day') {
      return ref.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (filter === 'week') {
      const { start, end } = range;
      const endDay = new Date(end);
      endDay.setDate(endDay.getDate() - 1);
      return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${endDay.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (filter === 'month') {
      return ref.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    }
    return ref.getFullYear().toString();
  });

  function fmtDate(d: string): string {
    return new Date(d).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const filters: { key: DateFilter; label: string }[] = [
    { key: 'day', label: 'Gün' },
    { key: 'week', label: 'Hafta' },
    { key: 'month', label: 'Ay' },
    { key: 'year', label: 'Yıl' },
  ];
</script>

<div class="ht-section">
  <div class="ht-header">
    <h3 class="ht-title">Geçmiş</h3>
    <div class="ht-actions">
      <button class="icon-btn" onclick={onExport} aria-label="Dışa aktar" title="JSON Dışa Aktar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      <button class="icon-btn" onclick={onImport} aria-label="İçe aktar" title="JSON İçe Aktar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </button>
      {#if results.length > 0}
        {#if showConfirm}
          <div class="confirm-inline">
            <span class="confirm-txt">Emin?</span>
            <button class="chip danger" onclick={() => { onClearAll(); showConfirm = false; }}>Sil</button>
            <button class="chip ghost" onclick={() => (showConfirm = false)}>İptal</button>
          </div>
        {:else}
          <button class="chip outline-danger" onclick={() => (showConfirm = true)}>Temizle</button>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Filter tabs + nav -->
  <div class="filter-bar">
    <div class="filter-tabs">
      {#each filters as f}
        <button
          class="filter-tab"
          class:active={filter === f.key}
          onclick={() => setFilter(f.key)}
        >{f.label}</button>
      {/each}
    </div>
    <div class="nav-row">
      <button class="nav-btn" onclick={() => navigate(-1)} aria-label="Önceki">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="nav-label">{filterLabel()}</span>
      <button class="nav-btn" class:disabled={!canGoForward()} onclick={() => navigate(1)} aria-label="Sonraki" disabled={!canGoForward()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      {#if !isToday}
        <button class="today-btn" onclick={goToday}>Bugün</button>
      {/if}
    </div>
  </div>

  {#if filteredResults.length === 0}
    <div class="empty">Bu dönemde kayıt yok</div>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Sınav</th>
            <th>Ders</th>
            <th class="num">D</th>
            <th class="num">Y</th>
            <th class="num">B</th>
            <th class="num">Net</th>
            <th class="act"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredResults as r (r.id)}
            <tr
              class:selected={selectedId === r.id}
              onclick={() => onSelect(r.id)}
            >
              <td class="date-cell">{fmtDate(r.date)}</td>
              <td class="name-cell">{r.examName || r.configName}</td>
              <td class="subj-cell">{r.subject || '-'}</td>
              <td class="num correct">{r.correct}</td>
              <td class="num wrong">{r.wrong}</td>
              <td class="num blank">{r.blank}</td>
              <td class="num net">{r.netScore}</td>
              <td class="act">
                <button class="del-btn" onclick={(e) => { e.stopPropagation(); onDelete(r.id); }} aria-label="Sil">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .ht-section {
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-glass);
    overflow: hidden;
  }

  .ht-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 18px 22px 10px; flex-wrap: wrap; gap: 10px;
  }
  .ht-title { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
  .ht-actions { display: flex; align-items: center; gap: 8px; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: var(--radius-sm);
    color: var(--text-tertiary); transition: all 0.15s;
  }
  .icon-btn:hover { color: var(--color-primary); background: var(--color-primary-bg); }

  .confirm-inline { display: flex; align-items: center; gap: 6px; }
  .confirm-txt { font-size: 0.78rem; font-weight: 700; color: var(--color-danger); }

  .chip {
    padding: 5px 12px; border-radius: var(--radius-full);
    font-size: 0.75rem; font-weight: 700; transition: all 0.15s;
  }
  .chip.outline-danger { color: var(--color-danger); border: 1.5px solid var(--color-danger); background: transparent; }
  .chip.outline-danger:hover { background: var(--color-wrong-bg); }
  .chip.danger { background: var(--color-danger); color: white; }
  .chip.danger:hover { background: var(--color-danger-hover); }
  .chip.ghost { background: var(--bg-glass-subtle); color: var(--text-secondary); border: 1px solid var(--border-glass); }
  .chip.ghost:hover { background: var(--bg-hover); }

  /* Filter bar */
  .filter-bar {
    display: flex; flex-direction: column; gap: 10px;
    padding: 0 22px 14px;
    border-bottom: 1px solid var(--border-glass);
  }
  @media (min-width: 640px) {
    .filter-bar {
      flex-direction: row; align-items: center; justify-content: space-between; gap: 12px;
    }
  }
  .filter-tabs { display: flex; gap: 4px; flex-shrink: 0; }
  .filter-tab {
    padding: 7px 16px; border-radius: var(--radius-full);
    font-size: 0.78rem; font-weight: 700; color: var(--text-tertiary);
    transition: all 0.15s; border: 1px solid transparent;
  }
  .filter-tab:hover { color: var(--text-primary); background: var(--bg-hover); }
  .filter-tab.active {
    color: var(--color-primary); background: var(--color-primary-bg);
    border-color: rgba(59, 130, 246, 0.2);
  }

  /* Nav row */
  .nav-row { display: flex; align-items: center; gap: 6px; }
  .nav-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: var(--radius-sm);
    color: var(--text-tertiary); transition: all 0.15s;
  }
  .nav-btn:hover:not(:disabled) { color: var(--color-primary); background: var(--color-primary-bg); }
  .nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .nav-label {
    font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);
    min-width: 140px; text-align: center; white-space: nowrap;
  }
  .today-btn {
    padding: 4px 12px; border-radius: var(--radius-full);
    font-size: 0.72rem; font-weight: 700;
    color: var(--color-primary); border: 1px solid rgba(59, 130, 246, 0.25);
    background: var(--color-primary-bg); transition: all 0.15s; white-space: nowrap;
  }
  .today-btn:hover { background: rgba(59, 130, 246, 0.2); }

  .empty { padding: 40px 20px; text-align: center; color: var(--text-tertiary); font-size: 0.9rem; }

  .table-wrap { overflow-x: auto; }

  .table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }

  .table th {
    padding: 10px 14px; text-align: left;
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--text-tertiary);
    border-bottom: 1px solid var(--border-glass); white-space: nowrap;
  }
  .table th.num, .table td.num { text-align: center; }
  .table th.act, .table td.act { text-align: center; width: 40px; }

  .table td {
    padding: 12px 14px; border-bottom: 1px solid var(--border-glass);
    vertical-align: middle; color: var(--text-primary);
  }

  .table tbody tr {
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
  }
  .table tbody tr:hover { background: var(--color-primary-bg); }
  .table tbody tr.selected {
    background: var(--color-primary-bg);
    box-shadow: inset 3px 0 0 var(--color-primary);
  }
  .table tbody tr:last-child td { border-bottom: none; }

  .date-cell { font-size: 0.78rem; color: var(--text-tertiary); white-space: nowrap; }
  .name-cell { font-weight: 600; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .subj-cell { color: var(--text-secondary); white-space: nowrap; }

  td.correct { color: var(--color-correct); font-weight: 700; }
  td.wrong { color: var(--color-wrong); font-weight: 700; }
  td.blank { color: var(--color-blank); font-weight: 700; }
  td.net { color: var(--color-primary); font-weight: 800; }

  .del-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: var(--radius-sm);
    color: var(--text-tertiary); transition: all 0.15s;
  }
  .del-btn:hover { color: var(--color-danger); background: var(--color-wrong-bg); }
</style>
