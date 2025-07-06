export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface StudyCycleDatabase {
  study_cycle: {
    Tables: {
      sc_textbooks: {
        Row: {
          id: string
          creator_id: string | null
          title: string
          description: string | null
          cover_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id?: string | null
          title: string
          description?: string | null
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string | null
          title?: string
          description?: string | null
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sc_chapters: {
        Row: {
          id: string
          textbook_id: string
          title: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          textbook_id: string
          title: string
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          textbook_id?: string
          title?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      sc_questions: {
        Row: {
          id: string
          chapter_id: string
          question_text: string
          question_type: 'multiple_choice' | 'short_answer' | 'template_based'
          options: Json | null
          solution_template: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          question_text: string
          question_type: 'multiple_choice' | 'short_answer' | 'template_based'
          options?: Json | null
          solution_template?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'short_answer' | 'template_based'
          options?: Json | null
          solution_template?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sc_assessments: {
        Row: {
          id: string
          user_id: string
          title: string
          status: 'in_progress' | 'completed'
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          status?: 'in_progress' | 'completed'
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          status?: 'in_progress' | 'completed'
          started_at?: string
          completed_at?: string | null
        }
      }
      sc_user_answers: {
        Row: {
          id: string
          assessment_id: string
          user_id: string
          question_id: string
          user_answer: string | null
          is_correct: boolean | null
          score: number | null
          submitted_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          user_id: string
          question_id: string
          user_answer?: string | null
          is_correct?: boolean | null
          score?: number | null
          submitted_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          user_id?: string
          question_id?: string
          user_answer?: string | null
          is_correct?: boolean | null
          score?: number | null
          submitted_at?: string
        }
      }
      sc_user_textbook_progress: {
        Row: {
          user_id: string
          textbook_id: string
          read_count: number
          total_study_duration_seconds: number
          updated_at: string
        }
        Insert: {
          user_id: string
          textbook_id: string
          read_count?: number
          total_study_duration_seconds?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          textbook_id?: string
          read_count?: number
          total_study_duration_seconds?: number
          updated_at?: string
        }
      }
      sc_study_sessions: {
        Row: {
          id: string
          user_id: string
          textbook_id: string
          chapter_id: string | null
          start_time: string
          end_time: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          textbook_id: string
          chapter_id?: string | null
          start_time: string
          end_time?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          textbook_id?: string
          chapter_id?: string | null
          start_time?: string
          end_time?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
      }
      sc_readings: {
        Row: {
          id: string
          user_id: string
          textbook_id: string
          round: number
          status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned'
          started_at: string | null
          completed_at: string | null
          last_accessed_at: string | null
          daily_pages_target: number | null
          weekly_hours_target: number | null
          completion_deadline: string | null
          total_time_minutes: number
          total_pages_read: number
          notes: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          user_id: string
          textbook_id: string
          round: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned'
          started_at?: string | null
          completed_at?: string | null
          last_accessed_at?: string | null
          daily_pages_target?: number | null
          weekly_hours_target?: number | null
          completion_deadline?: string | null
          total_time_minutes?: number
          total_pages_read?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          user_id?: string
          textbook_id?: string
          round?: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned'
          started_at?: string | null
          completed_at?: string | null
          last_accessed_at?: string | null
          daily_pages_target?: number | null
          weekly_hours_target?: number | null
          completion_deadline?: string | null
          total_time_minutes?: number
          total_pages_read?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      sc_reading_progress: {
        Row: {
          id: string
          reading_id: string
          chapter_id: string
          pages_read: number
          time_spent_minutes: number
          comprehension_rating: number | null
          difficulty_rating: number | null
          notes: string | null
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reading_id: string
          chapter_id: string
          pages_read?: number
          time_spent_minutes?: number
          comprehension_rating?: number | null
          difficulty_rating?: number | null
          notes?: string | null
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reading_id?: string
          chapter_id?: string
          pages_read?: number
          time_spent_minutes?: number
          comprehension_rating?: number | null
          difficulty_rating?: number | null
          notes?: string | null
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      reading_status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'abandoned'
      question_type: 'multiple_choice' | 'short_answer' | 'template_based'
      assessment_status: 'in_progress' | 'completed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type StudyCycleSchema = StudyCycleDatabase['study_cycle']
export type StudyCycleTables = StudyCycleSchema['Tables']
export type StudyCycleEnums = StudyCycleSchema['Enums']

// Table type shortcuts
export type Textbook = StudyCycleTables['sc_textbooks']['Row']
export type TextbookInsert = StudyCycleTables['sc_textbooks']['Insert']
export type TextbookUpdate = StudyCycleTables['sc_textbooks']['Update']

export type Chapter = StudyCycleTables['sc_chapters']['Row']
export type ChapterInsert = StudyCycleTables['sc_chapters']['Insert']
export type ChapterUpdate = StudyCycleTables['sc_chapters']['Update']

export type Question = StudyCycleTables['sc_questions']['Row']
export type QuestionInsert = StudyCycleTables['sc_questions']['Insert']
export type QuestionUpdate = StudyCycleTables['sc_questions']['Update']

export type Assessment = StudyCycleTables['sc_assessments']['Row']
export type AssessmentInsert = StudyCycleTables['sc_assessments']['Insert']
export type AssessmentUpdate = StudyCycleTables['sc_assessments']['Update']

export type UserAnswer = StudyCycleTables['sc_user_answers']['Row']
export type UserAnswerInsert = StudyCycleTables['sc_user_answers']['Insert']
export type UserAnswerUpdate = StudyCycleTables['sc_user_answers']['Update']

export type UserTextbookProgress = StudyCycleTables['sc_user_textbook_progress']['Row']
export type UserTextbookProgressInsert = StudyCycleTables['sc_user_textbook_progress']['Insert']
export type UserTextbookProgressUpdate = StudyCycleTables['sc_user_textbook_progress']['Update']

export type StudySession = StudyCycleTables['sc_study_sessions']['Row']
export type StudySessionInsert = StudyCycleTables['sc_study_sessions']['Insert']
export type StudySessionUpdate = StudyCycleTables['sc_study_sessions']['Update']

export type Reading = StudyCycleTables['sc_readings']['Row']
export type ReadingInsert = StudyCycleTables['sc_readings']['Insert']
export type ReadingUpdate = StudyCycleTables['sc_readings']['Update']

export type ReadingProgress = StudyCycleTables['sc_reading_progress']['Row']
export type ReadingProgressInsert = StudyCycleTables['sc_reading_progress']['Insert']
export type ReadingProgressUpdate = StudyCycleTables['sc_reading_progress']['Update']

// Enum type shortcuts
export type ReadingStatus = StudyCycleEnums['reading_status']
export type QuestionType = StudyCycleEnums['question_type']
export type AssessmentStatus = StudyCycleEnums['assessment_status']

// Branded types for type safety
export type TextbookId = string & { readonly __brand: 'TextbookId' }
export type ChapterId = string & { readonly __brand: 'ChapterId' }
export type QuestionId = string & { readonly __brand: 'QuestionId' }
export type AssessmentId = string & { readonly __brand: 'AssessmentId' }
export type ReadingId = string & { readonly __brand: 'ReadingId' }
export type StudySessionId = string & { readonly __brand: 'StudySessionId' }
export type UserId = string & { readonly __brand: 'UserId' }
