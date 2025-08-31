# Payvia Backend API

A comprehensive backend API for Payvia - the USDC utility app that makes USDC useful in everyday life.

## 🚀 Features

- **USDC Wallet Management**: Secure wallet creation and management
- **Bill Payments**: Pay utilities, internet, airtime, and other bills with USDC
- **Mobile Money Integration**: MTN Mobile Money and Airtel Money support
- **Bank Transfers**: Direct bank account transfers
- **Stellar/Soroban Integration**: Smart contract interactions
- **Real-time Exchange Rates**: Live USDC to UGX conversion rates
- **Transaction History**: Complete audit trail of all transactions
- **Security**: JWT authentication, rate limiting, and encryption

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Blockchain**: Stellar/Soroban
- **Mobile Money**: MTN MoMo, Airtel Money APIs
- **Banking**: Flutterwave API
- **Authentication**: JWT
- **Validation**: Joi, express-validator
- **Logging**: Winston
- **Testing**: Jest

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Redis 6+
- Stellar/Soroban development environment
- Mobile money API credentials (MTN, Airtel)
- Flutterwave account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb payvia
   
   # Run migrations (if using a migration tool)
   npm run migrate
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔑 Environment Variables

Copy `env.example` to `.env` and configure:

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `STELLAR_CONTRACT_ID`: Your Soroban contract ID
- `MTN_API_KEY`: MTN Mobile Money API key
- `AIRTEL_CLIENT_ID`: Airtel Money client ID
- `FLUTTERWAVE_SECRET_KEY`: Flutterwave secret key

### Optional Variables
- `REDIS_URL`: Redis connection (defaults to localhost)
- `LOG_LEVEL`: Logging level (default: info)
- `PORT`: Server port (default: 3000)

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "phone": "+256701234567",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "phone": "+256701234567",
  "password": "securepassword"
}
```

### Wallet Endpoints

#### GET `/api/wallet/balance`
Get user's USDC balance

#### POST `/api/wallet/send`
Send USDC to another user
```json
{
  "recipient": "user-address",
  "amount": 100,
  "currency": "USDC"
}
```

### Bill Payment Endpoints

#### POST `/api/bills/pay`
Pay a bill with USDC
```json
{
  "billType": "electricity",
  "accountNumber": "123456789",
  "amount": 50,
  "currency": "USDC"
}
```

#### GET `/api/bills/history`
Get bill payment history

#### GET `/api/bills/providers`
Get available bill payment providers

### Withdrawal Endpoints

#### POST `/api/withdrawals/initiate`
Initiate USDC withdrawal to local currency
```json
{
  "method": "mtn",
  "accountNumber": "256701234567",
  "usdcAmount": 100,
  "currency": "USDC"
}
```

#### GET `/api/withdrawals/history`
Get withdrawal history

#### GET `/api/withdrawals/rates`
Get current exchange rates

### Mobile Money Endpoints

#### GET `/api/mobile-money/providers`
Get supported mobile money providers

#### POST `/api/mobile-money/validate`
Validate account number

## 🔗 Smart Contract Integration

The backend integrates with the Payvia Soroban smart contract:

### Contract Functions
- `register_user`: Register new users
- `deposit`: Add USDC to user balance
- `send_usdc`: Transfer USDC between users
- `pay_bill`: Process bill payments
- `withdraw`: Initiate withdrawals
- `get_balance`: Get user balance
- `get_bill_payments`: Get payment history
- `get_withdrawals`: Get withdrawal history

### Contract Deployment
```bash
# Build contract
cd ../payvia
cargo build --target wasm32-unknown-unknown --release

# Deploy to Soroban testnet
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/payvia.wasm --network testnet
```

## 🏦 Mobile Money Integration

### MTN Mobile Money
- Sandbox: `https://sandbox.momodeveloper.mtn.com`
- Production: `https://proxy.momoapi.mtn.com`
- Features: Send money, check balance, transaction status

### Airtel Money
- Sandbox: `https://openapiuat.airtel.africa`
- Production: `https://openapi.airtel.africa`
- Features: Send money, check balance, transaction status

### Flutterwave (Bank Transfers)
- Sandbox: `https://api.flutterwave.com/v3`
- Production: `https://api.flutterwave.com/v3`
- Features: Bank transfers, account validation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request protection
- **Helmet Security**: Security headers
- **Encryption**: Password and sensitive data encryption
- **Audit Logging**: Complete transaction audit trail

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="auth"
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Metrics**: Application metrics endpoint
- **Logging**: Structured logging with Winston
- **Error Tracking**: Sentry integration
- **Performance**: New Relic monitoring

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t payvia-backend .

# Run container
docker run -p 3000:3000 --env-file .env payvia-backend
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure load balancer
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 API Versioning

The API uses semantic versioning. Current version: `v1.0.0`

- Breaking changes will increment the major version
- New features will increment the minor version
- Bug fixes will increment the patch version

## 📈 Performance

- **Response Time**: < 200ms for most endpoints
- **Throughput**: 1000+ requests per second
- **Uptime**: 99.9% availability target
- **Database**: Optimized queries with proper indexing
- **Caching**: Redis caching for frequently accessed data
