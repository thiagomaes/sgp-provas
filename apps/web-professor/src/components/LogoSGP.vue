<script setup lang="ts">
/**
 * Marca do SGP: quadrado arredondado em --accent, opcionalmente seguido
 * do texto "SGP" (como na sidebar). No login o quadrado aparece sozinho.
 */
withDefaults(
  defineProps<{
    /** Lado do quadrado, em px. */
    tamanho?: number
    /** Exibe o texto "SGP" ao lado do quadrado. */
    comTexto?: boolean
  }>(),
  { tamanho: 22, comTexto: false },
)
</script>

<template>
  <span class="logo">
    <span
      class="marca"
      :style="{ width: `${tamanho}px`, height: `${tamanho}px` }"
      aria-hidden="true"
    />
    <span v-if="comTexto" class="texto">SGP</span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.marca {
  display: block;
  flex: none;
  background: var(--accent);
  border-radius: var(--radius-sm);
}

.texto {
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--accent-dark);
}
</style>
