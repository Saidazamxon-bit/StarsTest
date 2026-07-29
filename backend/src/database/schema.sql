-- ULTRA Marketplace Database Schema
-- Production-grade PostgreSQL schema with audit trails, immutable ledgers, and compliance

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  language VARCHAR(10) DEFAULT 'uz',
  region VARCHAR(50),
  avatar_url TEXT,
  premium_status BOOLEAN DEFAULT FALSE,
  vip_level INTEGER DEFAULT 0,
  referral_code UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, banned
  risk_score DECIMAL(5, 2) DEFAULT 0,
  flags JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by BIGINT,
  updated_by BIGINT,
  version INTEGER DEFAULT 1,
  
  CONSTRAINT valid_vip_level CHECK (vip_level >= 0 AND vip_level <= 10),
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_risk_score ON users(risk_score DESC);

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(10) DEFAULT 'UZS',
  balance DECIMAL(18, 2) DEFAULT 0,
  frozen_balance DECIMAL(18, 2) DEFAULT 0,
  total_earned DECIMAL(18, 2) DEFAULT 0,
  total_spent DECIMAL(18, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  
  CONSTRAINT valid_balance CHECK (balance >= 0),
  CONSTRAINT valid_frozen_balance CHECK (frozen_balance >= 0)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_balance ON wallets(balance DESC);

-- Transactions (Immutable Ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UZS',
  type VARCHAR(50) NOT NULL, -- deposit, withdraw, purchase, refund, reward, referral_bonus, case_opening, item_sell, admin_adjustment, chargeback
  source VARCHAR(100), -- balance, card, crypto, telegram_stars, referral, etc.
  destination VARCHAR(100),
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed, reversed
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  request_id UUID NOT NULL,
  idempotency_key UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  audit_reference UUID,
  
  CONSTRAINT valid_amount CHECK (amount > 0)
);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_request_id ON transactions(request_id);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);

-- Cases
CREATE TABLE IF NOT EXISTS cases (
  id BIGSERIAL PRIMARY KEY,
  case_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UZS',
  category VARCHAR(50),
  image_url TEXT,
  animation_url TEXT,
  rtp DECIMAL(5, 2) DEFAULT 85, -- Return To Player percentage
  house_edge DECIMAL(5, 2) DEFAULT 15,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
  visibility VARCHAR(50) DEFAULT 'public',
  priority INTEGER DEFAULT 0,
  release_date TIMESTAMP WITH TIME ZONE,
  archive_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  version INTEGER DEFAULT 1,
  
  CONSTRAINT valid_rtp CHECK (rtp >= 0 AND rtp <= 100),
  CONSTRAINT valid_house_edge CHECK (house_edge >= 0 AND house_edge <= 100),
  CONSTRAINT valid_price CHECK (price > 0)
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_visibility ON cases(visibility);
CREATE INDEX idx_cases_priority ON cases(priority DESC);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);

-- Case Items
CREATE TABLE IF NOT EXISTS case_items (
  id BIGSERIAL PRIMARY KEY,
  item_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rarity VARCHAR(50), -- common, rare, epic, legendary
  probability DECIMAL(10, 8) NOT NULL,
  weight INTEGER NOT NULL,
  market_price DECIMAL(18, 2),
  claim_price DECIMAL(18, 2),
  sell_price DECIMAL(18, 2),
  image_url TEXT,
  animation_url TEXT,
  preview_url TEXT,
  visibility VARCHAR(50) DEFAULT 'public',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  
  CONSTRAINT valid_probability CHECK (probability > 0 AND probability <= 1),
  CONSTRAINT valid_weight CHECK (weight > 0)
);

CREATE INDEX idx_case_items_case_id ON case_items(case_id);
CREATE INDEX idx_case_items_rarity ON case_items(rarity);

-- Case Openings (Audit trail)
CREATE TABLE IF NOT EXISTS case_openings (
  id BIGSERIAL PRIMARY KEY,
  opening_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id BIGINT NOT NULL REFERENCES cases(id),
  item_id BIGINT NOT NULL REFERENCES case_items(id),
  seed VARCHAR(512) NOT NULL,
  seed_hash VARCHAR(512) NOT NULL,
  random_value DECIMAL(10, 8) NOT NULL,
  spent_amount DECIMAL(18, 2) NOT NULL,
  reward_value DECIMAL(18, 2),
  transaction_id BIGINT REFERENCES transactions(id),
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
  latency_ms INTEGER,
  device_info JSONB,
  ip_address INET,
  client_seed VARCHAR(512),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  audit_reference UUID,
  
  CONSTRAINT valid_random_value CHECK (random_value >= 0 AND random_value <= 1)
);

