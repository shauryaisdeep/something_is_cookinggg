# 🤖 Stellar Arbitrage Bot - Complete End-to-End Trading System

A comprehensive arbitrage trading bot for the Stellar DEX with real-time analysis, smart contract execution, and advanced risk management.

## 🌟 Features

### 🔍 **Real-time Analysis**
- Advanced arbitrage detection with 3-step loop analysis
- Live market data from Stellar DEX
- Profit optimization algorithms
- Liquidity analysis and validation

### ⚡ **Smart Contract Execution**
- Automated trade execution via Soroban smart contracts
- Slippage protection and risk management
- Multi-hop arbitrage with gas optimization
- Transaction monitoring and status tracking

### 📊 **Advanced Dashboard**
- Real-time performance metrics
- Interactive trading interface
- Profit tracking and analytics
- Trade history and statistics

### 🛡️ **Risk Management**
- Built-in risk controls and validation
- Balance verification before execution
- Slippage protection mechanisms
- Opportunity expiration checks

### 💼 **Wallet Integration**
- Seamless Rabet wallet integration
- Secure transaction signing
- Balance monitoring
- Multi-asset support

## 🏗️ Architecture

### **Backend Services**
- **TopAssetsService**: Discovers top 20 assets and validates trading pairs
- **FastArbitrageService**: Performs fast arbitrage analysis with graph theory
- **SorobanArbitrageService**: Handles smart contract execution
- **WebSocketService**: Real-time data streaming
- **RealtimeCacheService**: Smart caching with compression

### **Frontend Components**
- **ArbitrageBot**: Main trading interface
- **OpportunityCard**: Displays arbitrage opportunities
- **ExecutionMonitor**: Tracks trade execution
- **ProfitTracker**: Performance analytics
- **WalletConnection**: Wallet integration

### **Smart Contracts**
- **Arbitrage Contract**: Multi-hop arbitrage execution
- **Slippage Protection**: Built-in risk management
- **Gas Optimization**: Efficient transaction execution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB (optional, for data persistence)
- Rabet wallet extension
- Stellar testnet account

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/stellar-arbitrage-bot.git
cd stellar-arbitrage-bot
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000/ws

## 📁 Project Structure

