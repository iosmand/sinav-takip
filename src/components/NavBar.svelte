<script lang="ts">
  import type { View } from '../lib/types';

  interface Props {
    currentView: View;
    onNavigate: (view: View) => void;
  }

  let { currentView, onNavigate }: Props = $props();

  const navItems: { view: View; label: string; iconPath: string }[] = [
    { view: 'counter', label: 'Sayaç', iconPath: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { view: 'calendar', label: 'Takvim', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { view: 'settings', label: 'Ayarlar', iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];
</script>

<nav class="navbar">
  <div class="nav-inner">
    <button class="brand" onclick={() => onNavigate('counter')}>
      <svg class="brand-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
      <span class="brand-text">Sınav Takip</span>
    </button>
    <div class="nav-links">
      {#each navItems as item}
        <button
          class="nav-btn"
          class:active={currentView === item.view}
          onclick={() => onNavigate(item.view)}
          aria-label={item.label}
        >
          <svg class="nav-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d={item.iconPath} />
          </svg>
          <span class="nav-label">{item.label}</span>
        </button>
      {/each}
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: fixed; top: 0; left: 0; right: 0;
    height: var(--nav-height);
    background: var(--bg-glass-strong);
    backdrop-filter: var(--blur-glass-strong);
    -webkit-backdrop-filter: var(--blur-glass-strong);
    border-bottom: 1px solid var(--border-glass);
    z-index: 100;
  }
  .nav-inner {
    max-width: 960px; margin: 0 auto; padding: 0 16px;
    height: 100%; display: flex; align-items: center; justify-content: space-between;
  }
  .brand {
    display: flex; align-items: center; gap: 10px;
    font-weight: 800; font-size: 1.1rem; color: var(--text-primary);
    padding: 6px 4px; border-radius: var(--radius-sm); transition: opacity 0.15s;
  }
  .brand:hover { opacity: 0.8; }
  .brand-icon { color: var(--color-primary); }
  .brand-text { display: none; }
  .nav-links { display: flex; gap: 4px; }
  .nav-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 14px; border-radius: var(--radius-md);
    color: var(--text-secondary); font-weight: 500; font-size: 0.85rem;
    transition: all 0.2s ease;
  }
  .nav-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .nav-btn.active {
    background: var(--color-primary-bg); color: var(--color-primary);
    box-shadow: 0 0 12px var(--color-primary-glow);
  }
  .nav-svg { flex-shrink: 0; }
  .nav-label { display: none; }
  @media (min-width: 480px) { .brand-text { display: inline; } }
  @media (min-width: 640px) { .nav-label { display: inline; } .nav-btn { padding: 10px 16px; } }
</style>
