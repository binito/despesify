import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: 0
  },
  category: {
    type: String,
    enum: ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Entretenimento', 'Moradia', 'Utilidades', 'Outro'],
    default: 'Outro'
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Outro'],
    default: 'Outro'
  },
  receipt: {
    type: String,
    default: null // URL da imagem do recibo
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Expense', expenseSchema);
