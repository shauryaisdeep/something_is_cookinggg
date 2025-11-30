# Stellar Arbitrage Bot Frontend

This is the frontend application for the Stellar Arbitrage Bot, built with Next.js 15 and React 19.

## Features

- **Real-time Trading Interface**: Live arbitrage opportunity detection and execution
- **Advanced Analytics**: Comprehensive profit tracking and performance metrics
- **Wallet Integration**: Seamless Stellar wallet connection and management
- **Responsive Design**: Modern, mobile-first UI with dark mode support
- **WebSocket Integration**: Real-time data streaming for live updates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: React 19
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API
- **Blockchain**: Stellar SDK
- **Real-time**: WebSocket connections
- **Icons**: React Icons
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── math-mode/         # Trading interface
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── components/            # React components
│   ├── ArbitrageBot.js    # Main trading bot component
│   ├── DEXOverview.js     # DEX information display
│   ├── ErrorBoundary.js   # Error handling
│   ├── ExecutionMonitor.js # Trade execution monitoring
│   ├── LoadingSpinner.js  # Loading states
│   ├── NotificationSystem.js # Toast notifications
│   ├── OpportunityCard.js # Arbitrage opportunity display
│   ├── ProfitTracker.js   # Profit tracking
│   ├── StatusIndicator.js # Connection status
│   └── WalletConnection.js # Wallet integration
├── contexts/              # React Context providers
│   ├── ArbitrageContext.js # Arbitrage state management
│   ├── RealtimeContext.js  # Real-time data context
│   └── WalletContext.js    # Wallet state management
└── utils/                 # Utility functions
    └── apiService.js      # API communication
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:5000/ws` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network | `testnet` |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | Stellar Horizon URL | `https://horizon-testnet.stellar.org` |

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker

```bash
docker build -t stellar-arbitrage-frontend .
docker run -p 3000:3000 stellar-arbitrage-frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.