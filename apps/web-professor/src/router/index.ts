import { createRouter, createWebHistory } from 'vue-router'

/**
 * Rotas da web do professor.
 *
 * Todas as telas internas já existem como placeholder ("Em construção")
 * dentro do AppShell. Ao implementar sua tela, mexa APENAS no arquivo da
 * sua página em src/pages/ — assim ninguém dá conflito neste arquivo.
 * Só altere este arquivo se precisar de uma rota nova.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },

    // Login — única tela fora do AppShell (card centralizado).
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
    },

    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue'),
    },

    {
      path: '/turmas',
      name: 'turmas',
      component: () => import('../pages/TurmasPage.vue'),
    },
    {
      path: '/turmas/:id',
      name: 'turma-detalhe',
      component: () => import('../pages/TurmaDetalhePage.vue'),
    },

    {
      path: '/questoes',
      name: 'questoes',
      component: () => import('../pages/QuestoesPage.vue'),
    },
    {
      path: '/questoes/nova',
      name: 'questao-nova',
      component: () => import('../pages/QuestaoNovaPage.vue'),
    },
    {
      path: '/questoes/:id/editar',
      name: 'questao-editar',
      component: () => import('../pages/QuestaoNovaPage.vue'),
    },

    {
      path: '/provas',
      name: 'provas',
      component: () => import('../pages/ProvasPage.vue'),
    },
    {
      path: '/provas/nova',
      name: 'prova-nova',
      component: () => import('../pages/ProvaNovaPage.vue'),
    },

    {
      path: '/aplicacoes',
      name: 'aplicacoes',
      component: () => import('../pages/AplicacoesPage.vue'),
    },
    {
      path: '/aplicacoes/:id/exportar',
      name: 'aplicacao-exportar',
      component: () => import('../pages/AplicacaoExportarPage.vue'),
    },

    {
      path: '/relatorios',
      name: 'relatorios',
      component: () => import('../pages/RelatoriosPage.vue'),
    },
    {
      path: '/relatorios/:id',
      name: 'relatorio-detalhe',
      component: () => import('../pages/RelatorioDetalhePage.vue'),
    },
  ],
})

export default router
