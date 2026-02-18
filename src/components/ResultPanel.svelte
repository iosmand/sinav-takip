<script lang="ts">
  import type { ExamResult } from '../lib/types';
  import { SUBJECTS } from '../lib/defaults';
  import { updateResult, getConfigs, calculateNet } from '../lib/store';

  interface Props {
    result: ExamResult | null;
    onUpdated: () => void;
  }

  let { result, onUpdated }: Props = $props();

  let editing = $state(false);
  let eCorrect = $state(0);
  let eWrong = $state(0);
  let eBlank = $state(0);
  let eName = $state('');
  let eSubject = $state('');

  function startEdit() {
    if (!result) return;
    eCorrect = result.correct;
    eWrong = result.wrong;
    eBlank = result.blank;
    eName = result.examName;
    eSubject = result.subject;
    editing = true;
  }

  function cancelEdit() {
    editing = false;
  }

  function saveEdit() {
    if (!result) return;
    const configs = getConfigs();
    const cfg = configs.find((c) => c.id === result.configId) ?? configs[0];
    const net = cfg ? calculateNet(cfg, eCorrect, eWrong, eBlank) : 0;
    updateResult(result.id, {
      correct: eCorrect,
      wrong: eWrong,
      blank: eBlank,
      examName: eName,
      subject: eSubject,
      netScore: net,
    });
    editing = false;
    onUpdated();
  }

  let total = $derived(result ? result.correct + result.wrong + result.blank : 0);

  function pct(v: number): number {
    if (total === 0) return 0;
    return Math.round((v / total) * 1000) / 10;
  }

  function fmtDate(d: string): string {
    return new Date(d).toLocaleString('tr-TR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
</script>

<div class="panel glass-card">
  {#if result}
    {#if editing}
      <!-- Edit Mode -->
      <div class="edit-form">
        <div class="ef-title">Düzenle</div>
        <div class="ef-row">
          <div class="ef-group">
            <label class="ef-label" for="e-name">Sınav Adı</label>
            <input id="e-name" class="ef-input" type="text" bind:value={eName} />
          </div>
          <div class="ef-group">
            <label class="ef-label" for="e-subj">Ders</label>
            <select id="e-subj" class="ef-input ef-select" bind:value={eSubject}>
              {#each SUBJECTS as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        <div class="ef-row three">
          <div class="ef-group">
            <label class="ef-label" for="e-c">Doğru</label>
            <input id="e-c" class="ef-input" type="number" min="0" bind:value={eCorrect} />
          </div>
          <div class="ef-group">
            <label class="ef-label" for="e-w">Yanlış</label>
            <input id="e-w" class="ef-input" type="number" min="0" bind:value={eWrong} />
          </div>
          <div class="ef-group">
            <label class="ef-label" for="e-b">Boş</label>
            <input id="e-b" class="ef-input" type="number" min="0" bind:value={eBlank} />
          </div>
        </div>
        <div class="ef-actions">
          <button class="ef-btn primary" onclick={saveEdit}>Kaydet</button>
          <button class="ef-btn ghost" onclick={cancelEdit}>İptal</button>
        </div>
      </div>
    {:else}
      <!-- View Mode -->
      <div class="panel-header">
        <div class="ph-left">
          <div class="ph-name">{result.examName || result.configName}</div>
          <div class="ph-meta">
            <span class="ph-subj">{result.subject}</span>
            <span class="ph-sep">·</span>
            <span class="ph-cfg">{result.configName}</span>
            <span class="ph-sep">·</span>
            <span class="ph-date">{fmtDate(result.date)}</span>
          </div>
        </div>
        <button class="edit-btn" onclick={startEdit} aria-label="Düzenle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      <!-- Big net + total -->
      <div class="big-stats">
        <div class="big-stat net-stat">
          <span class="big-num">{result.netScore}</span>
          <span class="big-lbl">Net Puan</span>
        </div>
        <div class="big-stat total-stat">
          <span class="big-num">{total}</span>
          <span class="big-lbl">Toplam Soru</span>
        </div>
      </div>

      <!-- Stacked bar -->
      <div class="bar-section">
        <div class="stacked-bar">
          {#if pct(result.correct) > 0}
            <div class="seg correct" style="width: {pct(result.correct)}%">
              <span class="seg-lbl">{pct(result.correct)}%</span>
            </div>
          {/if}
          {#if pct(result.wrong) > 0}
            <div class="seg wrong" style="width: {pct(result.wrong)}%">
              <span class="seg-lbl">{pct(result.wrong)}%</span>
            </div>
          {/if}
          {#if pct(result.blank) > 0}
            <div class="seg blank" style="width: {pct(result.blank)}%">
              <span class="seg-lbl">{pct(result.blank)}%</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- D / Y / B detail chips -->
      <div class="detail-row">
        <div class="detail-chip" data-color="correct">
          <div class="dc-top">
            <span class="dc-dot" data-color="correct"></span>
            <span class="dc-label">Doğru</span>
          </div>
          <span class="dc-num">{result.correct}</span>
          <span class="dc-pct">{pct(result.correct)}%</span>
        </div>
        <div class="detail-chip" data-color="wrong">
          <div class="dc-top">
            <span class="dc-dot" data-color="wrong"></span>
            <span class="dc-label">Yanlış</span>
          </div>
          <span class="dc-num">{result.wrong}</span>
          <span class="dc-pct">{pct(result.wrong)}%</span>
        </div>
        <div class="detail-chip" data-color="blank">
          <div class="dc-top">
            <span class="dc-dot" data-color="blank"></span>
            <span class="dc-label">Boş</span>
          </div>
          <span class="dc-num">{result.blank}</span>
          <span class="dc-pct">{pct(result.blank)}%</span>
        </div>
      </div>
    {/if}
  {:else}
    <div class="empty-panel">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span class="empty-txt">Bir kayıt seçin veya yeni değerlendirme yapın</span>
    </div>
  {/if}
</div>

<style>
  .glass-card {
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-glass);
  }

  .panel { padding: 24px; }

  /* Header */
  .panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .ph-name { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
  .ph-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 4px; font-size: 0.78rem; color: var(--text-tertiary); }
  .ph-subj { color: var(--text-secondary); font-weight: 600; }
  .ph-sep { opacity: 0.4; }

  .edit-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: var(--radius-sm);
    color: var(--text-tertiary); transition: all 0.15s; flex-shrink: 0;
  }
  .edit-btn:hover { color: var(--color-primary); background: var(--color-primary-bg); }

  /* Big stats */
  .big-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .big-stat {
    text-align: center; padding: 16px 12px;
    border-radius: var(--radius-md);
    background: var(--bg-glass-subtle);
    border: 1px solid var(--border-glass);
  }
  .big-num { display: block; font-size: 2rem; font-weight: 800; line-height: 1.1; }
  .net-stat .big-num { color: var(--color-primary); text-shadow: 0 0 14px var(--color-primary-glow); }
  .total-stat .big-num { color: var(--text-primary); }
  .big-lbl {
    display: block; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-tertiary); margin-top: 4px;
  }

  /* Stacked bar */
  .bar-section { margin-bottom: 18px; }
  .stacked-bar {
    display: flex; gap: 5px; height: 30px;
  }
  .seg {
    height: 100%; border-radius: 8px;
    transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
    min-width: 42px; position: relative;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .seg.correct { background: var(--bar-correct); border: 2px solid var(--bar-correct-border); }
  .seg.wrong { background: var(--bar-wrong); border: 2px solid var(--bar-wrong-border); }
  .seg.blank { background: var(--bar-blank); border: 2px solid var(--bar-blank-border); }
  .seg-lbl {
    font-size: 0.64rem; font-weight: 800; color: var(--text-secondary);
    white-space: nowrap; letter-spacing: 0.02em;
  }

  /* Detail chips */
  .detail-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .detail-chip {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 14px 8px; border-radius: var(--radius-md);
    background: var(--bg-glass-subtle); border: 1px solid var(--border-glass);
    transition: transform 0.15s;
  }
  .detail-chip:hover { transform: translateY(-2px); }

  .dc-top { display: flex; align-items: center; gap: 5px; }
  .dc-dot { width: 8px; height: 8px; border-radius: 2px; }
  .dc-dot[data-color='correct'] { background: var(--color-correct); }
  .dc-dot[data-color='wrong'] { background: var(--color-wrong); }
  .dc-dot[data-color='blank'] { background: var(--color-blank); }
  .dc-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); }

  .dc-num { font-size: 1.5rem; font-weight: 800; }
  .detail-chip[data-color='correct'] .dc-num { color: var(--color-correct); }
  .detail-chip[data-color='wrong'] .dc-num { color: var(--color-wrong); }
  .detail-chip[data-color='blank'] .dc-num { color: var(--color-blank); }

  .dc-pct { font-size: 0.78rem; font-weight: 700; color: var(--text-tertiary); }

  /* Empty */
  .empty-panel {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    padding: 40px 16px; text-align: center;
  }
  .empty-txt { font-size: 0.88rem; color: var(--text-tertiary); }

  /* Edit form */
  .edit-form { display: flex; flex-direction: column; gap: 14px; }
  .ef-title { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
  .ef-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ef-row.three { grid-template-columns: repeat(3, 1fr); }
  .ef-group { display: flex; flex-direction: column; gap: 4px; }
  .ef-label { font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
  .ef-input {
    padding: 10px 14px; border-radius: var(--radius-sm);
    border: 1px solid var(--border-glass); background: var(--bg-input);
    color: var(--text-primary); font-weight: 600; font-size: 0.88rem;
    transition: border-color 0.2s;
  }
  .ef-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-bg); }
  .ef-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px;
  }
  .ef-actions { display: flex; gap: 10px; }
  .ef-btn {
    flex: 1; padding: 12px 16px; border-radius: var(--radius-md);
    font-weight: 700; font-size: 0.88rem; transition: all 0.15s;
  }
  .ef-btn.primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white; box-shadow: var(--shadow-glow-primary);
  }
  .ef-btn.primary:hover { transform: translateY(-1px); }
  .ef-btn.ghost {
    background: var(--bg-glass-subtle); color: var(--text-secondary); border: 1px solid var(--border-glass);
  }
  .ef-btn.ghost:hover { background: var(--bg-hover); }
</style>
