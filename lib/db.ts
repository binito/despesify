import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'despesify',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
})

export async function getConnection() {
  return await pool.getConnection()
}

export async function query(sql: string, values?: any[]) {
  const connection = await getConnection()
  try {
    const [results] = await connection.execute(sql, values)
    return results
  } finally {
    await connection.release()
  }
}

export async function initDB() {
  const conn = await getConnection()
  try {
    // Create users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create categories table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create expenses table
    await conn.execute(`
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
        nif_emitente VARCHAR(20),
        nif_adquirente VARCHAR(20),
        numero_documento VARCHAR(100),
        atcud VARCHAR(100),
        base_tributavel DECIMAL(10, 2),
        qr_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX (user_id, expense_date),
        INDEX (user_id, category_id)
      )
    `)

    // Create invoice attachments table
    await conn.execute(`
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

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  } finally {
    await conn.release()
  }
}

export default pool
