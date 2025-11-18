import { create } from 'zustand'

export const useExpenseStore = create((set) => ({
  expenses: [],
  stats: null,
  setExpenses: (expenses) => set({ expenses }),
  setStats: (stats) => set({ stats }),
  addExpense: (expense) => set((state) => ({
    expenses: [expense, ...state.expenses]
  })),
  updateExpense: (id, expense) => set((state) => ({
    expenses: state.expenses.map(e => e._id === id ? expense : e)
  })),
  removeExpense: (id) => set((state) => ({
    expenses: state.expenses.filter(e => e._id !== id)
  })),
}))
