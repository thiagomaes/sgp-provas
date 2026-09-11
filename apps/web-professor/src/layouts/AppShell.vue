<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import { professoraLogada } from '../mocks/turmas'

/**
 * Layout base de todas as telas internas do SGP.
 *
 * Uso numa tela de feature:
 *
 *   <AppShell>
 *     <template #titulo>Turmas</template>
 *     <template #subtitulo>Gerencie suas turmas e os alunos cadastrados</template>
 *     ...conteúdo da tela...
 *   </AppShell>
 *
 * A tela de login NÃO usa este layout (é um card centralizado).
 */

interface ItemMenu {
  rotulo: string
  para: string
  /** Prefixos de rota que também mantêm este item destacado (ex.: /turmas/1). */
  prefixo: string
}

const menu: ItemMenu[] = [
  { rotulo: 'Dashboard', para: '/dashboard', prefixo: '/dashboard' },
  { rotulo: 'Turmas', para: '/turmas', prefixo: '/turmas' },
  { rotulo: 'Banco de questões', para: '/questoes', prefixo: '/questoes' },
  { rotulo: 'Provas', para: '/provas', prefixo: '/provas' },
  { rotulo: 'Aplicações e PDF', para: '/aplicacoes', prefixo: '/aplicacoes' },
  { rotulo: 'Relatórios e notas', para: '/relatorios', prefixo: '/relatorios' },
]

const route = useRoute()

const estaAtivo = computed(() => (prefixo: string) => {
  return route.path === prefixo || route.path.startsWith(`${prefixo}/`)
})

const iniciais = computed(() =>
  professoraLogada.nome
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="marca">
        <span class="marca-logo">SGP</span>
        <span class="marca-sub">Geração de Provas</span>
      </div>

      <nav class="menu">
        <RouterLink
          v-for="item in menu"
          :key="item.para"
          :to="item.para"
          class="menu-item"
          :class="{ ativo: estaAtivo(item.prefixo) }"
        >
          {{ item.rotulo }}
        </RouterLink>
      </nav>

      <footer class="rodape">
        <span class="avatar">{{ iniciais }}</span>
        <span class="rodape-texto">
          <span class="rodape-nome">{{ professoraLogada.nome }}</span>
          <span class="rodape-papel">Professora</span>
        </span>
      </footer>
    </aside>

    <main class="conteudo">
      <header class="cabecalho">
        <h1 class="titulo"><slot name="titulo">Página</slot></h1>
        <p class="subtitulo"><slot name="subtitulo" /></p>
      </header>

      <div class="corpo">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}

/* ---------- sidebar ---------- */

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
}

.marca {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-5) var(--space-4) var(--space-4);
}

.marca-logo {
  font-size: var(--text-xl);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--accent-dark);
}

.marca-sub {
  font-size: var(--text-xs);
  color: var(--text-faint);
}

.menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  overflow-y: auto;
}

.menu-item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.menu-item:hover {
  background: var(--bg);
  color: var(--text);
}

.menu-item.ativo {
  background: var(--accent-soft);
  color: var(--accent-dark);
  font-weight: 600;
}

.rodape {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
}

.avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-dark);
  font-size: var(--text-xs);
  font-weight: 600;
}

.rodape-texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rodape-nome {
  font-size: var(--text-sm);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rodape-papel {
  font-size: var(--text-xs);
  color: var(--text-faint);
}

/* ---------- conteúdo ---------- */

.conteudo {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: var(--space-6) var(--space-7);
  max-width: 1180px;
}

.cabecalho {
  margin-bottom: var(--space-5);
}

.titulo {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text);
}

.subtitulo {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.subtitulo:empty {
  display: none;
}
</style>
