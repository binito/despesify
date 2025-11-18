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

export default function StatsScreen() {
  const { stats, setStats } = useExpenseStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await expenseAPI.stats()
      setStats(res.data)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setLoading(true)
    await fetchStats()
  }

  if (!stats || !stats.byCategory || Object.keys(stats.byCategory).length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Estatísticas</Text>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>Nenhuma despesa registrada</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    )
  }

  const categoryLabels = Object.keys(stats.byCategory)
  const categoryData = Object.values(stats.byCategory)

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Estatísticas</Text>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Total Gasto</Text>
            <Text style={styles.statValue}>R$ {stats.totalSpent.toFixed(2)}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Número de Despesas</Text>
            <Text style={styles.statValue}>{stats.count}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Ticket Médio</Text>
            <Text style={styles.statValue}>
              R$ {stats.count ? (stats.totalSpent / stats.count).toFixed(2) : '0.00'}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Por Categoria</Text>

      {categoryLabels.map((category, idx) => (
        <Card key={category} style={styles.categoryCard}>
          <Card.Content>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.categoryAmount}>R$ {categoryData[idx].toFixed(2)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(categoryData[idx] / Math.max(...categoryData)) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.percentage}>
              {((categoryData[idx] / stats.totalSpent) * 100).toFixed(1)}% do total
            </Text>
          </Card.Content>
        </Card>
      ))}
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
  categoryCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 11,
    color: '#666',
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
