/*
  # Add Commission Fields to Budgets

  1. Changes
    - Add `booking_agent_commission_rate` (numeric, default 10.0)
    - Add `management_commission_rate` (numeric, default 20.0)
    - Add `apply_commissions` (boolean, default false)
    
  2. Notes
    - Booking agent commission is calculated on gross income
    - Management commission is calculated on net income after booking agent commission
    - Commissions only apply when apply_commissions is true
*/

-- Add commission fields to budgets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'booking_agent_commission_rate'
  ) THEN
    ALTER TABLE budgets 
    ADD COLUMN booking_agent_commission_rate numeric DEFAULT 10.0 CHECK (booking_agent_commission_rate >= 0 AND booking_agent_commission_rate <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'management_commission_rate'
  ) THEN
    ALTER TABLE budgets 
    ADD COLUMN management_commission_rate numeric DEFAULT 20.0 CHECK (management_commission_rate >= 0 AND management_commission_rate <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'apply_commissions'
  ) THEN
    ALTER TABLE budgets 
    ADD COLUMN apply_commissions boolean DEFAULT false;
  END IF;
END $$;
