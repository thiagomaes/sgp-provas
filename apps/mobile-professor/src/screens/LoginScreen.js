import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { cores, espacos, raios } from '../theme'

/**
 * Login do professor no app (RF01) — mockup docs/telas/13-mobile-login.png.
 * Na N1 não há autenticação: qualquer valor entra.
 */
export default function LoginScreen({ onEntrar }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  return (
    <View style={estilos.tela}>
      <View style={estilos.marca} />
      <Text style={estilos.titulo}>Entrar no SGP</Text>
      <Text style={estilos.subtitulo}>Correção de provas do professor.</Text>

      <Text style={estilos.rotulo}>E-mail</Text>
      <TextInput
        style={estilos.campo}
        value={email}
        onChangeText={setEmail}
        placeholder="ana.professora@escola.edu.br"
        placeholderTextColor={cores.textFaint}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={estilos.rotulo}>Senha</Text>
      <TextInput
        style={estilos.campo}
        value={senha}
        onChangeText={setSenha}
        placeholder="••••••••••"
        placeholderTextColor={cores.textFaint}
        secureTextEntry
      />

      <Pressable style={estilos.botao} onPress={onEntrar}>
        <Text style={estilos.botaoTexto}>Entrar</Text>
      </Pressable>
    </View>
  )
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    justifyContent: 'center',
    padding: espacos[5],
    backgroundColor: cores.surface,
  },
  marca: {
    width: 48,
    height: 48,
    marginBottom: espacos[4],
    backgroundColor: cores.accent,
    borderRadius: raios.sm,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: cores.text,
  },
  subtitulo: {
    marginTop: espacos[1],
    marginBottom: espacos[5],
    fontSize: 16,
    color: cores.textSoft,
  },
  rotulo: {
    marginBottom: espacos[1],
    fontSize: 13,
    fontWeight: '600',
    color: cores.textSoft,
  },
  campo: {
    marginBottom: espacos[4],
    padding: espacos[3],
    fontSize: 16,
    color: cores.text,
    backgroundColor: cores.surface,
    borderWidth: 1,
    borderColor: cores.borderStrong,
    borderRadius: raios.md,
  },
  botao: {
    alignItems: 'center',
    padding: espacos[3],
    backgroundColor: cores.accent,
    borderRadius: raios.md,
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.surface,
  },
})
