# CLAUDE.MD - Despesify v2.0

## Project Overview

**Despesify** is a Portuguese expense management web application with OCR capabilities, QR code reading, and Progressive Web App (PWA) support. It allows users to track expenses, scan invoices, and manage their personal finances.

**Primary Language**: Portuguese (PT)
**Type**: Full-stack web application
**Framework**: Next.js 13 (App Router)
**Database**: MariaDB
**Current Version**: 2.0.0

## Technology Stack

### Frontend
- **Next.js 13.5+** - React framework with App Router
- **React 18.2** - UI library
- **TypeScript 5.2** - Type safety
- **Tailwind CSS 3.3** - Utility-first CSS
- **Tremor React** - Dashboard components
- **Headless UI** - Accessible UI components

### Backend
- **Next.js API Routes** - Backend API
- **MariaDB** - Relational database (MySQL-compatible)
- **mysql2** - Database driver
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing

### Special Features
- **Tesseract.js** - OCR for invoice text extraction
- **jsQR** - QR code reading from camera
- **sharp** - Image processing
- **jsPDF** - PDF generation
- **html2canvas** - Screenshot/export functionality
- **pdfjs-dist** - PDF parsing
- **PWA Support** - Installable web app

## Project Structure

```
despesify/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── registro/
│   │   │   ├── me/
│   │   │   ├── change-password/
│   │   │   └── update-profile/
│   │   ├── despesas/             # Expense management
│   │   │   └── [id]/
│   │   ├── categorias/           # Categories management
│   │   ├── ocr/                  # OCR processing
│   │   ├── qr-reader/            # QR code reading
│   │   ├── pdf-to-image/         # PDF conversion
│   │   ├── nif-lookup/           # Portuguese tax ID lookup
│   │   └── sync-csv/             # CSV export for Streamlit
│   ├── components/               # Reusable React components
│   ├── despesas/                 # Expense pages
│   │   ├── nova/                 # New expense form
│   │   └── editar/[id]/          # Edit expense
│   ├── login/                    # Login page
│   ├── registro/                 # Registration page
│   ├── perfil/                   # User profile
│   ├── relatorio/                # Reports page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home/dashboard page
│   └── globals.css               # Global styles
├── lib/                          # Utility libraries
│   ├── db.ts                     # MariaDB connection
│   ├── auth.ts                   # Auth utilities
│   └── authMiddleware.ts         # JWT middleware
├── public/                       # Static assets
├── scripts/                      # Database initialization scripts
├── types/                        # TypeScript type definitions
└── [various .md docs]            # Extensive documentation
```

## Key Features

### 1. Multi-User Authentication
- Secure user registration with bcrypt password hashing
- JWT-based authentication
- Persistent sessions
- Profile management with password change

### 2. Expense Management
- Create, read, update, delete (CRUD) operations
- User-specific categories
- Multiple payment methods support
- VAT (IVA) tracking
- File attachments (images, PDFs)

### 3. OCR & Invoice Processing
- **Automatic OCR**: Runs on image upload
- **Manual OCR**: Button to reprocess invoices
- Extracts: amount, description, date, VAT
- Supports both images (JPG, PNG) and PDFs
- Portuguese language support (por.traineddata)

### 4. QR Code Reading
- Camera-based QR scanner
- Mobile-friendly implementation
- Portuguese AT (tax authority) invoice QR codes
- Company name lookup integration
- iOS Safari compatibility

### 5. PWA Support
- Installable on mobile devices
- Native app-like experience
- Offline-ready capabilities

### 6. Reports & Analytics
- Expense reports by date range
- Category breakdown
- Export to CSV
- PDF generation
- Streamlit integration (port 8502)

## Database Schema

### Main Tables

**users**
- `id` (Primary Key)
- `nome` (Name)
- `email` (Unique)
- `senha` (Password hash)
- `created_at`, `updated_at`

**despesas** (Expenses)
- `id` (Primary Key)
- `usuario_id` (Foreign Key → users)
- `descricao` (Description)
- `valor` (Amount)
- `data` (Date)
- `categoria` (Category)
- `metodo_pagamento` (Payment method)
- `iva` (VAT amount)
- `nota` (Notes)
- `created_at`, `updated_at`

**categorias** (Categories)
- `id` (Primary Key)
- `usuario_id` (Foreign Key → users)
- `nome` (Category name)
- `created_at`

**anexos** (Attachments)
- `id` (Primary Key)
- `despesa_id` (Foreign Key → despesas)
- `nome_arquivo` (Filename)
- `caminho` (File path)
- `tipo` (File type)
- `uploaded_at`

## Development Setup

### Environment Variables
Create `.env.local` from `.env.local.example`:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=despesify
JWT_SECRET=your-super-secret-jwt-key
```

### Running Locally

```bash
# Install dependencies
npm install

# Initialize database
node scripts/init-db.js

# Development server (port 8520)
npm run dev

