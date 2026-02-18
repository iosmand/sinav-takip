<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExamConfig, ExamResult } from '../lib/types';
  import { SUBJECTS } from '../lib/defaults';
  import {
    getConfigs, calculateNet, addResult, getResults,
    deleteResult, clearResults, exportData, importData
  } from '../lib/store';
  import CounterCard from './CounterCard.svelte';
  import ResultPanel from './ResultPanel.svelte';
  import HistoryTable from './HistoryTable.svelte';

  let configs: ExamConfig[] = $state([]);
  let selectedConfigId = $state('');
  let examName = $state('');
  let selectedSubject = $state(SUBJECTS[0]);
  let correct = $state(0);
  let wrong = $state(0);
  let blank = $state(0);
  let results: ExamResult[] = $state([]);
  let selectedResultId: string | null = $state(null);
  let showForm = $state(false);

  onMount(() => {
    configs = getConfigs();
    if (configs.length > 0) selectedConfigId = configs[0].id;
    results = getResults();
  });

  let selectedConfig = $derived(
    configs.find((c) => c.id === selectedConfigId) ?? configs[0]
  );
  let total = $derived(correct + wrong + blank);
  let netScore = $derived(
    selectedConfig ? calculateNet(selectedConfig, correct, wrong, blank) : 0
  );
  let selectedResult = $derived(
    selectedResultId ? results.find((r) => r.id === selectedResultId) ?? null : null
  );

  function reset() {
    correct = 0;
    wrong = 0;
    blank = 0;
  }

  function evaluate() {
    if (!selectedConfig || total === 0) return;
    const result = addResult({
      configId: selectedConfig.id,
      configName: selectedConfig.name,
      examName: examName.trim() || `${selectedConfig.name} Deneme`,
      subject: selectedSubject,
      correct, wrong, blank, netScore,
    });
    results = getResults();
    selectedResultId = result.id;
    reset();
    showForm = false;
  }

  function handleSelectResult(id: string) {
    selectedResultId = selectedResultId === id ? null : id;
  }

  function handleDeleteResult(id: string) {
    if (selectedResultId === id) selectedResultId = null;
    deleteResult(id);
    results = getResults();
  }

  function handleClearAll() {
    selectedResultId = null;
    clearResults();
    results = [];
  }

  function handleResultUpdated() {
    results = getResults();
  }

  function handleExport() {
    const data = exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sinav-takip-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const ok = importData(reader.result as string);
        if (ok) {
          results = getResults();
          configs = getConfigs();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
</script>

<div class="counter-view">
  {#if showForm}
    <div class="form-card glass-card">
      <div class="form-header">
        <h3 class="form-title">Yeni Sınav Girişi</h3>
        <button class="close-btn" onclick={() => { showForm = false; reset(); }} aria-label="Kapat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="input-grid">
        <div class="fg">
          <label class="fl" for="config-select">Sınav Türü</label>
          <select id="config-select" class="fi select" bind:value={selectedConfigId}>
            {#each configs as config}
              <option value={config.id}>{config.name}</option>
            {/each}
          </select>
        </div>
        <div class="fg">
          <label class="fl" for="exam-name">Sınav Adı</label>
          <input id="exam-name" class="fi" type="text" placeholder="TYT Deneme 1" bind:value={examName} />
        </div>
        <div class="fg">
          <label class="fl" for="subject-select">Ders</label>
          <select id="subject-select" class="fi select" bind:value={selectedSubject}>
            {#each SUBJECTS as sub}
              <option value={sub}>{sub}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="counters">
        <CounterCard label="Doğru" color="correct" value={correct}
          onIncrement={() => correct++} onDecrement={() => { if (correct > 0) correct--; }} />
        <CounterCard label="Yanlış" color="wrong" value={wrong}
          onIncrement={() => wrong++} onDecrement={() => { if (wrong > 0) wrong--; }} />
        <CounterCard label="Boş" color="blank" value={blank}
          onIncrement={() => blank++} onDecrement={() => { if (blank > 0) blank--; }} />
      </div>

      <div class="summary-boxes">
        <div class="summary-box">
          <span class="summary-num">{total}</span>
          <span class="summary-lbl">Toplam Soru</span>
        </div>
        <div class="summary-box net">
          <span class="summary-num">{netScore}</span>
          <span class="summary-lbl">Net Puan</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" onclick={evaluate} disabled={total === 0}>
          Kaydet
        </button>
        <button class="btn btn-ghost" onclick={reset} disabled={total === 0}>
          Sıfırla
        </button>
      </div>
    </div>
  {:else}
    <button class="add-btn glass-card" onclick={() => (showForm = true)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>Yeni Sınav Ekle</span>
    </button>
  {/if}

  <!-- Result Panel -->
  <ResultPanel result={selectedResult} onUpdated={handleResultUpdated} />

  <!-- History Table -->
  <HistoryTable
    {results}
    selectedId={selectedResultId}
    onSelect={handleSelectResult}
    onDelete={handleDeleteResult}
    onClearAll={handleClearAll}
    onExport={handleExport}
    onImport={handleImport}
  />
</div>

<style>
  .counter-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 100%;
  }

  .glass-card {
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-glass);
  }

  /* Add button */
  .add-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 20px; width: 100%;
    font-size: 0.95rem; font-weight: 700; color: var(--color-primary);
    transition: all 0.2s ease; cursor: pointer;
  }
  .add-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glass-hover), 0 0 20px var(--color-primary-glow);
    border-color: rgba(59, 130, 246, 0.3);
  }
  .add-btn:active { transform: translateY(0); }

  /* Form card */
  .form-card { padding: 24px; display: flex; flex-direction: column; gap: 18px; }

  .form-header { display: flex; justify-content: space-between; align-items: center; }
  .form-title { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: var(--radius-sm);
    color: var(--text-tertiary); transition: all 0.15s;
  }
  .close-btn:hover { color: var(--color-danger); background: var(--color-wrong-bg); }

  .input-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 640px) { .input-grid { grid-template-columns: 1fr 1fr 1fr; } }

  .fg { display: flex; flex-direction: column; gap: 5px; }
  .fl {
    font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .fi {
    padding: 12px 16px; border-radius: var(--radius-md);
    border: 1px solid var(--border-glass);
    background: var(--bg-glass); backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    color: var(--text-primary); font-weight: 600;
    box-shadow: var(--shadow-glass);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fi:focus {
    outline: none; border-color: var(--color-primary);
    box-shadow: var(--shadow-glass), 0 0 0 3px var(--color-primary-bg);
  }
  .fi.select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 40px;
  }

  .counters { display: flex; flex-direction: column; gap: 16px; }
  @media (min-width: 640px) { .counters { flex-direction: row; } }

  .summary-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  .summary-box {
    background: var(--bg-glass-subtle);
    border: 1px solid var(--border-glass); border-radius: var(--radius-lg);
    padding: 18px 16px; text-align: center;
    display: flex; flex-direction: column; gap: 4px;
  }

  .summary-num { font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
  .summary-box.net .summary-num { color: var(--color-primary); text-shadow: 0 0 16px var(--color-primary-glow); }
  .summary-lbl {
    font-size: 0.78rem; font-weight: 600; color: var(--text-tertiary);
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .actions { display: flex; gap: 12px; }

  .btn {
    flex: 1; padding: 14px 20px; border-radius: var(--radius-md);
    font-weight: 700; font-size: 0.95rem; min-height: 48px;
    transition: all 0.2s ease;
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white; box-shadow: var(--shadow-glow-primary);
  }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 28px var(--color-primary-glow); }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }

  .btn-ghost {
    background: var(--bg-glass-subtle);
    color: var(--text-secondary); border: 1px solid var(--border-glass);
  }
  .btn-ghost:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-glass-strong); }
</style>
