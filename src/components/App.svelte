<script lang="ts">
  import { onMount } from 'svelte';
  import type { View } from '../lib/types';
  import { loadTheme, saveTheme } from '../lib/store';
  import NavBar from './NavBar.svelte';
  import CounterView from './CounterView.svelte';
  import CalendarView from './CalendarView.svelte';
  import SettingsView from './SettingsView.svelte';

  let currentView: View = $state('counter');

  onMount(() => {
    const theme = loadTheme();
    saveTheme(theme);
  });

  function handleNavigate(view: View) {
    currentView = view;
  }
</script>

<NavBar {currentView} onNavigate={handleNavigate} />

<main class="main-content">
  <div class="view-wrapper">
    {#if currentView === 'counter'}
      <CounterView />
    {:else if currentView === 'calendar'}
      <CalendarView />
    {:else if currentView === 'settings'}
      <SettingsView />
    {/if}
  </div>
</main>

<style>
  .main-content {
    padding-top: calc(var(--nav-height) + 20px);
    padding-bottom: 40px;
    min-height: 100dvh;
  }

  .view-wrapper {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 16px;
    overflow: hidden;
  }

  @media (min-width: 768px) {
    .view-wrapper { padding: 0 24px; }
  }
</style>