```
web3-final/
├── backend/                          # Node.js/Express backend
│   ├── services/                     # Core business logic
│   │   ├── topAssetsService.js       # Top 20 assets & valid pairs
│   │   ├── fastArbitrageService.js   # Fast arbitrage analysis
│   │   ├── sorobanArbitrageService.js # Contract execution
│   │   ├── stellarXRecreator.js      # StellarX data recreation
│   │   ├── realtimeCacheService.js   # Real-time data caching
│   │   └── websocketService.js       # WebSocket management
│   ├── controllers/                  # API route handlers
│   ├── routes/                       # API endpoint definitions
│   ├── models/                       # Database models
│   ├── utils/                        # Utilities
│   └── index.js                      # Main server entry point
├── frontend/                         # Next.js React frontend
│   ├── pages/                        # Next.js pages
│   │   ├── math-mode.js              # Main arbitrage bot interface
│   │   ├── dashboard.js              # Trading dashboard
│   │   └── _app.js                   # App wrapper
│   ├── components/                   # Reusable UI components
│   ├── contexts/                     # React context providers
│   └── utils/                        # Frontend utilities
├── contracts/                        # Soroban smart contracts
│   └── soroban/
│       ├── arbitrage.rs              # Multi-hop arbitrage contract
│       ├── Cargo.toml                # Rust dependencies
│       └── src/
│           ├── lib.rs                # Contract implementation
│           └── test.rs                # Contract tests
└── config/                           # Configuration files
    ├── docker-compose.yml            # Docker setup
    ├── stellarConfig.js              # Stellar network config
    └── aiConfig.py                   # AI configuration (unused)
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stellar-arbitrage-bot
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ARBITRAGE_CONTRACT_ADDRESS=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E
JWT_SECRET=your-super-secret-jwt-key
LOG_LEVEL=info
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

## 🎯 Usage Guide

### 1. **Connect Wallet**
- Install Rabet wallet extension
- Connect to Stellar testnet
- Fund your wallet with test XLM

### 2. **Discover Opportunities**
- Navigate to Math Mode (`/math-mode`)
- Click "Run Complete Analysis"
- Review discovered arbitrage opportunities

### 3. **Execute Trades**
- Select a profitable opportunity
- Click "Execute Trade"
- Sign transaction in Rabet wallet
- Monitor execution progress

### 4. **Track Performance**
- View dashboard for performance metrics
- Monitor profit/loss in real-time
- Review trade history and statistics

## 📊 API Endpoints

### **Top Assets**
- `GET /api/top-assets/dex-data` - Get comprehensive DEX data
- `GET /api/top-assets/assets` - Get top 20 assets
- `GET /api/top-assets/pairs` - Get valid trading pairs

### **Arbitrage Analysis**
- `POST /api/fast-arbitrage/run` - Run arbitrage analysis
- `GET /api/fast-arbitrage/opportunities` - Get cached opportunities
- `POST /api/fast-arbitrage/validate` - Validate opportunity

### **Trade Execution**
- `POST /api/soroban/build-transaction` - Build arbitrage transaction
- `POST /api/soroban/submit-transaction` - Submit signed transaction
- `GET /api/soroban/monitor/:txHash` - Monitor transaction

### **Real-time Data**
- `GET /api/realtime/market-data/:pair` - Get market data
- `GET /api/realtime/arbitrage-opportunities` - Get live opportunities
- `WS /ws` - WebSocket for real-time updates

## 🛡️ Security Features

### **Risk Management**
- Pre-execution validation
- Slippage protection (1% max)
- Balance verification
- Opportunity expiration checks
- Gas fee estimation

### **Smart Contract Safety**
- Input validation
- Profit threshold enforcement
- Slippage protection
- Error handling and rollback

### **API Security**
- Rate limiting
- CORS protection
- Input sanitization
- Error handling

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Smart Contract Tests
```bash
cd contracts/soroban
cargo test
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.yml --profile production up -d
```

## 📈 Performance Optimizations

### **Caching Strategy**
- Top assets: 30 minutes
- Liquidity data: 5 minutes
- Order books: 1 minute
- Arbitrage results: 2 minutes

### **Rate Limiting**
- API: 100 requests/minute
- Arbitrage analysis: 10 requests/5 minutes
- Trade execution: 5 requests/minute

### **Data Prioritization**
- Priority assets: XLM, USDC, USDT, BTC, ETH
- Minimum liquidity: 1000 units
- Maximum slippage: 1%

## 🔍 Monitoring

### **Health Checks**
- `GET /health` - Server health
- `GET /api/top-assets/health` - Service health
- `GET /api/realtime/system-status` - System status

### **Metrics**
- Cache hit rates
- API response times
- WebSocket connections
- Trade success rates

## 🚨 Troubleshooting

### Common Issues

#### **Wallet Connection Failed**
- Ensure Rabet extension is installed
- Check network connection
- Verify testnet configuration

#### **No Opportunities Found**
- Check market liquidity
- Verify asset pairs
- Review profit thresholds

#### **Transaction Failed**
- Verify wallet balance
- Check gas fees
- Review slippage settings

### **Logs**
```bash
# Backend logs
cd backend
npm run logs

# Docker logs
docker-compose logs -f backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational purposes only. Trading cryptocurrencies involves substantial risk of loss. The authors are not responsible for any financial losses incurred through the use of this software.

## 🙏 Acknowledgments

- Stellar Development Foundation
- Soroban smart contract platform
- Rabet wallet team
- Open source community

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-username/stellar-arbitrage-bot/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/stellar-arbitrage-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/stellar-arbitrage-bot/discussions)

---

**Built with ❤️ for the Stellar ecosystem**
