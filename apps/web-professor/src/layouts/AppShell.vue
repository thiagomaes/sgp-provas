<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import LogoSGP from '../components/LogoSGP.vue'
import { useAuthStore } from '../stores/auth'

/**
 * Layout base de todas as telas internas do SGP.
 * Fiel aos protótipos aprovados (docs/telas/02-dashboard.png e 04-turma-detalhe.png).
 *
 * Uso numa tela de feature:
 *
 *   <AppShell>
 *     <template #caminho>Turmas / Matemática — 1º Ano</template>
 *     <template #titulo>Matemática — 1º Ano</template>
 *     <template #subtitulo>32 alunos cadastrados nesta turma.</template>
 *     <template #acoes><button>+ Adicionar aluno</button></template>
 *     ...conteúdo da tela...
 *   </AppShell>
 *
 * Os slots #caminho (breadcrumb) e #acoes (botão no canto direito) são
 * opcionais e somem quando não são preenchidos.
 * A tela de login NÃO usa este layout (é uma coluna centralizada).
 *
 * Responsivo: abaixo de 768px a sidebar vira uma gaveta aberta pelo botão
 * de menu da barra do topo, e as tabelas das telas rolam na horizontal
 * dentro do próprio bloco. O SGP é um sistema web só, usado também no
 * celular (ADR-001), então toda tela nova precisa caber em 390px.
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
  { rotulo: 'Correção', para: '/correcao', prefixo: '/correcao' },
  { rotulo: 'Relatórios e notas', para: '/relatorios', prefixo: '/relatorios' },
]

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Depois de recarregar a página o token continua salvo, mas o nome do
// professor precisa vir da API de novo (GET /auth/me).
onMounted(() => {
  if (!auth.professor) auth.carregarProfessor().catch(() => {})
})

const saindo = ref(false)

async function sair() {
  saindo.value = true
  await auth.sair()
  saindo.value = false
  router.push('/login')
}

const estaAtivo = computed(() => (prefixo: string) => {
  return route.path === prefixo || route.path.startsWith(`${prefixo}/`)
})

/** Gaveta do menu no celular. No desktop a sidebar fica sempre visível. */
const menuAberto = ref(false)

// Escolher um item do menu troca de rota: a gaveta fecha sozinha.
watch(
  () => route.path,
  () => {
    menuAberto.value = false
  },
)
</script>

<template>
  <div class="shell">
    <header class="topo-celular">
      <LogoSGP com-texto />
      <button
        class="botao-menu"
        type="button"
        :aria-expanded="menuAberto"
        aria-controls="menu-lateral"
        @click="menuAberto = !menuAberto"
      >
        {{ menuAberto ? 'Fechar' : 'Menu' }}
      </button>
    </header>

    <div v-if="menuAberto" class="fundo-menu" @click="menuAberto = false" />

    <aside id="menu-lateral" class="sidebar" :class="{ aberta: menuAberto }">
      <div class="marca">
        <LogoSGP com-texto />
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
        <div class="rodape-texto">
          <span class="rodape-nome">{{ auth.professor?.nome ?? 'Carregando...' }}</span>
          <span class="rodape-papel">Professor</span>
        </div>
        <button class="botao-sair" type="button" :disabled="saindo" @click="sair">
          {{ saindo ? 'Saindo...' : 'Sair' }}
        </button>
      </footer>
    </aside>

    <main class="conteudo">
      <header class="cabecalho">
        <div class="cabecalho-texto">
          <p class="caminho"><slot name="caminho" /></p>
          <h1 class="titulo"><slot name="titulo">Página</slot></h1>
          <p class="subtitulo"><slot name="subtitulo" /></p>
        </div>
        <div class="acoes"><slot name="acoes" /></div>
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
  background: var(--surface);
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
  padding: var(--space-5) var(--space-4) var(--space-4);
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
  font-size: var(--text-base);
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
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
}

.rodape-texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.botao-sair {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.botao-sair:hover {
  color: var(--text);
  background: var(--bg);
}

.rodape-nome {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
}

.rodape-papel {
  font-size: var(--text-sm);
  color: var(--text-faint);
}

/* ---------- conteúdo ---------- */

.conteudo {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: var(--space-6) var(--space-7);
}

.cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
  margin-bottom: var(--space-5);
}

.cabecalho-texto {
  min-width: 0;
}

.caminho {
  margin: 0 0 var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-faint);
}

.titulo {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text);
}

.subtitulo {
  margin: var(--space-1) 0 0;
  font-size: var(--text-base);
  color: var(--text-soft);
}

/* Slots opcionais não ocupam espaço quando a tela não os preenche. */
.caminho:empty,
.subtitulo:empty,
.acoes:empty {
  display: none;
}

/* ---------- celular (abaixo de 768px) ---------- */

.topo-celular,
.fundo-menu {
  display: none;
}

@media (max-width: 767px) {
  .shell {
    flex-direction: column;
  }

  .topo-celular {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }

  .botao-menu {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .fundo-menu {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: block;
    background: var(--text);
    opacity: 0.4;
  }

  .sidebar {
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .sidebar.aberta {
    transform: translateX(0);
  }

  .conteudo {
    min-width: 0;
    margin-left: 0;
    padding: var(--space-5) var(--space-4);
  }

  .cabecalho {
    flex-direction: column;
    gap: var(--space-3);
  }

  .titulo {
    font-size: var(--text-xl);
  }

  /*
   * Tabelas das telas: em vez de espremer as colunas ou estourar a página,
   * a própria tabela vira um bloco com rolagem horizontal.
   */
  .corpo :deep(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
  }

  .corpo :deep(th),
  .corpo :deep(td) {
    white-space: nowrap;
  }
}
</style>
