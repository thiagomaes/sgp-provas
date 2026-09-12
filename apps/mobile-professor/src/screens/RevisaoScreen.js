import { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { cores, espacos, raios } from '../theme'
import { correcaoLida } from '../mocks'

/**
 * Revisão da nota antes de confirmar (RF08) — mockup
 * docs/telas/16-mobile-revisao.png.
 *
 * A nota vem calculada da leitura, e o professor pode ajustar à mão antes
 * de confirmar. Confirmar devolve para a Home; na N2 isso vai gravar na
 * fila local (SQLite) para sincronizar depois.
 */
export default function RevisaoScreen({ onConfirmar }) {
  const [nota, setNota] = useState(correcaoLida.nota)
  const [ajustando, setAjustando] = useState(false)
  const [notaDigitada, setNotaDigitada] = useState(String(correcaoLida.nota))

  function salvarAjuste() {
    const valor = Number(notaDigitada.replace(',', '.'))
    if (!Number.isNaN(valor) && valor >= 0 && valor <= 10) {
      setNota(valor)
    }
    setAjustando(false)
  }

  return (
    <ScrollView contentContainerStyle={estilos.tela}>
      <Text style={estilos.titulo}>Revisar correção</Text>
      <Text style={estilos.subtitulo}>
        {correcaoLida.aluno} · matrícula {correcaoLida.matricula}
      </Text>

      <Text style={estilos.nota}>{nota.toFixed(1).replace('.', ',')}</Text>
      <Text style={estilos.notaRotulo}>
        {ajustando ? 'ajuste manual do professor' : 'nota calculada automaticamente'}
      </Text>

      {ajustando && (
        <View style={estilos.ajuste}>
          <TextInput
            style={estilos.campo}
            value={notaDigitada}
            onChangeText={setNotaDigitada}
            keyboardType="decimal-pad"
            accessibilityLabel="Nova nota"
          />
          <Pressable style={estilos.botao} onPress={salvarAjuste}>
            <Text style={estilos.botaoTexto}>Salvar</Text>
          </Pressable>
        </View>
      )}

      {correcaoLida.questoes.map((questao) => (
        <View key={questao.numero} style={estilos.linha}>
          <Text style={estilos.linhaTexto}>Questão {questao.numero}</Text>
          <View
            style={[
              estilos.marcador,
              questao.correta ? estilos.marcadorOk : estilos.marcadorErro,
            ]}
          >
            <Text style={estilos.marcadorTexto}>
              {questao.correta ? '✓' : '✕'}
            </Text>
          </View>
        </View>
      ))}

      <View style={estilos.rodape}>
        <Pressable
          style={estilos.botaoSecundario}
          onPress={() => setAjustando(true)}
        >
          <Text style={estilos.botaoSecundarioTexto}>Ajustar nota</Text>
        </Pressable>
        <Pressable style={estilos.botaoConfirmar} onPress={onConfirmar}>
          <Text style={estilos.botaoTexto}>Confirmar</Text>
        </Pressable>
      </View>
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
    fontSize: 16,
    color: cores.textSoft,
  },
  nota: {
    marginTop: espacos[5],
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: cores.accentDark,
  },
  notaRotulo: {
    marginBottom: espacos[5],
    fontSize: 14,
    textAlign: 'center',
    color: cores.textSoft,
  },
  ajuste: {
    flexDirection: 'row',
    gap: espacos[2],
    marginBottom: espacos[5],
  },
  campo: {
    flex: 1,
    padding: espacos[3],
    fontSize: 16,
    color: cores.text,
    borderWidth: 1,
    borderColor: cores.borderStrong,
    borderRadius: raios.md,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: espacos[3],
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
  },
  linhaTexto: {
    fontSize: 16,
    color: cores.text,
  },
  marcador: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  marcadorOk: {
    backgroundColor: cores.accent,
  },
  marcadorErro: {
    backgroundColor: cores.warn,
  },
  marcadorTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.surface,
  },
  rodape: {
    flexDirection: 'row',
    gap: espacos[3],
    marginTop: espacos[5],
  },
  botaoSecundario: {
    flex: 1,
    alignItems: 'center',
    padding: espacos[4],
    borderWidth: 1,
    borderColor: cores.borderStrong,
    borderRadius: raios.md,
  },
  botaoSecundarioTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.text,
  },
  botaoConfirmar: {
    flex: 1,
    alignItems: 'center',
    padding: espacos[4],
    backgroundColor: cores.accent,
    borderRadius: raios.md,
  },
  botao: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacos[4],
    backgroundColor: cores.accent,
    borderRadius: raios.md,
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.surface,
  },
})
