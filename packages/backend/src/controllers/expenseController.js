import Expense from '../models/Expense.js';

export const createExpense = async (req, res) => {
  const { description, amount, category, date, paymentMethod, notes, tags } = req.body;
  const userId = req.user.userId;

  if (!description || !amount) {
    return res.status(400).json({ error: 'Descrição e valor são obrigatórios' });
  }

  try {
    const expense = new Expense({
      userId,
      description,
      amount,
      category: category || 'Outro',
      date: date ? new Date(date) : Date.now(),
      paymentMethod: paymentMethod || 'Outro',
      notes: notes || '',
      tags: tags || []
    });

    await expense.save();

    res.status(201).json({
      message: 'Despesa criada com sucesso',
      expense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpenses = async (req, res) => {
  const userId = req.user.userId;
  const { category, startDate, endDate, limit = 50, skip = 0 } = req.query;

  try {
    const query = { userId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const { description, amount, category, date, paymentMethod, notes, tags } = req.body;

  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId },
      {
        description,
        amount,
        category,
        date: date ? new Date(date) : undefined,
        paymentMethod,
        notes,
        tags,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json({
      message: 'Despesa atualizada com sucesso',
      expense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const expense = await Expense.findOneAndDelete({ _id: id, userId });

    if (!expense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json({ message: 'Despesa deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  const userId = req.user.userId;
  const { startDate, endDate } = req.query;

  try {
    const query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query);

    const stats = {
      totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
      byCategory: {},
      byPaymentMethod: {},
      count: expenses.length
    };

    expenses.forEach(expense => {
      stats.byCategory[expense.category] = (stats.byCategory[expense.category] || 0) + expense.amount;
      stats.byPaymentMethod[expense.paymentMethod] = (stats.byPaymentMethod[expense.paymentMethod] || 0) + expense.amount;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
