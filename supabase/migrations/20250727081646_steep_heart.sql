/*
  # Create lessons table for course content

  1. New Tables
    - `lessons`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `title` (text)
      - `video_url` (text)
      - `transcript` (text)
      - `order` (integer for lesson sequencing)
      - `duration` (text, e.g., "15:30")
      - `description` (text, lesson summary)
      - `resources` (jsonb, downloadable materials)
      - `quiz_questions` (jsonb, lesson quiz data)
      - `is_preview` (boolean, free preview lessons)
      - `is_published` (boolean, publication status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `lessons` table
    - Add policy for public access to published lessons
    - Add policy for admin management (placeholder)

  3. Performance
    - Index on course_id for fast course lesson queries
    - Index on order for proper lesson sequencing
    - Index on is_published for filtering
    - Unique constraint on course_id + order
*/

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text,
  transcript text,
  "order" integer NOT NULL,
  duration text DEFAULT '0:00',
  description text,
  resources jsonb DEFAULT '[]'::jsonb,
  quiz_questions jsonb DEFAULT '[]'::jsonb,
  is_preview boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, "order");
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_lessons_preview ON lessons(is_preview) WHERE is_preview = true;

-- Unique constraint for lesson ordering within courses
ALTER TABLE lessons ADD CONSTRAINT unique_course_lesson_order 
  UNIQUE (course_id, "order");

-- Add check constraint for positive order
ALTER TABLE lessons ADD CONSTRAINT lessons_order_positive 
  CHECK ("order" > 0);

-- RLS Policies
CREATE POLICY "Published lessons are viewable by everyone"
  ON lessons
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage lessons"
  ON lessons
  FOR ALL
  TO authenticated
  USING (false)  -- Placeholder - will be updated when admin system is implemented
  WITH CHECK (false);

-- Create updated_at trigger
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample lessons for existing courses
INSERT INTO lessons (course_id, title, video_url, transcript, "order", duration, description, is_preview) VALUES
-- Digital Marketing Fundamentals lessons
((SELECT id FROM courses WHERE title = 'Digital Marketing Fundamentals'), 'Introduction to Digital Marketing', 'https://example.com/video1', 'Welcome to digital marketing...', 1, '12:30', 'Overview of digital marketing landscape and key concepts', true),
((SELECT id FROM courses WHERE title = 'Digital Marketing Fundamentals'), 'SEO Fundamentals', 'https://example.com/video2', 'Search Engine Optimization basics...', 2, '18:45', 'Learn the basics of search engine optimization', false),
((SELECT id FROM courses WHERE title = 'Digital Marketing Fundamentals'), 'Social Media Marketing', 'https://example.com/video3', 'Social media strategies...', 3, '22:15', 'Effective social media marketing strategies', false),
((SELECT id FROM courses WHERE title = 'Digital Marketing Fundamentals'), 'Content Marketing Strategy', 'https://example.com/video4', 'Creating compelling content...', 4, '16:20', 'Build a comprehensive content marketing strategy', false),

-- Financial Planning for Startups lessons
((SELECT id FROM courses WHERE title = 'Financial Planning for Startups'), 'Financial Planning Basics', 'https://example.com/video5', 'Introduction to startup finances...', 1, '14:10', 'Essential financial planning concepts for startups', true),
((SELECT id FROM courses WHERE title = 'Financial Planning for Startups'), 'Creating Financial Projections', 'https://example.com/video6', 'Building realistic projections...', 2, '25:30', 'Learn to create accurate financial forecasts', false),
((SELECT id FROM courses WHERE title = 'Financial Planning for Startups'), 'Funding Strategies', 'https://example.com/video7', 'Different funding options...', 3, '19:45', 'Explore various funding options for startups', false),

-- Operations Management Excellence lessons
((SELECT id FROM courses WHERE title = 'Operations Management Excellence'), 'Operations Overview', 'https://example.com/video8', 'Introduction to operations...', 1, '11:20', 'Understanding operations management fundamentals', true),
((SELECT id FROM courses WHERE title = 'Operations Management Excellence'), 'Lean Methodologies', 'https://example.com/video9', 'Implementing lean practices...', 2, '28:15', 'Apply lean principles to improve efficiency', false),
((SELECT id FROM courses WHERE title = 'Operations Management Excellence'), 'Process Optimization', 'https://example.com/video10', 'Optimizing business processes...', 3, '21:30', 'Techniques for process improvement and optimization', false),

-- Strategic Business Planning lessons
((SELECT id FROM courses WHERE title = 'Strategic Business Planning'), 'Strategy Fundamentals', 'https://example.com/video11', 'Strategic planning basics...', 1, '13:45', 'Core concepts of strategic business planning', true),
((SELECT id FROM courses WHERE title = 'Strategic Business Planning'), 'Competitive Analysis', 'https://example.com/video12', 'Analyzing competition...', 2, '20:10', 'Conduct thorough competitive analysis', false),
((SELECT id FROM courses WHERE title = 'Strategic Business Planning'), 'Strategic Implementation', 'https://example.com/video13', 'Executing strategy...', 3, '24:20', 'Turn strategic plans into actionable results', false),

-- Leadership and Team Management lessons
((SELECT id FROM courses WHERE title = 'Leadership and Team Management'), 'Leadership Principles', 'https://example.com/video14', 'Core leadership concepts...', 1, '10:30', 'Essential leadership principles and practices', true),
((SELECT id FROM courses WHERE title = 'Leadership and Team Management'), 'Team Building', 'https://example.com/video15', 'Building effective teams...', 2, '17:25', 'Strategies for building high-performing teams', false),
((SELECT id FROM courses WHERE title = 'Leadership and Team Management'), 'Communication Skills', 'https://example.com/video16', 'Effective communication...', 3, '15:40', 'Master communication skills for leaders', false),

-- Advanced Financial Analysis lessons
((SELECT id FROM courses WHERE title = 'Advanced Financial Analysis'), 'Financial Modeling', 'https://example.com/video17', 'Advanced modeling techniques...', 1, '26:15', 'Build sophisticated financial models', true),
((SELECT id FROM courses WHERE title = 'Advanced Financial Analysis'), 'Valuation Methods', 'https://example.com/video18', 'Company valuation approaches...', 2, '31:20', 'Learn various business valuation methodologies', false),
((SELECT id FROM courses WHERE title = 'Advanced Financial Analysis'), 'Investment Analysis', 'https://example.com/video19', 'Analyzing investments...', 3, '23:45', 'Evaluate investment opportunities effectively', false);