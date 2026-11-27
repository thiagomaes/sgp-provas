// Mede o tempo de resposta da API publicada (T25, RNF02: p95 até 300 ms nas
// operações comuns). Só leitura: um login e depois GETs; nada é criado,
// editado ou apagado.
//
// Uso (a conta de demonstração está no README, seção 13):
//   SGP_EMAIL=<e-mail> SGP_SENHA=<senha> node scripts/medir-desempenho.mjs
// Opcional: SGP_API (padrão https://sgp-provas-api.vercel.app) e SGP_REPETICOES (padrão 30).

const API = process.env.SGP_API ?? 'https://sgp-provas-api.vercel.app';
const REPETICOES = Number(process.env.SGP_REPETICOES ?? 30);
const { SGP_EMAIL: email, SGP_SENHA: senha } = process.env;

if (!email || !senha) {
  console.error('Informe SGP_EMAIL e SGP_SENHA (conta de demonstração do README).');
  process.exit(1);
}

async function medir(caminho, token) {
  const inicio = performance.now();
  const resposta = await fetch(API + caminho, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  await resposta.arrayBuffer();
  const ms = performance.now() - inicio;
  if (!resposta.ok) throw new Error(`GET ${caminho} respondeu ${resposta.status}`);
  return ms;
}

function percentil(ordenados, p) {
  const posicao = Math.ceil((p / 100) * ordenados.length) - 1;
  return ordenados[Math.min(Math.max(posicao, 0), ordenados.length - 1)];
}

const redondo = (ms) => Math.round(ms);

// A primeira chamada pode pegar a função da Vercel e o banco do Aiven dormindo.
const primeira = await medir('/health');

const inicioLogin = performance.now();
const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, senha }),
});
const msLogin = performance.now() - inicioLogin;
if (!login.ok) throw new Error(`Login respondeu ${login.status}`);
const { accessToken } = await login.json();

const aplicacoes = await (await fetch(`${API}/applications`, { headers: { Authorization: `Bearer ${accessToken}` } })).json();
const aplicacao = aplicacoes.find((item) => item.status !== 'rascunho') ?? aplicacoes[0];
if (!aplicacao) throw new Error('A conta não tem aplicação para medir o relatório.');

const rotas = [
  ['Saúde da API', '/health', false],
  ['Turmas', '/classes', true],
  ['Questões', '/questions', true],
  ['Provas', '/exams', true],
  ['Aplicações', '/applications', true],
  ['Relatório de uma aplicação', `/applications/${aplicacao.id}/report`, true],
];

const linhas = [];
for (const [nome, caminho, comLogin] of rotas) {
  const tempos = [];
  for (let i = 0; i < REPETICOES; i++) tempos.push(await medir(caminho, comLogin ? accessToken : null));
  const [primeiraDaRota, ...resto] = tempos;
  const ordenados = [...resto].sort((a, b) => a - b);
  linhas.push({
    rota: nome,
    caminho: caminho.replace(aplicacao.id, ':id'),
    primeira: redondo(primeiraDaRota),
    p50: redondo(percentil(ordenados, 50)),
    p95: redondo(percentil(ordenados, 95)),
    maximo: redondo(ordenados.at(-1)),
  });
}

console.log(`API: ${API} | ${new Date().toISOString()} | ${REPETICOES} chamadas por rota`);
console.log(`Primeira chamada (função e banco acordando): ${redondo(primeira)} ms | login: ${redondo(msLogin)} ms`);
console.log('As estatísticas usam as chamadas 2 a N de cada rota; a 1ª vai à parte.');
console.table(linhas);
const acima = linhas.filter((linha) => linha.p95 > 300);
console.log(acima.length ? `p95 acima de 300 ms (RNF02): ${acima.map((linha) => linha.rota).join(', ')}` : 'Todas as rotas com p95 até 300 ms (RNF02).');
