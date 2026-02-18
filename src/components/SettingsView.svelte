<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExamConfig, Theme } from '../lib/types';
  import { getConfigs, addConfig, deleteConfig, loadTheme, saveTheme } from '../lib/store';

  let configs: ExamConfig[] = $state([]);
  let theme: Theme = $state('light');
  let showAdd = $state(false);

  let newName = $state('');
  let newCorrect = $state(1);
  let newWrong = $state(-0.25);
  let newBlank = $state(0);
  let newTotal = $state('');

  onMount(() => {
    configs = getConfigs();
    theme = loadTheme();
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    saveTheme(theme);
  }

  function handleAdd() {
    if (!newName.trim()) return;
    addConfig({
      name: newName.trim(),
      correctMultiplier: newCorrect,
      wrongMultiplier: newWrong,
      blankMultiplier: newBlank,
      totalQuestions: newTotal ? parseInt(newTotal) : undefined,
    });
    configs = getConfigs();
    newName = '';
    newCorrect = 1;
    newWrong = -0.25;
    newBlank = 0;
    newTotal = '';
    showAdd = false;
  }

  function handleDeleteConfig(id: string) {
    deleteConfig(id);
    configs = getConfigs();
  }

  function fmtMul(v: number): string {
    return v > 0 ? `+${v}` : v === 0 ? '0' : v.toString();
  }
</script>

<div class="settings-view">
  <!-- Theme -->
  <section class="section">
    <h2 class="sec-title">Tema</h2>
    <div class="glass-card row-between">
      <div class="row-left">
        <span class="theme-icon">
          {#if theme === 'light'}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          {:else}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          {/if}
        </span>
        <span class="theme-lbl">{theme === 'light' ? 'Açık Tema' : 'Koyu Tema'}</span>
      </div>
      <button class="toggle" class:on={theme === 'dark'} onclick={toggleTheme} aria-label="Tema değiştir">
        <span class="toggle-knob"></span>
      </button>
    </div>
  </section>

  <!-- Configs -->
  <section class="section">
    <div class="sec-header">
      <h2 class="sec-title">Sınav Konfigürasyonları</h2>
      <button class="chip-btn primary" onclick={() => (showAdd = !showAdd)}>
        {showAdd ? 'İptal' : '+ Yeni'}
      </button>
    </div>

    {#if showAdd}
      <div class="glass-card form-card">
        <div class="fg">
          <label class="fl" for="cfg-name">Sınav Adı</label>
          <input id="cfg-name" class="fi" type="text" placeholder="Örn: YDS" bind:value={newName} />
        </div>
        <div class="form-grid">
          <div class="fg">
            <label class="fl" for="cfg-c">Doğru</label>
            <input id="cfg-c" class="fi" type="number" step="0.01" bind:value={newCorrect} />
          </div>
          <div class="fg">
            <label class="fl" for="cfg-w">Yanlış</label>
            <input id="cfg-w" class="fi" type="number" step="0.01" bind:value={newWrong} />
          </div>
          <div class="fg">
            <label class="fl" for="cfg-b">Boş</label>
            <input id="cfg-b" class="fi" type="number" step="0.01" bind:value={newBlank} />
          </div>
        </div>
        <div class="fg">
          <label class="fl" for="cfg-t">Toplam Soru (opsiyonel)</label>
          <input id="cfg-t" class="fi" type="number" placeholder="Boş bırakılabilir" bind:value={newTotal} />
        </div>
        <button class="action-btn primary" onclick={handleAdd} disabled={!newName.trim()}>Kaydet</button>
      </div>
    {/if}

    <div class="cfg-list">
      {#each configs as cfg (cfg.id)}
        <div class="glass-card cfg-item">
          <div class="cfg-info">
            <span class="cfg-name">
              {cfg.name}
              {#if cfg.isDefault}<span class="badge">Varsayılan</span>{/if}
            </span>
            <span class="cfg-detail">
              D: {fmtMul(cfg.correctMultiplier)} · Y: {fmtMul(cfg.wrongMultiplier)} · B: {fmtMul(cfg.blankMultiplier)}
              {#if cfg.totalQuestions} · {cfg.totalQuestions} soru{/if}
            </span>
          </div>
          {#if !cfg.isDefault}
            <button class="del-btn" onclick={() => handleDeleteConfig(cfg.id)} aria-label="Sil">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .settings-view { display: flex; flex-direction: column; gap: 28px; }

  .section { display: flex; flex-direction: column; gap: 12px; }
  .sec-header { display: flex; justify-content: space-between; align-items: center; }
  .sec-title { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }

  .glass-card {
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-glass);
    padding: 18px 22px;
  }

  .row-between { display: flex; justify-content: space-between; align-items: center; }
  .row-left { display: flex; align-items: center; gap: 12px; }

  .theme-icon { color: var(--text-secondary); display: flex; }
  .theme-lbl { font-weight: 700; color: var(--text-primary); }

  .toggle {
    width: 54px; height: 30px; border-radius: 15px;
    background: var(--bg-glass-subtle); border: 1.5px solid var(--border-glass-strong);
    position: relative; transition: all 0.3s; padding: 0;
  }
  .toggle.on { background: var(--color-primary); border-color: var(--color-primary); box-shadow: 0 0 14px var(--color-primary-glow); }
  .toggle-knob {
    position: absolute; top: 3px; left: 3px;
    width: 22px; height: 22px; border-radius: 50%;
    background: white; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }
  .toggle.on .toggle-knob { transform: translateX(24px); }

  .chip-btn {
    padding: 8px 18px; border-radius: var(--radius-full);
    font-size: 0.8rem; font-weight: 700; transition: all 0.2s;
  }
  .chip-btn.primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white; box-shadow: 0 2px 10px var(--color-primary-glow);
  }
  .chip-btn.primary:hover { box-shadow: 0 4px 16px var(--color-primary-glow); }

  .form-card { display: flex; flex-direction: column; gap: 14px; }
  .fg { display: flex; flex-direction: column; gap: 5px; }
  .fl { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }
  .fi {
    padding: 11px 16px; border-radius: var(--radius-sm);
    border: 1px solid var(--border-glass); background: var(--bg-input);
    color: var(--text-primary); transition: border-color 0.2s, box-shadow 0.2s;
    backdrop-filter: var(--blur-glass); -webkit-backdrop-filter: var(--blur-glass);
  }
  .fi:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-bg); }
  .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

  .cfg-list { display: flex; flex-direction: column; gap: 8px; }
  .cfg-item {
    display: flex; justify-content: space-between; align-items: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .cfg-item:hover { transform: translateY(-1px); box-shadow: var(--shadow-glass-hover); }
  .cfg-info { display: flex; flex-direction: column; gap: 3px; }
  .cfg-name { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
  .badge {
    font-size: 0.6rem; font-weight: 700; padding: 3px 10px;
    border-radius: var(--radius-full); background: var(--color-primary-bg);
    color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.06em;
  }
  .cfg-detail { font-size: 0.78rem; color: var(--text-tertiary); }
  .del-btn { padding: 8px; border-radius: var(--radius-sm); color: var(--text-tertiary); transition: all 0.15s; }
  .del-btn:hover { color: var(--color-danger); background: var(--color-wrong-bg); }

  .action-btn {
    padding: 14px 18px; border-radius: var(--radius-md);
    font-weight: 700; font-size: 0.88rem; min-height: 48px; transition: all 0.2s;
  }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn.primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white; box-shadow: var(--shadow-glow-primary);
  }
  .action-btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px var(--color-primary-glow); }
</style>
