<script setup lang="ts">
/**
 * Bloco de estado das telas que buscam dados na API: carregando, lista
 * vazia ou erro. O texto vai no slot; no erro, "Tentar de novo" avisa a
 * tela pelo evento tentar.
 *
 *   <EstadoTela v-if="carregando" tipo="carregando">Carregando turmas...</EstadoTela>
 *   <EstadoTela v-else-if="erro" tipo="erro" @tentar="carregar">{{ erro }}</EstadoTela>
 */
defineProps<{ tipo: 'carregando' | 'vazio' | 'erro' }>()
defineEmits<{ tentar: [] }>()
</script>

<template>
  <div class="estado" :class="tipo" :role="tipo === 'erro' ? 'alert' : 'status'">
    <span v-if="tipo === 'carregando'" class="giro" aria-hidden="true" />
    <p class="texto"><slot /></p>
    <button v-if="tipo === 'erro'" class="botao" type="button" @click="$emit('tentar')">
      Tentar de novo
    </button>
  </div>
</template>

<style scoped>
.estado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.estado.erro {
  color: var(--warn);
  background: var(--warn-soft);
  border-color: var(--warn-soft);
}

.texto {
  flex: 1;
  min-width: 180px;
  margin: 0;
  font-size: var(--text-base);
}

.giro {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 999px;
  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

.botao {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.botao:hover {
  background: var(--bg);
}
</style>
