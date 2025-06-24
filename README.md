# Stock Analyzer - Production-Ready Trading Platform

A comprehensive stock trading application built with React, TypeScript, and Supabase. Features real-time stock data, portfolio management, 3D visualizations, and a complete trading system.

## Features

### 🔐 Authentication System
- Complete user authentication with Supabase
- Login, signup, password reset functionality
- Email confirmation flow
- Profile setup with investment preferences

### 📊 Dashboard & Portfolio Management
- Real-time portfolio tracking
- Net worth history with interactive charts
- V-Cash balance management (virtual trading currency)
- Portfolio holdings with profit/loss calculations

### 📈 Trading System
- Real-time stock quotes from Finnhub API
- Buy/sell functionality with virtual currency
- Transaction history tracking
- Watchlist management

### 📊 Data Visualization
- Dual-mode charts (2D Chart.js and 3D Three.js)
- Interactive price charts with technical indicators
- Real-time data updates
- Professional trading interface

### 🎨 UI/UX Features
- Beautiful glassmorphism design
- 3D animations and micro-interactions
- Responsive design for all devices
- Dark theme with animated backgrounds

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Chart.js, Three.js, React Three Fiber
- **Icons**: Lucide React
- **API**: Finnhub (stock data), Yahoo Finance (historical data)

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://aqlrsigkhzmitknjvbsj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbHJzaWdraHptaXRrbmp2YnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Njg3MzgsImV4cCI6MjA2NTE0NDczOH0.V1cCxF-eodJKpGFooQ_cUmiK7j_UpUpooqRmNLKQrJY
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Database Schema

The application uses Supabase with the following main tables:

- `profiles` - User profile information
- `user_portfolios` - Portfolio data with V-Cash balance
- `user_stocks` - User stock holdings
- `transactions` - Trading transaction history
- `net_worth_history` - Daily net worth tracking
- `watchlist` - User stock watchlists
- `referrals` - Referral system for bonuses

## API Integration

### Finnhub API
- Real-time stock quotes
- Company profiles and news
- Stock search functionality
- Multiple API keys for rate limiting

### Yahoo Finance API
- Historical stock data
- Chart data for visualizations
- Technical indicators

## Key Features

### Virtual Trading
- Start with $5,000 V-Cash
- Real-time stock prices
- Portfolio tracking and analytics
- Transaction history

### Advanced Charts
- Switch between 2D and 3D chart modes
- Technical indicators (RSI, SMA)
- Interactive price charts
- Volume analysis

### User Experience
- Smooth animations and transitions
- Responsive design
- Real-time data updates
- Professional trading interface

## Development

### Project Structure
```
src/
├── auth/           # Authentication components
├── components/     # UI components
├── lib/           # API services and utilities
├── App.tsx        # Main application
└── main.tsx       # Entry point
```

### Key Components
- `Dashboard` - Main dashboard with portfolio overview
- `StockMarket` - Stock browsing and trading
- `TradingModal` - Buy/sell interface
- `DualModeChart` - 2D/3D chart switching
- `ProfileSetup` - User onboarding

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and development purposes.

## Notes

- API keys are included for development purposes
- Replace with production keys before deployment
- Ensure proper rate limiting for API calls
- Test all trading functionality thoroughly