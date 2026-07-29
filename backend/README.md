# ULTRA Marketplace Backend

Enterprise-grade Telegram Mini App Marketplace API built with NestJS, PostgreSQL, and Redis.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Setup database
createdb ultra_marketplace
psql ultra_marketplace < src/database/schema.sql

# Run development server
npm run dev
```

Server will start at `http://localhost:3001`

## Features

### ✅ Implemented
- **Authentication** - Telegram Mini App OAuth with JWT tokens
- **User Management** - Profile creation and management
- **Wallet System** - Immutable transaction ledger
- **Balance Management** - ACID-compliant balance operations
- **Health Checks** - System monitoring endpoints

### 📋 Coming Next
- **Case Opening Engine** - Provably fair case opening mechanism
- **Inventory System** - User item collection management
- **Referral Program** - User acquisition and reward system
- **Missions & Events** - Engagement mechanics
- **Admin Dashboard** - Moderation and analytics

## Project Structure

```
backend/
├── src/
│   ├── modules/          # Feature modules
│   ├── common/           # Shared utilities & DTOs
│   ├── infrastructure/   # Database, migrations, seeds
│   ├── config/           # Configuration files
│   ├── app.module.ts     # Main module
│   └── main.ts           # Application entry point
├── database/
│   └── schema.sql        # Complete database schema
└── test/                 # Test files
```

## API Documentation

Once running, visit: `http://localhost:3001/docs`

### Key Endpoints

#### Authentication
```bash
POST /auth/telegram
Content-Type: application/json

{
  "initData": "query_id=...&user=%7B%22id%22%3A..."
}
```

#### User Profile
```bash
GET /users/profile
Authorization: Bearer <token>
```

#### Wallet Balance
```bash
GET /wallets/balance
Authorization: Bearer <token>
```

## Architecture

### Technology Stack
- **Framework**: NestJS 10.3
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

### Design Patterns
- **Immutable Ledger** - All transactions are append-only
- **ACID Compliance** - Database transactions ensure consistency
- **Role-Based Access Control** - Fine-grained permissions
- **Dependency Injection** - Loose coupling, easy testing
- **Event-Driven** - Async queue processing

## Database Schema

Complete PostgreSQL schema with:
- 20+ production-grade tables
- Full audit trail
- Immutable transaction ledger
- Complete indexes for performance
- JSONB fields for flexible data

See `src/database/schema.sql` for details.

## Development

### Available Scripts

```bash
# Development
npm run dev          # Hot reload server
npm run debug        # Debug mode

# Building
npm run build        # Compile TypeScript
npm run prod         # Production run

# Testing
npm run test         # Unit tests
npm run test:watch   # Watch mode
npm run test:cov     # Coverage

# Database
npm run migration:generate  # Create migration
npm run migration:run       # Run migrations
npm run migration:revert    # Rollback migration

# Code Quality
npm run lint        # ESLint check
npm run format      # Prettier format
```

## Configuration

All settings from `.env` file:

```env
# Server
NODE_ENV=development
APP_PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ultra_marketplace

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEB_APP_URL=https://your-domain.com
```

## Security

### Best Practices
✅ JWT authentication with refresh tokens
✅ Database password hashing with bcryptjs
✅ Input validation & sanitization
✅ Rate limiting per endpoint
✅ CORS properly configured
✅ Helmet security headers
✅ SQL injection prevention via ORM
✅ XSS protection via validation

### Audit Trail
All financial operations logged with:
- Actor ID
- Action performed
- Old/New values
- Timestamp
- IP address
- Device info

## Performance

### Optimizations
- PostgreSQL indexes on frequently queried columns
- Redis caching layer
- Connection pooling
- Pagination support
- Query optimization

### Monitoring
```
GET /health
```

Returns system status, uptime, environment info.

## Deployment

### Docker

```bash
docker-compose up -d
```

### Cloud Deployment

Supports deployment to:
- AWS (ECS, EC2)
- Google Cloud (App Engine, Cloud Run)
- Azure (App Service)
- Heroku
- Digital Ocean

## Contributing

1. Create feature branch
2. Make changes
3. Run tests & linting
4. Submit pull request

## Implementation Roadmap

See `IMPLEMENTATION_GUIDE.md` for complete development roadmap including:
- Phase 2: Case Opening Engine
- Phase 3: Referral System
- Phase 4: Missions & Events
- Phase 5: Admin Dashboard

## Troubleshooting

### Database Connection Error
```bash
# Ensure PostgreSQL is running
sudo service postgresql start
# Or use Docker
docker-compose up db -d
```

### Port Already in Use
```bash
# Change APP_PORT in .env
# Or kill process on port
lsof -i :3001
kill -9 <PID>
```

### Module Not Found
```bash
# Rebuild
npm run build
npm run dev
```

## License

PROPRIETARY - ULTRA Marketplace 2024

## Support

For questions or issues:
1. Check `IMPLEMENTATION_GUIDE.md`
2. Review Swagger docs at `/docs`
3. Check database schema: `schema.sql`
4. Review error logs in console

---

**Status**: Production-Ready Foundation  
**Last Updated**: July 23, 2024  
**Version**: 1.0.0-beta
