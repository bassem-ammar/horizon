# Horizons World Trade Connections - MongoDB Backend

A professional Node.js/Express backend API with MongoDB for the Horizons World Trade Connections import/export platform.

## 🚀 Features

- **MongoDB Database** - Modern NoSQL database
- **Mongoose ODM** - Elegant MongoDB object modeling
- **JWT Authentication** - Secure admin authentication
- **Professional Models** - Well-structured data models
- **Automatic Seeding** - Sample data included
- **Windows Friendly** - No build tools required

## 📁 Project Structure

\`\`\`
backend/
├── models/               # Mongoose models
│   ├── AdminUser.js
│   ├── Product.js
│   ├── ContactSubmission.js
│   └── QuoteRequest.js
├── controllers/          # Business logic controllers
│   ├── authController.js
│   ├── productController.js
│   ├── contactController.js
│   ├── quoteController.js
│   └── adminController.js
├── routes/              # API route definitions
│   ├── auth.js
│   ├── products.js
│   ├── contact.js
│   ├── quotes.js
│   └── admin.js
├── middleware/          # Custom middleware
│   └── auth.js
├── scripts/            # Database scripts
│   └── seedDatabase.js
├── server.js           # Main server file
├── package.json
└── .env
\`\`\`

## 🛠️ Installation & Setup

### 1. Install MongoDB

**Option A: MongoDB Community Server (Recommended)**
- Download from: https://www.mongodb.com/try/download/community
- Install and start MongoDB service

**Option B: MongoDB Atlas (Cloud)**
- Create free account at: https://www.mongodb.com/atlas
- Get connection string

### 2. Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 3. Environment Configuration

Update `.env` file:

\`\`\`env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/horizons_trade

# For MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/horizons_trade

JWT_SECRET=horizons-world-trade-secret-key-2024
PORT=5000
NODE_ENV=development
\`\`\`

### 4. Seed Database

\`\`\`bash
npm run seed
\`\`\`

### 5. Start Server

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm start
\`\`\`

## 🎯 Quick Start

1. **Install MongoDB** (if not installed)
2. **Run these commands:**

\`\`\`bash
cd backend
npm install
npm run seed
npm run dev
\`\`\`

3. **Test API:** Visit `/api/health`
4. **Admin Login:** `admin@horizonswtc.com` / `admin123`

## 📊 Database Models

### AdminUser
- Email, password (hashed), name
- Role-based access control
- Active/inactive status

### Product
- Name, description, category, price
- Image URL, specifications
- Stock quantity, sales count
- Featured products support

### ContactSubmission
- Customer contact information
- Message and status tracking
- Admin notes support

### QuoteRequest
- Detailed quote information
- Product category and details
- Status tracking and pricing
- Delivery location and requirements

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Create admin user
- `GET /api/auth/verify` - Verify JWT token

### Products
- `GET /api/products` - Get all products (with category filter)
- `GET /api/products/:id` - Get product by ID

### Contact
- `POST /api/contact` - Submit contact form

### Quotes
- `POST /api/quote` - Submit quote request

### Admin (Protected Routes)
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product (soft delete)
- `GET /api/admin/contacts` - Get contact submissions
- `PUT /api/admin/contacts/:id` - Update contact status
- `GET /api/admin/quotes` - Get quote requests
- `PUT /api/admin/quotes/:id` - Update quote status
- `GET /api/admin/analytics` - Get analytics data

## 🔐 Authentication

JWT tokens are required for admin routes:

\`\`\`javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
\`\`\`

## 🗄️ Database Features

- **Automatic Indexing** - Optimized queries
- **Data Validation** - Mongoose schema validation
- **Soft Deletes** - Products marked inactive instead of deleted
- **Timestamps** - Automatic createdAt/updatedAt
- **Password Hashing** - Bcrypt for admin passwords

## 🚀 Running Both Frontend & Backend

### Terminal 1: Frontend
\`\`\`bash
npm run dev
\`\`\`

### Terminal 2: Backend
\`\`\`bash
cd backend
npm run dev
\`\`\`

Visit:
- **Frontend:** `http://localhost:3000`
- **Backend API:** `/api/health`

## 🔧 MongoDB Connection Options

### Local MongoDB
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/horizons_trade
\`\`\`

### MongoDB Atlas (Cloud)
\`\`\`env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/horizons_trade
\`\`\`

## 📈 Sample Data

The seed script creates:
- **1 Admin User** (admin@horizonswtc.com / admin123)
- **8 Products** (4 alimentary, 4 gas/oil)
- **3 Contact Submissions**
- **3 Quote Requests**

## 🔄 Re-seeding Database

To reset database with fresh sample data:

\`\`\`bash
npm run seed
\`\`\`

## 📝 License

MIT License - see LICENSE file for details.
\`\`\`

This is the complete, updated codebase for the Horizons World Trade Connections platform. All files are included with the latest fixes for:

✅ **Contact status updates working**
✅ **Product CRUD operations working** 
✅ **Image upload functionality**
✅ **MongoDB backend with proper models**
✅ **JWT authentication**
✅ **Complete admin dashboard**
✅ **Multi-language support**
✅ **Responsive design**

## 🚀 **Setup Instructions:**

1. **Extract all files** to your project directory
2. **Install dependencies**: `npm install` (root) and `cd backend && npm install`
3. **Setup MongoDB** (local or Atlas)
4. **Configure environment** variables in `.env` files
5. **Seed database**: `cd backend && npm run seed`
6. **Start servers**: `npm run dev` (frontend) and `cd backend && npm run dev` (backend)

**Admin Login**: `admin@horizonswtc.com` / `admin123`

The application is now fully functional with all features working! 🎉
