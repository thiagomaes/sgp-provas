<script setup lang="ts">
/**
 * Confirmação de exclusão na própria tela (sem window.confirm). A tela
 * mostra este bloco no lugar da linha ou do formulário e faz a chamada à
 * API no evento confirmar. Se a API recusar (ex.: 409), a mensagem dela
 * vem pela prop erro e fica aqui mesmo, ao lado dos botões.
 */
defineProps<{
  /** O que vai ser excluído, ex.: "a turma Matemática — 1º Ano". */
  alvo: string
  /** Texto extra, ex.: o que acontece com os dados ligados. */
  detalhe?: string
  excluindo?: boolean
  erro?: string
}>()
defineEmits<{ confirmar: []; cancelar: [] }>()
</script>

<template>
  <div class="confirmacao" role="alertdialog" :aria-label="`Excluir ${alvo}`">
    <p class="pergunta">Excluir {{ alvo }}?</p>
    <p v-if="detalhe" class="detalhe">{{ detalhe }}</p>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <div class="acoes">
      <button class="botao-excluir" type="button" :disabled="excluindo" @click="$emit('confirmar')">
        {{ excluindo ? 'Excluindo...' : 'Excluir' }}
      </button>
      <button class="botao-secundario" type="button" :disabled="excluindo" @click="$emit('cancelar')">
        Cancelar
      </button>
    </div>
  </div>
</template>

<style scoped>
.confirmacao {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  text-align: left;
  white-space: normal;
  background: var(--warn-soft);
  border: 1px solid var(--warn-soft);
  border-radius: var(--radius-md);
}

.pergunta {
  margin: 0;
  font-weight: 600;
  color: var(--text);
}

.detalhe {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.erro {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--surface);
  border-radius: var(--radius-sm);
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.botao-excluir,
.botao-secundario {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.botao-excluir {
  color: var(--surface);
  background: var(--warn);
  border: 1px solid var(--warn);
}

.botao-secundario {
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border-strong);
}

.botao-excluir:disabled,
.botao-secundario:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
