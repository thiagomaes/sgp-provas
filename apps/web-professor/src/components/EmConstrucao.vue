<script setup lang="ts">
/**
 * Placeholder das telas ainda não implementadas.
 * Ao implementar sua tela, apague o <EmConstrucao /> da sua página
 * e construa o conteúdo no lugar — sem mexer nas páginas dos colegas.
 */
defineProps<{ tela: string }>()
</script>

<template>
  <div class="em-construcao">
    <p class="rotulo">Em construção — {{ tela }}</p>
    <p class="dica">
      Esta tela ainda será implementada. Use os dados de
      <code>src/mocks/</code> e as cores de <code>src/styles/tokens.css</code>.
    </p>
  </div>
</template>

<style scoped>
.em-construcao {
  padding: var(--space-6);
  background: var(--surface);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
}

.rotulo {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text);
}

.dica {
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: var(--text-soft);
}

code {
  font-size: var(--text-xs);
  padding: 1px 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
}
</style>
