-- Assessment Domain Database Schema
-- PosMul Platform - Assessment Context
-- Created for SC-017 MCP Assessment Repository

-- Solution Templates Table
CREATE TABLE IF NOT EXISTS solution_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('multiple-choice', 'essay', 'short-answer', 'coding')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived')),
  creator_id UUID NOT NULL,
  total_points DECIMAL(10,2) DEFAULT 0,
  time_limit INTEGER, -- in minutes
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  allowed_attempts INTEGER DEFAULT 1,
  passing_score DECIMAL(5,2) DEFAULT 60.0,
  is_randomized BOOLEAN DEFAULT false,
  show_results BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_passing_score CHECK (passing_score >= 0 AND passing_score <= 100),
  CONSTRAINT valid_attempts CHECK (allowed_attempts > 0),
  CONSTRAINT valid_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date < end_date)
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  template_id UUID REFERENCES solution_templates(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple-choice', 'short-answer', 'essay', 'coding')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  points DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  options JSONB, -- for multiple choice questions
  correct_answer TEXT,
  grading_criteria TEXT,
  time_limit INTEGER, -- in minutes
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_points CHECK (points > 0)
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  answer JSONB NOT NULL, -- can store various answer formats
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'in-progress', 'completed', 'failed')),
  score DECIMAL(10,2),
  feedback TEXT,
  time_spent INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_score CHECK (score IS NULL OR score >= 0),
  CONSTRAINT valid_time_spent CHECK (time_spent IS NULL OR time_spent >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_creator ON assessments(creator_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_dates ON assessments(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_questions_assessment ON questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_template ON questions(template_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

CREATE INDEX IF NOT EXISTS idx_submissions_question ON submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(grading_status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

CREATE INDEX IF NOT EXISTS idx_solution_templates_type ON solution_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_solution_templates_active ON solution_templates(is_active);

-- RLS (Row Level Security) Policies
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_templates ENABLE ROW LEVEL SECURITY;

-- Assessment policies
CREATE POLICY "Users can view published assessments" ON assessments
  FOR SELECT USING (status IN ('published', 'active') OR creator_id = auth.uid());

CREATE POLICY "Users can create assessments" ON assessments
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their assessments" ON assessments
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their assessments" ON assessments
  FOR DELETE USING (creator_id = auth.uid());

-- Question policies
CREATE POLICY "Users can view questions from accessible assessments" ON questions
  FOR SELECT USING (
    assessment_id IN (
      SELECT id FROM assessments 
      WHERE status IN ('published', 'active') OR creator_id = auth.uid()
    )
  );

CREATE POLICY "Assessment creators can manage questions" ON questions
  FOR ALL USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE creator_id = auth.uid()
    )
  );

-- Submission policies
CREATE POLICY "Students can view their own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Assessment creators can view all submissions" ON submissions
  FOR SELECT USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN assessments a ON q.assessment_id = a.id
      WHERE a.creator_id = auth.uid()
    )
  );

-- Solution template policies
CREATE POLICY "Users can view active templates" ON solution_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage templates" ON solution_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solution_templates_updated_at BEFORE UPDATE ON solution_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();