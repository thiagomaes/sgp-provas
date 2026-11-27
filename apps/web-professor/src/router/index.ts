import { createRouter, createWebHistory } from 'vue-router'
import { temSessao } from '../services/sessao'

/**
 * Rotas da web do professor.
 *
 * Todas as telas internas usam o AppShell e só abrem com o professor
 * logado (ver a guarda no fim do arquivo). Ao mexer numa tela, altere
 * APENAS o arquivo da página em src/pages/ — assim ninguém dá conflito
 * neste arquivo. Só altere este arquivo se precisar de uma rota nova.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // O login é a porta de entrada do sistema (RF01): abrir a raiz cai nele.
    { path: '/', redirect: '/login' },

    // Login — única tela fora do AppShell (card centralizado).
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
    },
    // Cadastro do professor, também fora do AppShell e aberto sem sessão.
    {
      path: '/cadastro',
      name: 'cadastro',
      component: () => import('../pages/CadastroPage.vue'),
    },
    // Recuperação de senha, aberta sem sessão.
    {
      path: '/esqueci-senha',
      name: 'esqueci-senha',
      component: () => import('../pages/EsqueciSenhaPage.vue'),
    },
    {
      path: '/redefinir-senha',
      name: 'redefinir-senha',
      component: () => import('../pages/RedefinirSenhaPage.vue'),
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
      path: '/provas/:id/editar',
      name: 'prova-editar',
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
      path: '/aplicacoes/:id/gabarito',
      name: 'aplicacao-gabarito',
      component: () => import('../pages/AplicacaoGabaritoPage.vue'),
    },

    // Correção pela câmera do celular (RF08). Ver ADR-001.
    {
      path: '/correcao',
      name: 'correcao',
      component: () => import('../pages/CorrecaoPage.vue'),
    },
    {
      path: '/correcao/:id/escanear',
      name: 'correcao-escanear',
      component: () => import('../pages/CorrecaoEscanearPage.vue'),
    },
    {
      path: '/correcao/:id/revisao',
      name: 'correcao-revisao',
      component: () => import('../pages/CorrecaoRevisaoPage.vue'),
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

    // Dados da conta e anonimização (RF13, LGPD).
    {
      path: '/conta',
      name: 'conta',
      component: () => import('../pages/ContaPage.vue'),
    },
  ],
})

// Sem sessão, qualquer tela interna leva ao login. Já logado, o login, o
// cadastro e o "esqueci minha senha" levam direto ao dashboard. O link de
// redefinição abre sempre: ele pode chegar a quem está logado em outra conta.
const TELAS_ABERTAS = new Set(['login', 'cadastro', 'esqueci-senha'])

router.beforeEach((to) => {
  const logado = temSessao()
  if (to.name === 'redefinir-senha') return true
  if (TELAS_ABERTAS.has(String(to.name))) return logado ? '/dashboard' : true
  return logado ? true : '/login'
})

export default router
