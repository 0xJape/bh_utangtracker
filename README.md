# 💸 Utang Tracker

A modern, beautiful debt tracking system built for apartment-mates to manage shared expenses and settle debts. Track who owes whom, record transactions, and keep everyone's balance transparent.

![Modern UI](https://img.shields.io/badge/UI-Modern%20Gradient-8b5cf6)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Vite](https://img.shields.io/badge/Vite-7.2-646cff)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e)

## ✨ Features

### 🔐 **User Authentication**
- Password-protected login for each user
- Secure profile management
- Session persistence with localStorage

### 👤 **Profile Management**
- Upload profile pictures via URL
- Change display name
- Update password anytime
- Real-time avatar updates across the app

### 💰 **Transaction Management**
- **Single Mode**: Record individual transactions
  - Quick-add buttons: "I lent money" or "I borrowed money"
  - Select payer, recipient, amount, and description
  
- **Batch Mode**: Record multiple transactions at once
  - Batch Lending: Record when you lent to multiple people
  - Batch Paying: Pay back multiple people simultaneously
  - Perfect for splitting group expenses

### 📊 **Balance Tracking**
- Real-time balance calculation for all users
- Personal balance summary card
- Everyone's balance overview
- Clear visual indicators (positive/negative)
- Recent activity feed with transaction history

### 🎨 **Modern Design**
- Beautiful purple/pink gradient theme
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Clean, intuitive interface
- Poppins font for modern typography

## 🛠️ Tech Stack

### **Frontend**
- **React 18.3** - UI library
- **Vite 7.2** - Build tool and dev server (ultra-fast HMR)
- **CSS3** - Custom styling with gradients and animations

### **Backend**
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - Secure data access policies

### **Deployment**
- **Vercel** - Optimized for React/Vite deployments
- **GitHub** - Version control and CI/CD

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/0xJape/bh_utangtracker.git
cd bh_utangtracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL from `SETUP.md` in the SQL Editor
   - Run `add-profile-pic-column.sql` for profile picture support

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app!

## 📦 Project Structure

```
bh_utangtracker/
├── src/
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles
│   └── supabaseClient.js    # Supabase configuration
├── public/                  # Static assets
├── SETUP.md                 # Database setup instructions
├── add-profile-pic-column.sql  # Profile picture migration
├── .env                     # Environment variables (not in git)
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

## 🗄️ Database Schema

### `users` Table
```sql
- id (UUID, Primary Key)
- name (TEXT)
- password (TEXT)
- profile_pic (TEXT, nullable)
- created_at (TIMESTAMP)
```

### `transactions` Table
```sql
- id (UUID, Primary Key)
- from_user (UUID, Foreign Key → users)
- to_user (UUID, Foreign Key → users)
- amount (DECIMAL)
- description (TEXT, nullable)
- created_at (TIMESTAMP)
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub (already done!)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click "Deploy"

Your app will be live in minutes! 🎉

## 📱 Screenshots

### Login Screen
Beautiful gradient background with user profile cards

### Dashboard
- Personal balance card with gradient
- Everyone's balance overview
- Transaction recording with single/batch modes
- Recent activity feed

### Profile Management
- Profile picture upload
- Name and password updates
- Real-time updates across all views

## 🎯 Use Cases

- **Apartment-mates**: Track shared rent, utilities, and groceries
- **Friends**: Manage group trip expenses
- **Roommates**: Split bills and household purchases
- **Small teams**: Track petty cash and reimbursements

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Developer

Created with 💜 by [0xJape](https://github.com/0xJape)

---

**Built with React + Vite + Supabase** 🚀
