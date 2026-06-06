<template>
  <button
    class="app-button"
    :class="[`app-button-${variant}`, `app-button-${size}`, { 'is-block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  block?: boolean;
}>(), {
  variant: "default",
  size: "md",
  type: "button",
  disabled: false,
  block: false,
});
</script>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--divider-color);
  border-radius: var(--control-radius);
  color: var(--text-secondary-color);
  background: var(--background-color-2);
  cursor: pointer;
  font-family: inherit;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.app-button-sm {
  min-height: 30px;
  padding: 4px 12px;
  font-size: var(--text-sm);
}

.app-button-md {
  min-height: 36px;
  padding: 6px 16px;
  font-size: var(--text-base);
}

.app-button-primary,
.app-button:hover:not(:disabled) {
  border-color: var(--neon-cyan);
  color: #fff;
  background: var(--neon-cyan);
}

.app-button-danger:hover:not(:disabled) {
  border-color: #ff6b6b;
  color: #fff;
  background: #ff6b6b;
}

.app-button-ghost {
  background: transparent;
}

.app-button.is-block {
  width: 100%;
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
