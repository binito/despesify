import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { Text, Card } from 'react-native-paper'
import { useExpenseStore } from '../store/expenseStore'
import { expenseAPI } from '../services/api'

export default function DashboardScreen() {
  const { expenses, stats, setExpenses, setStats } = useExpenseStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, statsRes] = await Promise.all([
        expenseAPI.list({ limit: 10 }),
        expenseAPI.stats(),
      ])
      setExpenses(expensesRes.data.expenses)
      setStats(statsRes.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setLoading(true)
    await fetchData()
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Total Gasto</Text>
            <Text style={styles.statValue}>
              R$ {stats?.totalSpent?.toFixed(2) || '0.00'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Despesas</Text>
            <Text style={styles.statValue}>{stats?.count || 0}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Ticket Médio</Text>
            <Text style={styles.statValue}>
              R$ {stats?.count ? (stats.totalSpent / stats.count).toFixed(2) : '0.00'}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Despesas Recentes</Text>

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
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseAmount}>R$ {expense.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.expenseCategory}>{expense.category}</Text>
              <Text style={styles.expenseDate}>
                {new Date(expense.date).toLocaleDateString('pt-BR')}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  expenseCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#333',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  expenseCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 11,
    color: '#999',
  },
  emptyCard: {
    backgroundColor: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
})
