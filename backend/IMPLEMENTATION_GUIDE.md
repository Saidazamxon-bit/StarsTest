# ULTRA Marketplace - Complete Implementation Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                     │
│  - Telegram Mini App UI                                │
│  - Real-time balance updates                           │
│  - Case opening animations                             │
│  - User profiles & achievements                        │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────┐
│         API Gateway / Load Balancer                     │
│  (Rate Limiting, Request Validation, Logging)         │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
┌──────────────┐      ┌──────────────┐
│ NestJS       │      │ NestJS       │
│ Instance 1   │      │ Instance N   │
│ (Scalable)   │      │ (Scalable)   │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └────────────┬────────┘
                    ▼
          ┌─────────────────────┐
          │   PostgreSQL DB     │
          │  (Primary Data)     │
          │  - Users            │
          │  - Wallets          │
          │  - Transactions     │
          │  - Cases/Inventory  │
          │  - Audit Logs       │
          └─────────┬───────────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
    ┌─────┐     ┌────────┐   ┌──────────┐
    │Redis│     │Message │   │ Storage  │
    │Cache│     │ Queue  │   │(S3/GCS)  │
    └─────┘     └────────┘   └──────────┘
```

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts                    # Main application module
│   ├── main.ts                          # Entry point
│   ├── config/
│   │   ├── database.config.ts           # Database configuration
│   │   └── app.config.ts                # App configuration
│   ├── common/
│   │   ├── dto/
│   │   │   └── api-response.dto.ts      # Standard API response format
│   │   ├── exceptions/                  # Custom exceptions
│   │   ├── filters/                     # Exception filters
│   │   ├── guards/                      # Custom guards (roles, etc)
│   │   ├── interceptors/                # Request/response interceptors
│   │   └── decorators/                  # Custom decorators
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── migrations/              # Database migrations
│   │   │   ├── seeds/                   # Database seeds
│   │   │   └── schema.sql               # Complete database schema
│   │   ├── queue/
│   │   │   └── processors/              # Queue job processors
│   │   └── cache/
│   │       └── services/                # Cache services
│   └── modules/
│       ├── auth/                        # Authentication
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts          ✅ IMPLEMENTED
│       │   ├── auth.controller.ts       ✅ IMPLEMENTED
│       │   ├── dto/
│       │   │   └── auth.dto.ts          ✅ IMPLEMENTED
│       │   └── strategies/
│       │       └── jwt.strategy.ts      ✅ IMPLEMENTED
│       ├── users/                       # User management
│       │   ├── users.module.ts          ✅ IMPLEMENTED
│       │   ├── users.service.ts         ✅ IMPLEMENTED
│       │   ├── users.controller.ts      ✅ IMPLEMENTED
│       │   └── entities/
│       │       └── user.entity.ts       ✅ IMPLEMENTED
│       ├── wallets/                     # Wallet & Balance
│       │   ├── wallets.module.ts        ✅ IMPLEMENTED
│       │   ├── wallets.service.ts       ✅ IMPLEMENTED
│       │   ├── wallets.controller.ts    ✅ IMPLEMENTED
│       │   └── entities/
│       │       └── wallet.entity.ts     ✅ IMPLEMENTED
│       ├── transactions/                # Immutable ledger
│       │   ├── transactions.module.ts   ✅ IMPLEMENTED
│       │   └── entities/
│       │       └── transaction.entity.ts ✅ IMPLEMENTED
│       ├── cases/                       # Case Opening Engine
│       │   ├── cases.module.ts          📋 TODO
│       │   ├── cases.service.ts         📋 TODO
│       │   ├── cases.controller.ts      📋 TODO
│       │   └── entities/
│       │       ├── case.entity.ts       📋 TODO
│       │       ├── case-item.entity.ts  📋 TODO
│       │       └── case-opening.entity.ts 📋 TODO
│       ├── inventory/                   # Inventory Management
│       │   ├── inventory.module.ts      📋 TODO
│       │   ├── inventory.service.ts     📋 TODO
│       │   ├── inventory.controller.ts  📋 TODO
│       │   └── entities/
│       │       └── inventory.entity.ts  📋 TODO
│       ├── referrals/                   # Referral System
│       │   ├── referrals.module.ts      📋 TODO
│       │   ├── referrals.service.ts     📋 TODO
│       │   ├── referrals.controller.ts  📋 TODO
│       │   └── entities/
│       │       └── referral.entity.ts   📋 TODO
│       ├── missions/                    # Missions & Achievements
│       │   ├── missions.module.ts       📋 TODO
│       │   ├── missions.service.ts      📋 TODO
│       │   └── missions.controller.ts   📋 TODO
│       ├── events/                      # Events Management
│       │   ├── events.module.ts         📋 TODO
│       │   ├── events.service.ts        📋 TODO
│       │   └── events.controller.ts     📋 TODO
│       ├── notifications/               # Notifications
│       │   ├── notifications.module.ts  📋 TODO
│       │   ├── notifications.service.ts 📋 TODO
│       │   └── notifications.controller.ts 📋 TODO
│       ├── audit/                       # Audit Logging
│       │   ├── audit.module.ts          📋 TODO
│       │   ├── audit.service.ts         📋 TODO
│       │   └── audit.interceptor.ts     📋 TODO
│       ├── admin/                       # Admin Panel
│       │   ├── admin.module.ts          📋 TODO
│       │   ├── admin.service.ts         📋 TODO
│       │   └── admin.controller.ts      📋 TODO
│       └── health/                      # Health Checks
│           ├── health.module.ts         ✅ IMPLEMENTED
│           ├── health.service.ts        ✅ IMPLEMENTED
│           └── health.controller.ts     ✅ IMPLEMENTED
├── test/
├── docker-compose.yml
├── Dockerfile
├── .env.example                          ✅ IMPLEMENTED
├── package.json                          ✅ IMPLEMENTED
├── tsconfig.json                         ✅ IMPLEMENTED
└── README.md                             📋 TODO
```

