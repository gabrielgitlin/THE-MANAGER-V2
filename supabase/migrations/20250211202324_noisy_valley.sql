/*
  # Add Subscription Plans

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `type` (text)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `features` (text[])
      - `modules` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_id` (uuid, references subscription_plans)
      - `status` (text)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing subscriptions
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('artist', 'manager', 'label', 'publisher', 'producer')),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  features text[],
  modules jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX subscription_plans_type_idx ON public.subscription_plans(type);
CREATE INDEX user_subscriptions_user_id_idx ON public.user_subscriptions(user_id);
CREATE INDEX user_subscriptions_plan_id_idx ON public.user_subscriptions(plan_id);
CREATE INDEX user_subscriptions_status_idx ON public.user_subscriptions(status);

-- Add RLS policies for subscription_plans
CREATE POLICY "Subscription plans are viewable by everyone"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- Add RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default plans
INSERT INTO public.subscription_plans (type, name, description, price, features, modules) VALUES
  (
    'artist',
    'Artist',
    'For independent artists managing their own career',
    29.99,
    ARRAY[
      'Track releases and metadata',
      'Basic financial tracking',
      'Calendar management',
      'Document storage',
      'Basic analytics'
    ],
    '[
      {
        "id": "catalog",
        "name": "Catalog",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Manage your releases",
        "features": ["Track releases", "Manage metadata", "Export data"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Basic financial tracking",
        "features": ["Income/expense tracking", "Basic reporting"]
      },
      {
        "id": "calendar",
        "name": "Calendar",
        "path": "/live/calendar",
        "icon": "Calendar",
        "description": "Show calendar",
        "features": ["Show dates", "Basic scheduling"]
      }
    ]'::jsonb
  ),
  (
    'manager',
    'Artist Manager',
    'Full suite for professional artist management',
    99.99,
    ARRAY[
      'Complete catalog management',
      'Advanced financial tracking',
      'Tour management',
      'Team collaboration',
      'Document management',
      'Advanced analytics',
      'Multiple artist support'
    ],
    '[
      {
        "id": "catalog",
        "name": "Catalog",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Complete catalog management",
        "features": ["Full release management", "Metadata management", "Rights management", "Export tools"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Advanced financial tools",
        "features": ["Complete financial tracking", "Budget management", "Advanced reporting"]
      },
      {
        "id": "live",
        "name": "Live",
        "path": "/live",
        "icon": "Mic2",
        "description": "Tour management",
        "features": ["Show management", "Tour planning", "Personnel management"]
      },
      {
        "id": "legal",
        "name": "Legal",
        "path": "/legal",
        "icon": "Scale",
        "description": "Contract management",
        "features": ["Contract templates", "Document storage", "Rights tracking"]
      },
      {
        "id": "marketing",
        "name": "Marketing",
        "path": "/marketing",
        "icon": "Megaphone",
        "description": "Marketing tools",
        "features": ["Campaign planning", "Social media management", "Asset management"]
      },
      {
        "id": "info",
        "name": "Info",
        "path": "/info",
        "icon": "Info",
        "description": "Sensitive information",
        "features": ["Secure storage", "Team access control"]
      }
    ]'::jsonb
  ),
  (
    'label',
    'Record Label',
    'For record labels managing multiple artists',
    199.99,
    ARRAY[
      'Multiple artist management',
      'Label-wide analytics',
      'Advanced rights management',
      'Distribution tools',
      'Marketing suite',
      'Team collaboration'
    ],
    '[
      {
        "id": "catalog",
        "name": "Catalog",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Label catalog management",
        "features": ["Multi-artist catalog", "Advanced metadata", "Distribution tools"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Label finances",
        "features": ["Label-wide financials", "Artist accounting", "Royalty management"]
      },
      {
        "id": "marketing",
        "name": "Marketing",
        "path": "/marketing",
        "icon": "Megaphone",
        "description": "Marketing suite",
        "features": ["Campaign management", "Asset management", "Analytics"]
      }
    ]'::jsonb
  ),
  (
    'publisher',
    'Music Publisher',
    'For music publishers managing songwriters and compositions',
    199.99,
    ARRAY[
      'Songwriter management',
      'Copyright tracking',
      'Royalty management',
      'PRO integration',
      'Advanced reporting'
    ],
    '[
      {
        "id": "catalog",
        "name": "Works",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Song catalog management",
        "features": ["Copyright management", "Songwriter splits", "PRO registration"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Publishing finances",
        "features": ["Royalty tracking", "Writer payments", "Advanced reporting"]
      }
    ]'::jsonb
  ),
  (
    'producer',
    'Producer',
    'For music producers managing projects and clients',
    49.99,
    ARRAY[
      'Project management',
      'Client management',
      'Basic financial tracking',
      'File management',
      'Basic analytics'
    ],
    '[
      {
        "id": "catalog",
        "name": "Projects",
        "path": "/catalog",
        "icon": "Music2",
        "description": "Project management",
        "features": ["Track projects", "Client management", "File organization"]
      },
      {
        "id": "finance",
        "name": "Finance",
        "path": "/finance",
        "icon": "DollarSign",
        "description": "Financial tracking",
        "features": ["Income tracking", "Basic reporting", "Invoice management"]
      }
    ]'::jsonb
  );