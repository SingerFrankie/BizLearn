/*
  # Create User Progress Tracking System

  1. New Tables
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `lesson_id` (uuid, foreign key to lessons.id)
      - `is_completed` (boolean)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_progress` table
    - Add policies for users to manage their own progress

  3. Indexes
    - Composite indexes for efficient progress queries
    - User-specific progress lookups
    - Course progress calculations

  4. Sample Data
    - Sample progress data for demonstration
*/

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one progress record per user per lesson
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id 
  ON user_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id 
  ON user_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_completed 
  ON user_progress(user_id, is_completed) 
  WHERE is_completed = true;

CREATE INDEX IF NOT EXISTS idx_user_progress_user_lesson 
  ON user_progress(user_id, lesson_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set completed_at when marking as completed
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  END IF;
  
  -- Clear completed_at when marking as incomplete
  IF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_updated_at();

-- Function to calculate course progress for a user
CREATE OR REPLACE FUNCTION get_course_progress(p_user_id uuid, p_course_id uuid)
RETURNS TABLE(
  total_lessons integer,
  completed_lessons integer,
  progress_percentage numeric,
  last_completed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(l.id)::integer as total_lessons,
    COUNT(CASE WHEN up.is_completed = true THEN 1 END)::integer as completed_lessons,
    CASE 
      WHEN COUNT(l.id) = 0 THEN 0
      ELSE ROUND((COUNT(CASE WHEN up.is_completed = true THEN 1 END)::numeric / COUNT(l.id)::numeric) * 100, 1)
    END as progress_percentage,
    MAX(up.completed_at) as last_completed_at
  FROM lessons l
  LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = p_user_id
  WHERE l.course_id = p_course_id AND l.is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's overall learning stats
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id uuid)
RETURNS TABLE(
  total_courses_started integer,
  total_courses_completed integer,
  total_lessons_completed integer,
  total_learning_time_minutes integer,
  current_streak_days integer,
  last_activity_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT l.course_id)::integer as total_courses_started,
    COUNT(DISTINCT CASE 
      WHEN course_progress.progress_percentage = 100 THEN l.course_id 
    END)::integer as total_courses_completed,
    COUNT(CASE WHEN up.is_completed = true THEN 1 END)::integer as total_lessons_completed,
    -- Estimate learning time (assume 15 minutes per completed lesson)
    (COUNT(CASE WHEN up.is_completed = true THEN 1 END) * 15)::integer as total_learning_time_minutes,
    -- Simple streak calculation (days with activity in last 30 days)
    COALESCE(
      (SELECT COUNT(DISTINCT DATE(completed_at))
       FROM user_progress 
       WHERE user_id = p_user_id 
         AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
         AND completed_at >= CURRENT_DATE - INTERVAL '7 days'), 
      0
    )::integer as current_streak_days,
    MAX(DATE(up.completed_at)) as last_activity_date
  FROM user_progress up
  JOIN lessons l ON up.lesson_id = l.id
  LEFT JOIN LATERAL (
    SELECT * FROM get_course_progress(p_user_id, l.course_id)
  ) course_progress ON true
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample progress data (for demonstration)
-- Note: This will only work if there are existing users and lessons
DO $$
DECLARE
  sample_user_id uuid;
  lesson_record RECORD;
  progress_count integer := 0;
BEGIN
  -- Get a sample user (first user in auth.users)
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Mark some lessons as completed for demonstration
    FOR lesson_record IN 
      SELECT id, course_id FROM lessons 
      WHERE is_published = true 
      ORDER BY course_id, "order" 
      LIMIT 8
    LOOP
      INSERT INTO user_progress (user_id, lesson_id, is_completed, completed_at)
      VALUES (
        sample_user_id, 
        lesson_record.id, 
        true,
        now() - (progress_count || ' days')::interval
      )
      ON CONFLICT (user_id, lesson_id) DO NOTHING;
      
      progress_count := progress_count + 1;
    END LOOP;
    
    -- Add some in-progress lessons (not completed)
    FOR lesson_record IN 
      SELECT id FROM lessons 
      WHERE is_published = true 
      AND id NOT IN (
        SELECT lesson_id FROM user_progress WHERE user_id = sample_user_id
      )
      LIMIT 3
    LOOP
      INSERT INTO user_progress (user_id, lesson_id, is_completed)
      VALUES (sample_user_id, lesson_record.id, false)
      ON CONFLICT (user_id, lesson_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;