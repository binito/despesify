import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getStats
} from '../controllers/expenseController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/stats', getStats);
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
