/*
  # Create courses table for Learning Hub

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text, course title)
      - `description` (text, course description)
      - `category` (text, course category)
      - `level` (enum, difficulty level)
      - `thumbnail_url` (text, course image)
      - `duration` (text, course duration like "4h 30m")
      - `rating` (numeric, average rating)
      - `students_count` (integer, number of enrolled students)
      - `instructor_name` (text, instructor name)
      - `instructor_bio` (text, instructor biography)
      - `course_content` (jsonb, structured course content/modules)
      - `tags` (text array, searchable tags)
      - `price` (numeric, course price - 0 for free)
      - `is_featured` (boolean, featured course flag)
      - `is_published` (boolean, publication status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `courses` table
    - Add policy for public read access to published courses
    - Add policy for admin write access (future implementation)

  3. Performance
    - Add indexes for common queries (category, level, featured, published)
    - Add full-text search index for title and description
</*/

-- Create enum for course levels
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  level course_level NOT NULL DEFAULT 'beginner',
  thumbnail_url text,
  duration text NOT NULL DEFAULT '0h 0m',
  rating numeric(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  students_count integer DEFAULT 0 CHECK (students_count >= 0),
  instructor_name text,
  instructor_bio text,
  course_content jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  price numeric(10,2) DEFAULT 0.00 CHECK (price >= 0),
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to published courses
CREATE POLICY "Published courses are viewable by everyone"
  ON courses
  FOR SELECT
  TO authenticated, anon
  USING (is_published = true);

-- Create policy for admin write access (placeholder for future admin system)
CREATE POLICY "Admins can manage courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (false) -- Will be updated when admin system is implemented
  WITH CHECK (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses (category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses (level);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses (rating DESC);
CREATE INDEX IF NOT EXISTS idx_courses_students ON courses (students_count DESC);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses (created_at DESC);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin(to_tsvector('english', title || ' ' || description));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample courses data to match the UI
INSERT INTO courses (title, description, category, level, thumbnail_url, duration, rating, students_count, instructor_name, course_content, tags, is_featured) VALUES
(
  'Digital Marketing Fundamentals',
  'Learn the basics of digital marketing including SEO, social media, and content marketing',
  'Marketing',
  'beginner',
  'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
  '4h 30m',
  4.8,
  1250,
  'Sarah Johnson',
  '[
    {"title": "Introduction to Digital Marketing", "duration": "45m"},
    {"title": "SEO Fundamentals", "duration": "1h 15m"},
    {"title": "Social Media Marketing", "duration": "1h 30m"},
    {"title": "Content Marketing Strategy", "duration": "1h 0m"}
  ]'::jsonb,
  ARRAY['marketing', 'seo', 'social-media', 'content'],
  true
),
(
  'Financial Planning for Startups',
  'Master financial forecasting, budgeting, and funding strategies for new businesses',
  'Finance',
  'intermediate',
  'https://images.pexels.com/photos/95916/pexels-photo-95916.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
  '6h 15m',
  4.9,
  890,
  'Michael Chen',
  '[
    {"title": "Financial Fundamentals", "duration": "1h 30m"},
    {"title": "Budgeting and Forecasting", "duration": "2h 0m"},
    {"title": "Funding Strategies", "duration": "1h 45m"},
    {"title": "Financial Modeling", "duration": "1h 0m"}
  ]'::jsonb,
  ARRAY['finance', 'budgeting', 'funding', 'startups'],
  true
),
(
  'Operations Management Excellence',
  'Optimize your business operations with lean methodologies and process improvement',
  'Operations',
  'advanced',
  'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
  '5h 45m',
  4.7,
  634,
  'David Rodriguez',
  '[
    {"title": "Operations Strategy", "duration": "1h 15m"},
    {"title": "Lean Methodologies", "duration": "2h 0m"},
    {"title": "Process Improvement", "duration": "1h 30m"},
    {"title": "Quality Management", "duration": "1h 0m"}
  ]'::jsonb,
  ARRAY['operations', 'lean', 'process-improvement', 'quality'],
  false
),
(
  'Strategic Business Planning',
  'Develop comprehensive business strategies and competitive analysis skills',
  'Strategy',
  'intermediate',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
  '7h 20m',
  4.8,
  1120,
  'Emily Watson',
  '[
    {"title": "Strategic Thinking", "duration": "1h 30m"},
    {"title": "Market Analysis", "duration": "2h 15m"},
    {"title": "Competitive Strategy", "duration": "2h 0m"},
    {"title": "Implementation Planning", "duration": "1h 35m"}
  ]'::jsonb,
  ARRAY['strategy', 'planning', 'analysis', 'competition'],
  true
),
(
  'Leadership and Team Management',
  'Build effective leadership skills and learn to manage high-performing teams',
  'Leadership',
  'beginner',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
  '4h 10m',
  4.6,
  987,
  'Robert Kim',
  '[
    {"title": "Leadership Fundamentals", "duration": "1h 0m"},
    {"title": "Team Building", "duration": "1h 30m"},
    {"title": "Communication Skills", "duration": "1h 0m"},
    {"title": "Performance Management", "duration": "40m"}
  ]'::jsonb,
  ARRAY['leadership', 'management', 'teams', 'communication'],
  false
),
(
  'Advanced Financial Analysis',
  'Deep dive into financial modeling, valuation, and investment analysis',
  'Finance',
  'advanced',
  'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
  '8h 30m',
  4.9,
  456,
  'Jennifer Liu',
  '[
    {"title": "Financial Modeling", "duration": "2h 30m"},
    {"title": "Valuation Methods", "duration": "2h 15m"},
    {"title": "Investment Analysis", "duration": "2h 0m"},
    {"title": "Risk Assessment", "duration": "1h 45m"}
  ]'::jsonb,
  ARRAY['finance', 'modeling', 'valuation', 'investment'],
  false
);