import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native'
import { Text, Card, TextInput, Button, SegmentedButtons } from 'react-native-paper'
import { useExpenseStore } from '../store/expenseStore'
import { expenseAPI } from '../services/api'

const CATEGORIES = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Entretenimento', 'Moradia', 'Utilidades', 'Outro']

export default function ExpensesScreen() {
  const { expenses, setExpenses, addExpense, removeExpense } = useExpenseStore()
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Outro',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const res = await expenseAPI.list({ limit: 100 })
      setExpenses(res.data.expenses)
    } catch (err) {
      console.error('Erro ao carregar despesas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!formData.description || !formData.amount) {
      Alert.alert('Erro', 'Descrição e valor são obrigatórios')
      return
    }

    try {
      const res = await expenseAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
      })
      addExpense(res.data.expense)
      setFormData({
        description: '',
        amount: '',
        category: 'Outro',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setShowForm(false)
      Alert.alert('Sucesso', 'Despesa adicionada com sucesso')
    } catch (err) {
      Alert.alert('Erro', 'Erro ao adicionar despesa')
    }
  }

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirmar',
      'Deseja deletar esta despesa?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Deletar',
          onPress: async () => {
            try {
              await expenseAPI.delete(id)
              removeExpense(id)
            } catch (err) {
              Alert.alert('Erro', 'Erro ao deletar despesa')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.title}>Despesas</Text>

        {expenses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhuma despesa registrada</Text>
            </Card.Content>
          </Card>
        ) : (
          expenses.map(expense => (
            <Card key={expense._id} style={styles.expenseCard}>
              <Card.Content>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>R$ {expense.amount.toFixed(2)}</Text>
                </View>
                <Text style={styles.expenseDate}>
                  {new Date(expense.date).toLocaleDateString('pt-BR')}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(expense._id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Deletar</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Button
        mode="contained"
        onPress={() => setShowForm(true)}
        style={styles.fab}
      >
        + Nova Despesa
      </Button>

      <Modal visible={showForm} animationType="slide">
        <ScrollView style={styles.modal}>
          <Text style={styles.modalTitle}>Nova Despesa</Text>

          <TextInput
            label="Descrição"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            style={styles.input}
          />

          <TextInput
            label="Valor (R$)"
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Categoria</Text>
          <SegmentedButtons
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            buttons={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
            style={styles.segmented}
          />

          <TextInput
            label="Notas"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            style={styles.input}
            multiline
          />

          <Button
            mode="contained"
            onPress={handleAddExpense}
            style={styles.submitButton}
          >
            Adicionar Despesa
          </Button>

          <Button
            mode="outlined"
            onPress={() => setShowForm(false)}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
        </ScrollView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  expenseCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#666',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  expenseDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  deleteButton: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
    borderRadius: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  segmented: {
    marginBottom: 16,
  },
  submitButton: {
    marginBottom: 12,
    marginTop: 20,
  },
  cancelButton: {
    marginBottom: 20,
  },
})
