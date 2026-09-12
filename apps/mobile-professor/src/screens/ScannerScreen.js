import { Pressable, StyleSheet, Text, View } from 'react-native'
import { cores, espacos, raios } from '../theme'

/**
 * Leitura do QR Code e do cartão-resposta (RF08) — mockup
 * docs/telas/15-mobile-scanner.png.
 *
 * Na N1 é só a UI do visor: não acessa a câmera. Tocar em qualquer lugar
 * simula uma leitura concluída e leva para a revisão da nota. A câmera de
 * verdade (expo-camera) e o reconhecimento entram na N2/N3.
 */
export default function ScannerScreen({ onLeituraConcluida, onCancelar }) {
  return (
    <View style={estilos.tela}>
      <Pressable style={estilos.visor} onPress={onLeituraConcluida}>
        <View style={[estilos.canto, estilos.cantoSuperiorEsquerdo]} />
        <View style={[estilos.canto, estilos.cantoSuperiorDireito]} />
        <View style={[estilos.canto, estilos.cantoInferiorEsquerdo]} />
        <View style={[estilos.canto, estilos.cantoInferiorDireito]} />

        <Text style={estilos.instrucao}>
          Aponte para o QR Code no topo da prova
        </Text>
        <Text style={estilos.dica}>
          (toque na tela para simular uma leitura)
        </Text>
      </Pressable>

      <Pressable style={estilos.botaoSecundario} onPress={onCancelar}>
        <Text style={estilos.botaoSecundarioTexto}>Cancelar</Text>
      </Pressable>
    </View>
  )
}

const TAMANHO_CANTO = 36
const ESPESSURA = 3

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    padding: espacos[5],
    backgroundColor: cores.surface,
  },
  visor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacos[4],
    backgroundColor: cores.text,
    borderRadius: raios.lg,
  },
  canto: {
    position: 'absolute',
    width: TAMANHO_CANTO,
    height: TAMANHO_CANTO,
    borderColor: cores.surface,
  },
  cantoSuperiorEsquerdo: {
    top: espacos[5],
    left: espacos[5],
    borderTopWidth: ESPESSURA,
    borderLeftWidth: ESPESSURA,
  },
  cantoSuperiorDireito: {
    top: espacos[5],
    right: espacos[5],
    borderTopWidth: ESPESSURA,
    borderRightWidth: ESPESSURA,
  },
  cantoInferiorEsquerdo: {
    bottom: espacos[5],
    left: espacos[5],
    borderBottomWidth: ESPESSURA,
    borderLeftWidth: ESPESSURA,
  },
  cantoInferiorDireito: {
    bottom: espacos[5],
    right: espacos[5],
    borderBottomWidth: ESPESSURA,
    borderRightWidth: ESPESSURA,
  },
  instrucao: {
    paddingHorizontal: espacos[5],
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: cores.surface,
  },
  dica: {
    marginTop: espacos[2],
    fontSize: 14,
    textAlign: 'center',
    color: cores.textFaint,
  },
  botaoSecundario: {
    alignItems: 'center',
    padding: espacos[3],
    borderWidth: 1,
    borderColor: cores.borderStrong,
    borderRadius: raios.md,
  },
  botaoSecundarioTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.text,
  },
})
