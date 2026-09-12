import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { cores, espacos, raios } from '../theme'
import { correcoesNaFila, gabaritos, professora } from '../mocks'

/**
 * Home do app (RF10) — mockup docs/telas/14-mobile-home-sync.png.
 *
 * Mostra o estado da conexão, quantas correções estão esperando na fila
 * local e os gabaritos já baixados para uso offline. Na N1 o status fica
 * fixo em "sem conexão": a detecção de rede entra junto com o sync da N2.
 */
export default function HomeScreen({ onCorrigir }) {
  const primeiroNome = professora.nome.split(' ')[0]

  return (
    <ScrollView contentContainerStyle={estilos.tela}>
      <Text style={estilos.titulo}>Olá, {primeiroNome}</Text>
      <Text style={estilos.subtitulo}>Correção de provas</Text>

      <View style={estilos.banner}>
        <View style={estilos.pontinho} />
        <Text style={estilos.bannerTexto}>
          Sem conexão · usando gabaritos offline
        </Text>
      </View>

      <View style={estilos.fila}>
        <View>
          <Text style={estilos.filaNumero}>{correcoesNaFila}</Text>
          <Text style={estilos.filaRotulo}>correções na fila local</Text>
        </View>
        <Text style={estilos.filaStatus}>aguardando sincronizar</Text>
      </View>

      <Text style={estilos.secao}>Gabaritos baixados</Text>

      {gabaritos.map((gabarito) => (
        <View key={gabarito.id} style={estilos.cartao}>
          <View style={estilos.cartaoTopo}>
            <Text style={estilos.cartaoTurma}>{gabarito.turma}</Text>
            <Text style={estilos.cartaoAlunos}>{gabarito.alunos} alunos</Text>
          </View>
          <Text style={estilos.cartaoProva}>
            {gabarito.prova} ·{' '}
            {gabarito.comIdentificacao ? 'com identificação' : 'sem identificação'}
          </Text>
        </View>
      ))}

      <Pressable style={estilos.botao} onPress={onCorrigir}>
        <Text style={estilos.botaoTexto}>Corrigir provas</Text>
      </Pressable>
    </ScrollView>
  )
}

const estilos = StyleSheet.create({
  tela: {
    padding: espacos[5],
    backgroundColor: cores.surface,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: cores.text,
  },
  subtitulo: {
    marginTop: espacos[1],
    marginBottom: espacos[4],
    fontSize: 16,
    color: cores.textSoft,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos[2],
    padding: espacos[3],
    marginBottom: espacos[3],
    backgroundColor: cores.warnSoft,
    borderRadius: raios.md,
  },
  pontinho: {
    width: 8,
    height: 8,
    backgroundColor: cores.warn,
    borderRadius: 4,
  },
  bannerTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.warn,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: espacos[4],
    marginBottom: espacos[5],
    backgroundColor: cores.warnSoft,
    borderRadius: raios.md,
  },
  filaNumero: {
    fontSize: 24,
    fontWeight: '700',
    color: cores.warn,
  },
  filaRotulo: {
    fontSize: 14,
    color: cores.warn,
  },
  filaStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.warn,
  },
  secao: {
    marginBottom: espacos[2],
    fontSize: 15,
    fontWeight: '700',
    color: cores.text,
  },
  cartao: {
    padding: espacos[4],
    marginBottom: espacos[3],
    backgroundColor: cores.surface,
    borderWidth: 1,
    borderColor: cores.border,
    borderRadius: raios.md,
  },
  cartaoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartaoTurma: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.text,
  },
  cartaoAlunos: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.text,
  },
  cartaoProva: {
    marginTop: espacos[1],
    fontSize: 14,
    color: cores.textSoft,
  },
  botao: {
    alignItems: 'center',
    padding: espacos[4],
    marginTop: espacos[3],
    backgroundColor: cores.accent,
    borderRadius: raios.md,
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.surface,
  },
})
