-- COREÉATERY
-- Migration: 0012_add_expired_shift_status
-- Add expired status for automatic shift expiration.

ALTER TYPE public.cash_register_shift_status
ADD VALUE IF NOT EXISTS 'expired';
