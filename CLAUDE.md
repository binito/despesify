# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Despesify v2.0 is a personal expense management web application built with Next.js 13+ (App Router), featuring OCR and QR code reading capabilities for Portuguese invoices (Autoridade Tributária). It uses MariaDB for data persistence and JWT for authentication. The application includes PWA support for native-like installation on mobile devices.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (runs on port 8520)
npm run dev

# Production build
npm run build

# Production server (runs on port 8520)
npm run start

# Linting
npm run lint

# Initialize/reset database
node scripts/init-db.js
```

## Database Setup

Before first run, configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your database credentials
```

Then initialize the database schema:
```bash
node scripts/init-db.js
```

The application will auto-create tables on startup if they don't exist (see `lib/db.ts`).

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8520

# Database Configuration (MariaDB/MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=despesify
DB_PORT=3306

# JWT Authentication
JWT_SECRET=your_secure_random_secret_key_here

# File Upload Configuration
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# OCR Configuration
TESSERACT_LANG=por+eng  # Portuguese + English

# Streamlit Integration (Optional)
STREAMLIT_CSV_PATH=./data/expenses.csv
```

**Important Notes:**
- `JWT_SECRET` must be a long, random string in production (use `openssl rand -base64 32`)
- Database credentials should match your MariaDB installation
- `NEXT_PUBLIC_API_URL` should point to your production domain in production

## Architecture

This is a **Next.js 13+ App Router** application with the following structure:

- `app/` - Next.js App Router pages and API routes
  - `app/api/` - API route handlers (Next.js API routes pattern)
  - `app/despesas/` - Expense management pages
  - `app/login/`, `app/registro/` - Auth pages
  - `app/relatorio/` - Reports page
  - `app/components/` - React components
- `lib/` - Shared utilities
  - `lib/db.ts` - MariaDB connection pool and database initialization
  - `lib/auth.ts` - Authentication utilities (JWT)
  - `lib/authMiddleware.ts` - JWT middleware for protected routes
- `scripts/` - Utility scripts
  - `scripts/init-db.js` - Database initialization
  - `scripts/leitor_qr_faturas_at.py` - Python QR code reader for Portuguese invoices
- `public/` - Static assets
  - `public/uploads/` - User-uploaded files (receipts, invoices)
  - `public/manifest.json` - PWA manifest
  - `public/sw.js` - Service worker for PWA
  - `public/icon-*.png` - PWA icons (72, 96, 128, 144, 152, 192, 384, 512)

### Key Technical Details

**Database:** MariaDB (MySQL2 driver)
- Connection pooling configured in `lib/db.ts`
- Schema auto-creates on app startup
- Main tables: `users`, `expenses`, `categories`, `invoice_attachments`

**Authentication:** JWT-based
- Tokens generated on login/registration
- Middleware in `lib/authMiddleware.ts` validates tokens
- Password hashing with bcryptjs

**File Uploads:** Stored in `public/uploads/`
- Supports images (JPG, PNG) and PDFs
- Max file size: 10MB (configurable in `.env.local`)

## Progressive Web App (PWA)

Despesify is a full PWA that can be installed on mobile devices and desktops:

### Features
- **Offline Support**: Service worker (`public/sw.js`) registered in `app/layout.tsx`
- **Native Installation**: Can be added to home screen on iOS/Android
- **App Shortcuts**: Quick action to add new expense from home screen
- **Mobile-Optimized**: Apple-specific meta tags for iOS Safari compatibility
- **Responsive Icons**: Multiple icon sizes (72px to 512px) for all devices

### PWA Configuration
- **Manifest**: `public/manifest.json` defines app metadata
- **Theme Color**: #3B82F6 (blue)
- **Display Mode**: Standalone (full-screen, no browser UI)
- **Orientation**: Portrait-primary
- **Categories**: Finance, Productivity

### Camera Integration
The PWA includes camera access for QR code scanning:
- **iOS Safari**: Special viewport configuration for camera permissions
- **Android**: Standard camera API with fallback handling
- Implemented in: `app/relatorio/page.tsx`

### Installation
Users can install the app via:
- iOS Safari: Share button → "Add to Home Screen"
- Android Chrome: Menu → "Install App" or browser prompt
- Desktop: Install icon in address bar

## Invoice Processing Features

### OCR (Tesseract.js)
- Endpoint: `POST /api/ocr`
- Automatically extracts: amounts, dates, descriptions, VAT
- Runs client-side with Tesseract.js
- Languages: Portuguese + English (`por+eng`)

### QR Code Reading (Portuguese AT Invoices)
- **Camera Scanning Only**: Uses device camera to scan QR codes in real-time
- **No File Upload**: File upload for QR reading has been disabled; only camera-based scanning is supported
- Backend Endpoint: `POST /api/qr-reader`
- Python script: `scripts/leitor_qr_faturas_at.py`
- Dependencies: Python 3.8+, OpenCV, pyzbar, Pillow
- Extracts structured data: NIF, ATCUD, tax amounts, invoice number
- Returns JSON with parsed fields
- **iOS Safari Compatibility**: Special optimizations for iOS camera access

**Python Dependencies Installation:**
```bash
# System packages (Linux/Raspberry Pi)
sudo apt-get install -y python3 python3-pip python3-opencv libzbar0