## Database Schema

The system uses PostgreSQL with the following key tables:

### Core Tables:
1. **users** - User profiles with VIP/premium status
2. **wallets** - User wallet with balance tracking
3. **transactions** - Immutable ledger (append-only)
4. **cases** - Digital case definitions
5. **case_items** - Items in cases with rarity levels
6. **case_openings** - Complete case opening history
7. **inventory** - User claimed items
8. **referrals** - Referral tracking
9. **missions** - Mission definitions
10. **mission_progress** - User mission progress
11. **events** - Time-limited events
12. **promo_codes** - Promotional codes
13. **notifications** - User notifications
14. **audit_logs** - Complete action audit trail
15. **user_settings** - User preferences
16. **admin_users** - Admin roles and permissions
17. **session_tokens** - Session management
18. **payment_logs** - Payment history
19. **vip_levels** - VIP tier definitions
20. **analytics_events** - User behavior tracking

## Setup Instructions

### 1. Prerequisites

```bash
# Install Node.js 18+
node --version  # v18.0.0 or higher

# Install PostgreSQL 14+
psql --version  # psql 14.0 or higher

# Install Redis 6+
redis-cli --version  # redis-cli 6.0 or higher
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Setup Database

```bash
# Create database
createdb ultra_marketplace

# Run schema (from schema.sql)
psql ultra_marketplace < src/database/schema.sql

# Or use TypeORM migrations (when ready)
npm run migration:run
```

### 5. Run Backend

```bash
# Development
npm run dev

# Production
npm run build
npm run prod
```

API will be available at: `http://localhost:3001`
Swagger docs at: `http://localhost:3001/docs`

## API Endpoints

### Authentication
- `POST /auth/telegram` - Authenticate with Telegram Mini App
- `POST /auth/refresh` - Refresh access token
- `GET /auth/verify` - Verify token validity

### Users
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update user profile
- `GET /users/referral-code` - Get referral code
- `GET /users/:username` - Get public user profile

### Wallets
- `GET /wallets/balance` - Get wallet balance
- `POST /wallets/add-funds` - Add funds (admin)
- `POST /wallets/withdraw` - Withdraw funds
- `GET /wallets/transactions` - Get transaction history

### Health
- `GET /health` - Health check

## Core Business Logic Implementation Roadmap

### Phase 1: Foundation (COMPLETED ✅)
- [x] Database schema design
- [x] Authentication system (Telegram Mini App)
- [x] User management
- [x] Wallet & transaction system (immutable ledger)
- [x] Base API structure

### Phase 2: Gaming Engine (2-3 hours)
- [ ] Cases service (create, list, get)
- [ ] Random number generator with provably fair
- [ ] Case opening flow with atomic transactions
- [ ] Reward calculation engine
- [ ] Inventory management
- [ ] **Key Files to Create:**
  - `src/modules/cases/cases.service.ts` (400+ lines)
  - `src/modules/cases/cases.controller.ts` (200+ lines)
  - `src/modules/inventory/inventory.service.ts` (300+ lines)

### Phase 3: Referral System (1-2 hours)
- [ ] Referral invitation & tracking
- [ ] Referral reward calculation
- [ ] Fraud detection for referrals
- [ ] Referral analytics
- [ ] **Key Files:**
  - `src/modules/referrals/referrals.service.ts` (300+ lines)
  - `src/modules/referrals/referral-reward.processor.ts` (200+ lines)

### Phase 4: Additional Features (2-3 hours)
- [ ] Missions & achievements
- [ ] Events system
- [ ] VIP level management
- [ ] Promo codes
- [ ] Notifications
- [ ] **Key Files:**
  - `src/modules/missions/missions.service.ts` (250+ lines)
  - `src/modules/events/events.service.ts` (200+ lines)

### Phase 5: Admin & Monitoring (2 hours)
- [ ] Admin dashboard API
- [ ] Audit logging
- [ ] Analytics
- [ ] System monitoring
- [ ] **Key Files:**
  - `src/modules/admin/admin.service.ts` (400+ lines)
  - `src/modules/audit/audit.interceptor.ts` (200+ lines)