# Production build
npm run build
npm run start
```

### Database Initialization
```bash
node scripts/init-db.js
```
This creates all necessary tables with proper schema.

## API Endpoints

### Authentication (Public)
- `POST /api/auth/registro` - Register new user
- `POST /api/auth/login` - Login (returns JWT)

### Authentication (Protected)
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/update-profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Expenses (Protected - Requires JWT)
- `GET /api/despesas` - List user expenses
- `POST /api/despesas` - Create expense (supports file upload)
- `GET /api/despesas/[id]` - Get single expense
- `PUT /api/despesas/[id]` - Update expense
- `DELETE /api/despesas/[id]` - Delete expense
- `GET /api/despesas/[id]/attachments` - Get expense attachments

### Categories (Protected)
- `GET /api/categorias` - List user categories
- `POST /api/categorias` - Create category

### OCR & Processing (Protected)
- `POST /api/ocr` - Process image/PDF with OCR
- `POST /api/qr-reader` - Read QR code from camera
- `POST /api/pdf-to-image` - Convert PDF to image

### Utilities (Protected)
- `POST /api/sync-csv` - Export to CSV for Streamlit
- `GET /api/nif-lookup` - Lookup Portuguese company by tax ID

## Authentication Flow

All protected routes require JWT token in headers:
```
Authorization: Bearer <token>
```

The JWT middleware (`lib/authMiddleware.ts`) extracts and verifies tokens, attaching `userId` to the request.

## Important Files

### Configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind customization
- `tsconfig.json` - TypeScript configuration
- `.env.local` - Environment variables (gitignored)

### Database
- `lib/db.ts` - MariaDB connection pool
- `scripts/init-db.js` - Database schema initialization

### Authentication
- `lib/auth.ts` - Password hashing, JWT generation
- `lib/authMiddleware.ts` - JWT verification middleware

### OCR Resources
- `eng.traineddata` - English Tesseract training data (23MB)
- `por.traineddata` - Portuguese Tesseract training data (15MB)

## Coding Conventions

### TypeScript
- Use TypeScript for all new files
- Define types in `/types` directory
- Avoid `any` - prefer proper typing

### API Routes
- Use `NextRequest`, `NextResponse` from `next/server`
- Validate user input
- Return consistent error formats:
  ```json
  { "error": "Error message" }
  ```
- Success responses include relevant data

### Components
- Functional components with hooks
- Server Components by default (Next.js 13+)
- Use `"use client"` only when necessary (interactivity, hooks)

### Database Queries
- Use parameterized queries (prevent SQL injection)
- Always use connection pool from `lib/db.ts`
- Close connections properly (`connection.release()`)

### Error Handling
- Try-catch blocks for async operations
- Log errors to console in development
- Return user-friendly error messages

## Common Tasks

### Adding a New API Endpoint
1. Create folder in `/app/api/[endpoint-name]/`
2. Create `route.ts` with GET, POST, PUT, DELETE handlers
3. Import `authMiddleware` for protected routes
4. Use `lib/db.ts` for database operations

### Adding a New Page
1. Create folder in `/app/[page-name]/`
2. Create `page.tsx` (Server Component default)
3. Use `layout.tsx` for shared layouts
4. Fetch data in Server Components or use API routes

### Database Migration
1. Update schema in `scripts/init-db.js`
2. Run manual ALTER statements or recreate tables
3. Test with development database first

## Known Issues & Quirks

### iOS Safari Camera Access
- QR reader has special handling for iOS Safari
- Uses `getUserMedia` with specific constraints
- File upload for QR disabled (camera only)

### OCR Performance
- Large PDFs can be slow to process
- Tesseract.js runs in browser (client-side)
- Training data files are large (23MB + 15MB)

### Port Configuration
- Default development port: **8520**
- Streamlit integration expects port: **8502**
- Can be changed in `package.json` scripts

### Database Connection
- Uses connection pooling
- MariaDB >= 10.6 recommended
- MySQL 8+ also compatible

## Deployment

### Production Server
- Domain: `despesify.cafemartins.pt`
- Local IP: `192.168.1.176:8520`
- Requires Nginx reverse proxy with SSL
- See `DEPLOYMENT.md` for full instructions

### Building for Production
```bash
npm run build
npm run start
```

### Environment
- Set `NODE_ENV=production`
- Use secure `JWT_SECRET`
- Configure database connection for production
- Enable HTTPS

## Documentation Files

The project includes extensive documentation:
- `README.md` - Main project overview
- `SETUP.md` - Detailed setup guide
- `ARCHITECTURE.md` - System architecture (may be outdated)
- `QUICKSTART.md` - Quick start guide
- `DEPLOYMENT.md` - Deployment instructions
- `BUILD_APK.md` - APK building (Capacitor)
- `QR_READER_IMPLEMENTATION.md` - QR code feature details
- `ROADMAP.md` - Future features
- `COMMANDS.md` - Useful commands

## Dependencies Notes

### Required
- Node.js >= 18.0.0
- MariaDB >= 10.6 or MySQL >= 8.0
- npm or yarn

### Large Files in Repo
- `eng.traineddata` (23.4 MB) - English OCR
- `por.traineddata` (15.3 MB) - Portuguese OCR
- Test images: `sagres.jpg`, `teste.jpg`, `resultado_sagres.png`

## AI Assistant Guidelines

When working with this codebase:

1. **Language**: Respond in Portuguese when appropriate, especially for user-facing content
2. **Database**: Always use parameterized queries with mysql2
3. **Authentication**: Check for JWT token on protected routes
4. **File Uploads**: Use proper multipart/form-data handling
5. **OCR**: Remember Tesseract.js is client-side, can be slow
6. **Types**: Prefer TypeScript, define proper types
7. **Testing**: Test database connections and auth flows
8. **Security**: Validate inputs, hash passwords, sanitize data
9. **Mobile**: Consider iOS Safari compatibility for camera features
10. **PWA**: Maintain service worker and manifest for PWA support

## Recent Changes

- ✅ iOS Safari camera support for QR scanner
- ✅ PWA support for native app installation
- ✅ Disabled QR file upload (camera only)
- ✅ Company name lookup for camera QR scanner
- ✅ Mobile responsiveness improvements
- ✅ Fixed API body reading errors

## Current Branch

Working on: `claude/update-claude-md-017GjxNj9E1h87bJRLnnNv9L`

---

**Last Updated**: 2025-12-11
**Version**: 2.0.0
**Maintained by**: Despesify Team