CREATE INDEX idx_case_openings_user_id ON case_openings(user_id);
CREATE INDEX idx_case_openings_case_id ON case_openings(case_id);
CREATE INDEX idx_case_openings_created_at ON case_openings(created_at DESC);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  inventory_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES case_items(id),
  rarity VARCHAR(50),
  source VARCHAR(50), -- case_opening, gift, etc.
  won_from_case_id BIGINT REFERENCES case_openings(id),
  status VARCHAR(50) DEFAULT 'unclaimed', -- unclaimed, claimed, sold
  claim_price DECIMAL(18, 2),
  market_value DECIMAL(18, 2),
  claimed_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_created_at ON inventory(created_at DESC);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  referral_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  inviter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  first_purchase_time TIMESTAMP WITH TIME ZONE,
  first_purchase_amount DECIMAL(18, 2),
  reward_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  reward_amount DECIMAL(18, 2),
  reward_transaction_id BIGINT REFERENCES transactions(id),
  fraud_score DECIMAL(5, 2) DEFAULT 0,
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  
  CONSTRAINT unique_referral UNIQUE (inviter_id, invitee_id),
  CONSTRAINT valid_fraud_score CHECK (fraud_score >= 0 AND fraud_score <= 100)
);

CREATE INDEX idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX idx_referrals_invitee_id ON referrals(invitee_id);
CREATE INDEX idx_referrals_verification_status ON referrals(verification_status);

-- VIP Levels
CREATE TABLE IF NOT EXISTS vip_levels (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  minimum_spend DECIMAL(18, 2) NOT NULL,
  multiplier DECIMAL(5, 2) DEFAULT 1.0,
  bonus_percentage DECIMAL(5, 2) DEFAULT 0,
  exclusive_access TEXT,
  badge_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vip_levels_level ON vip_levels(level);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id BIGSERIAL PRIMARY KEY,
  mission_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirement INTEGER NOT NULL, -- e.g., open 10 cases
  requirement_type VARCHAR(50), -- open_count, spend_amount, etc.
  reward_amount DECIMAL(18, 2) NOT NULL,
  category VARCHAR(50), -- daily, weekly, seasonal
  difficulty VARCHAR(50), -- easy, medium, hard
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  visibility VARCHAR(50) DEFAULT 'public',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

CREATE INDEX idx_missions_category ON missions(category);
CREATE INDEX idx_missions_created_at ON missions(created_at DESC);

-- Mission Progress
CREATE TABLE IF NOT EXISTS mission_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id BIGINT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, claimed
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  reward_transaction_id BIGINT REFERENCES transactions(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_mission UNIQUE (user_id, mission_id)
);

CREATE INDEX idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX idx_mission_progress_status ON mission_progress(status);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, active, ended
  event_type VARCHAR(50), -- seasonal, special, leaderboard
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time DESC);

-- Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  code_hash VARCHAR(512) NOT NULL UNIQUE,
  reward_amount DECIMAL(18, 2) NOT NULL,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active',
  created_by BIGINT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promo_codes_code_hash ON promo_codes(code_hash);
CREATE INDEX idx_promo_codes_status ON promo_codes(status);

-- Promo Usage
CREATE TABLE IF NOT EXISTS promo_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promo_id BIGINT NOT NULL REFERENCES promo_codes(id),
  transaction_id BIGINT REFERENCES transactions(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_promo UNIQUE (user_id, promo_id)
);

CREATE INDEX idx_promo_usage_user_id ON promo_usage(user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  notification_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50), -- purchase, reward, referral, security, system, promo
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  audit_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  actor_id BIGINT REFERENCES users(id),
  target_type VARCHAR(100) NOT NULL,
  target_id BIGINT,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  device_info JSONB,
  user_agent TEXT,
  request_id UUID,
  correlation_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

-- Payment Logs
CREATE TABLE IF NOT EXISTS payment_logs (
  id BIGSERIAL PRIMARY KEY,
  payment_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id),
  amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10),
  provider VARCHAR(50), -- stripe, card, crypto, etc.
  provider_transaction_id VARCHAR(255),
  status VARCHAR(50), -- pending, completed, failed
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_referral BOOLEAN DEFAULT TRUE,
  notification_promo BOOLEAN DEFAULT TRUE,
  notification_security BOOLEAN DEFAULT TRUE,
  notification_system BOOLEAN DEFAULT TRUE,
  notification_marketing BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  language VARCHAR(10) DEFAULT 'uz',
  theme VARCHAR(50) DEFAULT 'dark',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- admin, super_admin, moderator, support, operator
  permissions JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Session Tokens
CREATE TABLE IF NOT EXISTS session_tokens (
  id BIGSERIAL PRIMARY KEY,
  token_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  token_hash VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX idx_session_tokens_expires_at ON session_tokens(expires_at);
CREATE INDEX idx_session_tokens_revoked ON session_tokens(revoked);

-- Constraints to ensure referential integrity
ALTER TABLE users 
  ADD CONSTRAINT fk_users_invited_by FOREIGN KEY (invited_by) REFERENCES users(telegram_id) ON DELETE SET NULL;

-- Views for common queries
CREATE OR REPLACE VIEW user_wallet_view AS
SELECT 
  u.id,
  u.telegram_id,
  u.username,
  u.display_name,
  u.vip_level,
  u.premium_status,
  w.balance,
  w.frozen_balance,
  w.total_earned,
  w.total_spent
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.deleted_at IS NULL;

-- Grant appropriate permissions (adjust based on your needs)
-- This is an example; adjust roles and permissions as needed

COMMIT;