## Key Implementation Details

### Immutable Ledger Pattern

```typescript
// All balance changes go through transactions table
// This ensures complete auditability

async function addFunds(userId, amount) {
  // 1. Lock wallet
  // 2. Verify balance
  // 3. Update wallet balance
  // 4. CREATE new transaction record (never UPDATE old ones)
  // 5. Commit transaction
  // 6. Release lock
}
```

### Idempotency

```typescript
// All financial operations support idempotency
const transaction = await findByIdempotencyKey(key);
if (transaction.exists) {
  return transaction.result; // Return cached result
}

// If not found, proceed with operation
```

### Atomic Operations

```typescript
// Use database transactions to ensure consistency
const queryRunner = dataSource.createQueryRunner();
try {
  await queryRunner.startTransaction();
  // 1. Update wallet
  // 2. Create transaction record
  // 3. Update inventory
  // 4. Create audit log
  await queryRunner.commitTransaction();
} catch {
  await queryRunner.rollbackTransaction();
}
```

### Role-Based Access Control

```typescript
// Decorators for authorization
@Roles('admin')
@Post('/admin/add-funds')
async addFundsAdmin(...) {
  // Admin only endpoint
}

@Roles('user', 'admin')
@Post('/wallets/withdraw')
async withdraw(...) {
  // User and admin can access
}
```

## Frontend Integration

### Telegram Mini App WebApp API

```typescript
// In Next.js frontend
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

const { user, initData } = useTelegramWebApp();

// Authenticate with backend
const response = await fetch('/api/auth/telegram', {
  method: 'POST',
  body: JSON.stringify({ initData }),
});
```

### API Communication

```typescript
// Create API client with automatic auth token handling
import { apiClient } from '@/lib/api-client';

// Get wallet balance
const balance = await apiClient.get('/wallets/balance');

// Open a case
const result = await apiClient.post('/cases/open', {
  caseId: 1,
  amount: 11000,
});
```

## Security Considerations

### 1. Telegram Mini App Validation
- Always verify Telegram init data signature
- Check timestamp (must be recent)
- Never trust client-side user data

### 2. Financial Operations
- Use database locks for concurrent access
- Verify balance before deduction
- Log all transactions (immutable)
- Implement idempotency keys

### 3. Authentication
- Use JWT with short expiration (7 days)
- Support refresh tokens (30 days)
- Validate token on every request
- Track session tokens per device

### 4. Rate Limiting
- Implement per-user rate limits
- Different limits per endpoint
- Track by user ID and IP address

### 5. Fraud Detection
- Calculate risk scores for users
- Monitor unusual patterns
- Referral abuse detection
- Geographic anomalies

## Testing Strategy

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### Load Testing
```bash
# Using k6 or Artillery
artillery run load-test.yml
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

### Docker Compose

```bash
docker-compose up -d
```

### Environment Setup
1. Configure `.env` for production
2. Use strong JWT_SECRET
3. Enable database SSL
4. Setup Redis for caching
5. Configure Telegram bot token
6. Setup email service

## Monitoring & Logging

### Key Metrics
- API response time
- Database query time
- Cache hit rate
- Transaction success rate
- Error rate by endpoint
- Active user count
- Case opening success rate

### Logging
```typescript
// Use structured logging
logger.info('Case opened', {
  userId,
  caseId,
  reward,
  requestId,
  duration: Date.now() - startTime,
});
```

## Common Implementation Patterns

### Service Pattern
```typescript
@Injectable()
export class SomeService {
  constructor(
    @InjectRepository(Entity)
    private repository: Repository<Entity>,
    private otherService: OtherService,
  ) {}

  async create(data) {
    // Validation
    // Business logic
    // Database operation
    // Event emission
  }
}
```

### Controller Pattern
```typescript
@Controller('endpoint')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SomeController {
  constructor(private service: SomeService) {}

  @Post()
  @ApiOperation({ summary: 'Description' })
  async create(@Request() req, @Body() body) {
    return this.service.create(req.user.id, body);
  }
}
```

## Next Steps

1. **Setup Development Environment**
   - Install PostgreSQL, Redis
   - Run database schema
   - Test API endpoints

2. **Implement Core Modules**
   - Cases engine (Week 1)
   - Referral system (Week 1)
   - Missions (Week 2)

3. **Frontend Integration**
   - Connect to backend API
   - Implement real-time balance updates
   - Handle animations and loading states

4. **Testing & QA**
   - Write unit tests
   - E2E testing
   - Load testing

5. **Deploy to Production**
   - Setup cloud infrastructure
   - Configure monitoring
   - Setup CI/CD pipeline

## Support & Documentation

- Swagger API Docs: `http://localhost:3001/docs`
- Database Schema: `src/database/schema.sql`
- Architecture Diagram: See above
- Contributing: See CONTRIBUTING.md (WIP)

## License

PROPRIETARY - ULTRA Project 2024
