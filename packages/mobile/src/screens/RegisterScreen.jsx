import React, { useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import { TextInput, Button, Text } from 'react-native-paper'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useAuthStore()

  const handleRegister = async () => {
    if (!name || !email || !password || !passwordConfirm) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios')
      return
    }

    if (password !== passwordConfirm) {
      Alert.alert('Erro', 'As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.register({
        name,
        email,
        password,
        passwordConfirm,
      })
      await setToken(data.token)
      await setUser(data.user)
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Criar Conta</Text>

        <View style={styles.form}>
          <TextInput
            label="Nome"
            value={name}
            onChangeText={setName}
            style={styles.input}
            editable={!loading}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            editable={!loading}
          />

          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            editable={!loading}
          />

          <TextInput
            label="Confirmar Senha"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
            style={styles.input}
            editable={!loading}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            Voltar
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0284c7',
    marginBottom: 30,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
  },
})
