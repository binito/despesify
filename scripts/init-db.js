#!/usr/bin/env node

/**
 * Script para inicializar o banco de dados MariaDB
 * Uso: node scripts/init-db.js
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function initDatabase() {
  let connection

  try {
    console.log('Conectando ao MariaDB...')

    // Conectar sem especificar banco de dados
    const pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
    })

    connection = await pool.getConnection()

    // Criar banco de dados
    const dbName = process.env.DB_NAME || 'despesify'
    console.log(`Criando banco de dados '${dbName}'...`)
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`)
    console.log('✓ Banco de dados criado')

    // Selecionar banco de dados
    await connection.execute(`USE ${dbName}`)

    // Criar tabelas
    console.log('Criando tabelas...')

    // Tabela de utilizadores
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Tabela users criada')

    // Tabela de categorias
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY user_category (user_id, name)
      )
    `)
    console.log('✓ Tabela categories criada')

    // Tabela de despesas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT,
        description VARCHAR(500),
        amount DECIMAL(10, 2) NOT NULL,
        expense_date DATE NOT NULL,
        payment_method VARCHAR(50),
        notes TEXT,
        vat_percentage DECIMAL(5, 2),
        vat_amount DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX (user_id, expense_date),
        INDEX (user_id, category_id)
      )
    `)
    console.log('✓ Tabela expenses criada')

    // Tabela de anexos de faturas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invoice_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expense_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size INT,
        ocr_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
      )
    `)
    console.log('✓ Tabela invoice_attachments criada')

    console.log('\n✅ Banco de dados inicializado com sucesso!')
    console.log(`\nCredenciais de conexão:`)
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`)
    console.log(`Utilizador: ${process.env.DB_USER || 'root'}`)
    console.log(`Banco: ${dbName}`)

    await connection.release()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erro ao inicializar banco de dados:')
    console.error(error.message)
    if (connection) await connection.release()
    process.exit(1)
  }
}

initDatabase()
