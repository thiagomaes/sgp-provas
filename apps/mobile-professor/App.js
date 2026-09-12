import { useState } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import ScannerScreen from './src/screens/ScannerScreen'
import RevisaoScreen from './src/screens/RevisaoScreen'
import { cores } from './src/theme'

/**
 * App do professor — navegação entre as 4 telas da N1.
 *
 * A navegação é um estado simples aqui, de propósito: na N1 o fluxo é
 * linear (login → home → scanner → revisão → home) e isso evita trazer o
 * react-navigation só para demonstrar telas. Quando surgirem abas, deep
 * link ou botão de voltar do Android, vale trocar por uma lib de navegação.
 */
export default function App() {
  const [tela, setTela] = useState('login')

  return (
    <SafeAreaView style={estilos.app}>
      <StatusBar style="dark" />

      {tela === 'login' && <LoginScreen onEntrar={() => setTela('home')} />}

      {tela === 'home' && <HomeScreen onCorrigir={() => setTela('scanner')} />}

      {tela === 'scanner' && (
        <ScannerScreen
          onLeituraConcluida={() => setTela('revisao')}
          onCancelar={() => setTela('home')}
        />
      )}

      {tela === 'revisao' && <RevisaoScreen onConfirmar={() => setTela('home')} />}
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: cores.surface,
  },
})
