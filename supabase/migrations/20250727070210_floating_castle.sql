/*
  # Create Business Plans Table

  1. New Tables
    - `business_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `business_name` (text, required)
      - `industry` (text, required)
      - `business_type` (text, required)
      - `location` (text, required)
      - `target_audience` (text, required)
      - `value_proposition` (text, required)
      - `revenue_model` (text)
      - `goals` (text)
      - `generated_plan` (jsonb, stores structured plan sections)
      - `title` (text, display title for the plan)
      - `status` (text, plan status: draft, complete, archived)
      - `sections_count` (integer, number of plan sections)
      - `ai_model_used` (text, which AI model generated the plan)
      - `generation_time_ms` (integer, time taken to generate)
      - `last_modified_at` (timestamp, last edit time)
      - `is_favorite` (boolean, user favorite flag)
      - `export_count` (integer, download tracking)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `business_plans` table
    - Add policies for users to manage their own business plans
    - Add indexes for performance optimization

  3. Features
    - Support for multiple export formats (tracked via export_count)
    - Plan versioning and modification tracking
    - AI model and performance tracking
    - Status management for plan lifecycle
*/

-- Create business_plans table
CREATE TABLE IF NOT EXISTS business_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core business information (as requested)
  business_name text NOT NULL,
  industry text NOT NULL,
  business_type text NOT NULL,
  location text NOT NULL,
  target_audience text NOT NULL,
  value_proposition text NOT NULL,
  revenue_model text,
  goals text,
  
  -- Generated plan content
  generated_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- UI-related fields (based on BusinessPlan component)
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'archived')),
  sections_count integer DEFAULT 0,
  
  -- AI generation tracking
  ai_model_used text DEFAULT 'tngtech/deepseek-r1t2-chimera:free',
  generation_time_ms integer DEFAULT 0,
  
  -- User interaction tracking
  last_modified_at timestamptz DEFAULT now(),
  is_favorite boolean DEFAULT false,
  export_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE business_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own business plans
CREATE POLICY "Users can read own business plans"
  ON business_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business plans"
  ON business_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business plans"
  ON business_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own business plans"
  ON business_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_business_plans_user_id ON business_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_business_plans_created_at ON business_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_plans_status ON business_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_business_plans_industry ON business_plans(industry);
CREATE INDEX IF NOT EXISTS idx_business_plans_favorite ON business_plans(user_id, is_favorite) WHERE is_favorite = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_business_plans_updated_at
  BEFORE UPDATE ON business_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update sections_count when generated_plan changes
CREATE OR REPLACE FUNCTION update_sections_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.generated_plan IS NOT NULL THEN
    NEW.sections_count = jsonb_array_length(NEW.generated_plan);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update sections_count
CREATE TRIGGER update_business_plans_sections_count
  BEFORE INSERT OR UPDATE ON business_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_sections_count();