# Python packages
pip3 install opencv-python pyzbar Pillow
```

### NIF Lookup API
- Endpoint: `POST /api/nif-lookup`
- Fetches company names from `contribuinte.pt`
- Auto-fills company names from QR-extracted NIFs

## API Routes Pattern

All API routes follow Next.js 13+ App Router conventions:

```typescript
// app/api/[route]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Handler logic
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Handler logic
  return NextResponse.json({ data })
}
```

### Protected Routes
Use `authMiddleware` to verify JWT tokens:

```typescript
import { authMiddleware } from '@/lib/authMiddleware'

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const userId = authResult.userId
  // Route logic with authenticated userId
}
```

## Database Schema

The database uses MariaDB/MySQL with the following tables:

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### Categories Table
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Expenses Table
```sql
CREATE TABLE expenses (
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
  -- Portuguese AT Invoice fields
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
```

### Invoice Attachments Table
```sql
CREATE TABLE invoice_attachments (
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
```

**Important Notes:**
- The JSON columns (`qr_data`, `ocr_data`) store raw extracted data for reference
- When creating/updating expenses, preserve all fields
- QR code fields are specifically for Portuguese AT invoices

## Common Patterns

### Database Queries
```typescript
import { query, getConnection } from '@/lib/db'

// Simple query
const results = await query('SELECT * FROM expenses WHERE user_id = ?', [userId])

// Transaction
const conn = await getConnection()
try {
  await conn.beginTransaction()
  await conn.execute('INSERT INTO ...', values)
  await conn.commit()
} catch (error) {
  await conn.rollback()
  throw error
} finally {
  await conn.release()
}
```

### File Uploads
Files are uploaded via `multipart/form-data` and stored in `public/uploads/`. The API routes handle file writes directly - check `app/api/despesas/route.ts` for the pattern.

## Troubleshooting

### Camera Access Issues

**iOS Safari:**
- Ensure HTTPS is enabled (camera requires secure context)
- Check browser permissions: Settings → Safari → Camera
- Clear browser cache if camera permission was previously denied
- Viewport settings in `app/layout.tsx` are optimized for iOS

**Android:**
- Grant camera permissions when prompted
- Check app permissions in system settings if camera fails
- Some older browsers may not support camera API

### Database Connection Errors

**"Connection refused" or "Access denied":**
```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Verify credentials in .env.local match database user
mysql -u root -p
```

**"Table doesn't exist":**
```bash
# Run database initialization
node scripts/init-db.js
```

### Python QR Reader Issues

**"Module not found" errors:**
```bash
# Reinstall Python dependencies
pip3 install opencv-python pyzbar Pillow

# Verify system packages (Linux/Raspberry Pi)
sudo apt-get install -y python3-opencv libzbar0
```

**QR code not detected:**
- Ensure good lighting and focus
- QR code must be Portuguese AT format (ATCUD-compliant)
- Try different angles or distances

### Port Already in Use

```bash
# Find process using port 8520
lsof -i :8520

# Kill the process
kill -9 <PID>

# Or use a different port in package.json
```

### File Upload Failures

**Permission denied:**
```bash
# Create uploads directory with correct permissions
mkdir -p public/uploads
chmod 755 public/uploads
```

**File too large:**
- Check `MAX_FILE_SIZE` in `.env.local` (default 10MB)
- Adjust Nginx/web server upload limits if behind reverse proxy

### JWT Authentication Errors

**"Invalid token" or "Token expired":**
- Ensure `JWT_SECRET` in `.env.local` matches across deployments
- Token expiration is set in `lib/auth.ts`
- Clear browser localStorage and re-login

## Important Notes

1. **Port Configuration:** Application runs on port 8520 (not default 3000). Configured in package.json scripts.

2. **Python Integration:** The QR reader spawns a Python subprocess. Ensure Python 3 and dependencies are installed system-wide.

3. **Outdated Documentation:** The files `ARCHITECTURE.md`, `COMMANDS.md` describe a different (monorepo) architecture that doesn't match this codebase. Ignore those - this is a standard Next.js monolithic application.

4. **Path Aliases:** Use `@/` prefix to import from project root (configured in `tsconfig.json`).

5. **CSV Export:** The `/api/sync-csv` endpoint exports data to CSV for Streamlit integration (optional feature).

6. **Camera-Only QR Scanning:** File upload for QR code reading has been removed. Only camera-based real-time scanning is supported.

## Testing QR Reader

```bash
# Test Python script directly
python3 scripts/leitor_qr_faturas_at.py <path-to-invoice-image.jpg>

# Check dependencies
bash scripts/test-qr.sh
```

## Deployment Notes

- Production domain: `despesify.cafemartins.pt`
- Uses Nginx reverse proxy with SSL
- Ensure Python and system dependencies are installed on production server
- Create `public/uploads/` directory with write permissions
- Configure environment variables in `.env.local` with production values
- Use a strong `JWT_SECRET` (generate with `openssl rand -base64 32`)
- PWA requires HTTPS for full functionality (service worker, camera access)
- Test camera permissions on target iOS/Android devices after deployment
