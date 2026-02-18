-- Migration: Standardize Count Column Names
-- Date: 2026-01-31
-- Description: Standardize count columns to *_count pattern

BEGIN;

-- Standardize to *_count pattern (using DO blocks to handle missing tables/columns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'ai_auto_send_rules'
               AND column_name = 'times_triggered'
               AND table_schema = 'public') THEN
        ALTER TABLE ai_auto_send_rules RENAME COLUMN times_triggered TO trigger_count;
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'investor_property_analyses'
               AND column_name = 'tokens_used'
               AND table_schema = 'public') THEN
        ALTER TABLE investor_property_analyses RENAME COLUMN tokens_used TO token_count;
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'landlord_messages'
               AND column_name = 'ai_completion_tokens'
               AND table_schema = 'public') THEN
        ALTER TABLE landlord_messages RENAME COLUMN ai_completion_tokens TO ai_completion_token_count;
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'landlord_messages'
               AND column_name = 'ai_prompt_tokens'
               AND table_schema = 'public') THEN
        ALTER TABLE landlord_messages RENAME COLUMN ai_prompt_tokens TO ai_prompt_token_count;
    END IF;
END$$;

-- Fix usage_count vs use_count (standardize to use_count)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'ai_learning_templates'
               AND column_name = 'usage_count'
               AND table_schema = 'public') THEN
        ALTER TABLE ai_learning_templates RENAME COLUMN usage_count TO use_count;
    END IF;
END$$;

COMMIT;
