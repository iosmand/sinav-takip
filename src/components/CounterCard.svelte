<script lang="ts">
  interface Props {
    label: string;
    color: 'correct' | 'wrong' | 'blank';
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
  }

  let { label, color, value, onIncrement, onDecrement }: Props = $props();
</script>

<div class="card" data-color={color}>
  <div class="card-label">{label}</div>
  <div class="card-controls">
    <button
      class="ctrl-btn"
      data-color={color}
      onclick={onDecrement}
      disabled={value === 0}
      aria-label="{label} azalt"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="6" y1="12" x2="18" y2="12" />
      </svg>
    </button>

    <span class="card-value" data-color={color}>{value}</span>

    <button
      class="ctrl-btn"
      data-color={color}
      onclick={onIncrement}
      aria-label="{label} artır"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="6" x2="12" y2="18" />
        <line x1="6" y1="12" x2="18" y2="12" />
      </svg>
    </button>
  </div>
</div>

<style>
  .card {
    background: var(--bg-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-xl);
    padding: 24px 20px;
    flex: 1;
    min-width: 0;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    box-shadow: var(--shadow-glass);
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-glass-hover);
  }

  .card[data-color='correct'] { border-top: 3px solid var(--color-correct); }
  .card[data-color='wrong'] { border-top: 3px solid var(--color-wrong); }
  .card[data-color='blank'] { border-top: 3px solid var(--color-blank); }

  .card-label {
    text-align: center;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .card-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ctrl-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    min-width: 48px;
    min-height: 48px;
    border-radius: var(--radius-full);
    transition: all 0.2s ease;
    flex-shrink: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .ctrl-btn[data-color='correct'] {
    background: var(--color-correct-bg);
    color: var(--color-correct);
    box-shadow: 0 2px 10px var(--color-correct-glow);
  }
  .ctrl-btn[data-color='correct']:hover:not(:disabled) {
    background: var(--color-correct);
    color: white;
    box-shadow: 0 4px 20px var(--color-correct-glow);
    transform: scale(1.08);
  }

  .ctrl-btn[data-color='wrong'] {
    background: var(--color-wrong-bg);
    color: var(--color-wrong);
    box-shadow: 0 2px 10px var(--color-wrong-glow);
  }
  .ctrl-btn[data-color='wrong']:hover:not(:disabled) {
    background: var(--color-wrong);
    color: white;
    box-shadow: 0 4px 20px var(--color-wrong-glow);
    transform: scale(1.08);
  }

  .ctrl-btn[data-color='blank'] {
    background: var(--color-blank-bg);
    color: var(--color-blank);
    box-shadow: 0 2px 10px var(--color-blank-glow);
  }
  .ctrl-btn[data-color='blank']:hover:not(:disabled) {
    background: var(--color-blank);
    color: white;
    box-shadow: 0 4px 20px var(--color-blank-glow);
    transform: scale(1.08);
  }

  .ctrl-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    box-shadow: none;
  }

  .ctrl-btn:active:not(:disabled) {
    transform: scale(0.93);
  }

  .card-value {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1;
    min-width: 64px;
    text-align: center;
    flex: 1;
  }

  .card-value[data-color='correct'] { color: var(--color-correct); }
  .card-value[data-color='wrong'] { color: var(--color-wrong); }
  .card-value[data-color='blank'] { color: var(--color-blank); }
</style>
