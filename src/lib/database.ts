/**
 * Database Service Module
 * 
 * This module provides a comprehensive interface for all database operations
 * in the BizGenius application. It handles chat history, business plans, and
 * user profiles with proper error handling and type safety.
 * 
 * Key Features:
 * - Chat history management with bookmarking
 * - Business plan CRUD operations
 * - User profile management
 * - Real-time data synchronization
 * - Comprehensive error handling
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */

import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Chat History Interfaces
 */
export interface ChatHistoryRecord {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  is_bookmarked: boolean;
  conversation_id: string;
  message_type: 'interaction' | 'system' | 'error';
  tokens_used: number;
  model_used: string;
  response_time_ms: number;
  created_at: string;
  updated_at: string;
}

export interface CreateChatHistoryInput {
  question: string;
  answer: string;
  conversation_id?: string;
  message_type?: 'interaction' | 'system' | 'error';
  tokens_used?: number;
  model_used?: string;
  response_time_ms?: number;
}

/**
 * Business Plan Interfaces
 */
export interface BusinessPlanRecord {
  id: string;
  user_id: string;
  business_name: string;
  industry: string;
  business_type: string;
  location: string;
  target_audience: string;
  value_proposition: string;
  revenue_model: string;
  goals: string;
  generated_plan: any[];
  title: string;
  status: 'draft' | 'complete' | 'archived';
  sections_count: number;
  ai_model_used: string;
  generation_time_ms: number;
  last_modified_at: string;
  is_favorite: boolean;
  export_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessPlanInput {
  business_name: string;
  industry: string;
  business_type: string;
  location: string;
  target_audience: string;
  value_proposition: string;
  revenue_model?: string;
  goals?: string;
  generated_plan: any[];
  title: string;
  ai_model_used?: string;
  generation_time_ms?: number;
}

/**
 * Database Service Class
 * 
 * Main class for handling all database operations with proper error handling
 * and type safety. Provides methods for chat history and business plan management.
 */
export class DatabaseService {
  /**
   * Get current authenticated user
   */
  private async getCurrentUser(): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  // ==================== CHAT HISTORY METHODS ====================

  /**
   * Save chat interaction to database
   */
  async saveChatHistory(input: CreateChatHistoryInput): Promise<ChatHistoryRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          question: input.question,
          answer: input.answer,
          conversation_id: input.conversation_id || crypto.randomUUID(),
          message_type: input.message_type || 'interaction',
          tokens_used: input.tokens_used || 0,
          model_used: input.model_used || 'tngtech/deepseek-r1t2-chimera:free',
          response_time_ms: input.response_time_ms || 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving chat history:', error);
      throw new Error('Failed to save chat history');
    }
  }

  /**
   * Get user's chat history with pagination
   */
  async getChatHistory(limit: number = 50, offset: number = 0): Promise<ChatHistoryRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  /**
   * Get bookmarked chat history
   */
  async getBookmarkedChats(): Promise<ChatHistoryRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_bookmarked', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookmarked chats:', error);
      throw new Error('Failed to fetch bookmarked chats');
    }
  }

  /**
   * Toggle bookmark status of a chat
   */
  async toggleChatBookmark(chatId: string): Promise<ChatHistoryRecord> {
    try {
      const user = await this.getCurrentUser();
      
      // First get current bookmark status
      // Validate that messageId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(messageId)) {
        throw new Error('Invalid message ID format. Cannot bookmark message that is not saved to database.');
      }
      
      const { data: currentData, error: fetchError } = await supabase
        .from('chat_history')
        .select('is_bookmarked')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the bookmark status
      const { data, error } = await supabase
        .from('chat_history')
        .update({ is_bookmarked: !currentData.is_bookmarked })
        .eq('id', chatId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling chat bookmark:', error);
      throw new Error('Failed to toggle bookmark');
    }
  }

  /**
   * Delete chat history record
   */
  async deleteChatHistory(chatId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting chat history:', error);
      throw new Error('Failed to delete chat history');
    }
  }

  /**
   * Clear all chat history for user
   */
  async clearAllChatHistory(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error('Failed to clear chat history');
    }
  }

  // ==================== BUSINESS PLAN METHODS ====================

  /**
   * Save business plan to database
   */
  async saveBusinessPlan(input: CreateBusinessPlanInput): Promise<BusinessPlanRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('business_plans')
        .insert({
          user_id: user.id,
          business_name: input.business_name,
          industry: input.industry,
          business_type: input.business_type,
          location: input.location,
          target_audience: input.target_audience,
          value_proposition: input.value_proposition,
          revenue_model: input.revenue_model || '',
          goals: input.goals || '',
          generated_plan: input.generated_plan,
          title: input.title,
          ai_model_used: input.ai_model_used || 'tngtech/deepseek-r1t2-chimera:free',
          generation_time_ms: input.generation_time_ms || 0,
          status: 'complete'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving business plan:', error);
      throw new Error('Failed to save business plan');
    }
  }

  /**
   * Get user's business plans
   */
  async getBusinessPlans(): Promise<BusinessPlanRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching business plans:', error);
      throw new Error('Failed to fetch business plans');
    }
  }

  /**
   * Get single business plan by ID
   */
  async getBusinessPlan(planId: string): Promise<BusinessPlanRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching business plan:', error);
      throw new Error('Failed to fetch business plan');
    }
  }

  /**
   * Update business plan
   */
  async updateBusinessPlan(planId: string, updates: Partial<BusinessPlanRecord>): Promise<BusinessPlanRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('business_plans')
        .update({
          ...updates,
          last_modified_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating business plan:', error);
      throw new Error('Failed to update business plan');
    }
  }

  // ==================== PROFILE METHODS ====================

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    phone?: string;
    location?: string;
    company?: string;
    position?: string;
    bio?: string;
    website?: string;
    linkedin_url?: string;
    twitter_url?: string;
  }): Promise<any> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<any> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
  }

  /**
   * Toggle favorite status of business plan
   */
  async toggleBusinessPlanFavorite(planId: string): Promise<BusinessPlanRecord> {
    try {
      const user = await this.getCurrentUser();
      
      // Get current favorite status
      const { data: currentData, error: fetchError } = await supabase
        .from('business_plans')
        .select('is_favorite')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle favorite status
      const { data, error } = await supabase
        .from('business_plans')
        .update({ is_favorite: !currentData.is_favorite })
        .eq('id', planId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling business plan favorite:', error);
      throw new Error('Failed to toggle favorite');
    }
  }

  /**
   * Increment export count for business plan
   */
  async incrementExportCount(planId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('business_plans')
        .update({ 
          export_count: supabase.raw('export_count + 1')
        })
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing export count:', error);
      throw new Error('Failed to update export count');
    }
  }

  /**
   * Delete business plan
   */
  async deleteBusinessPlan(planId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('business_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting business plan:', error);
      throw new Error('Failed to delete business plan');
    }
  }

  /**
   * Get favorite business plans
   */
  async getFavoriteBusinessPlans(): Promise<BusinessPlanRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching favorite business plans:', error);
      throw new Error('Failed to fetch favorite business plans');
    }
  }

  // ==================== COURSES METHODS ====================

  /**
   * Get all published courses
   */
  async getCourses(): Promise<CourseRecord[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  /**
   * Get courses by category
   */
  async getCoursesByCategory(category: string): Promise<CourseRecord[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses by category:', error);
      throw new Error('Failed to fetch courses by category');
    }
  }

  /**
   * Get courses by level
   */
  async getCoursesByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<CourseRecord[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .eq('level', level)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching courses by level:', error);
      throw new Error('Failed to fetch courses by level');
    }
  }

  /**
   * Get featured courses
   */
  async getFeaturedCourses(): Promise<CourseRecord[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      throw new Error('Failed to fetch featured courses');
    }
  }

  /**
   * Get single course by ID
   */
  async getCourse(courseId: string): Promise<CourseRecord> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course');
    }
  }

  // ==================== LESSONS METHODS ====================

  /**
   * Get lessons for a course
   */
  async getLessonsByCourse(courseId: string): Promise<LessonRecord[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw new Error('Failed to fetch lessons');
    }
  }

  /**
   * Get preview lessons (free lessons)
   */
  async getPreviewLessons(): Promise<LessonRecord[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .eq('is_preview', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching preview lessons:', error);
      throw new Error('Failed to fetch preview lessons');
    }
  }

  /**
   * Get single lesson by ID
   */
  async getLesson(lessonId: string): Promise<LessonRecord> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw new Error('Failed to fetch lesson');
    }
  }

  /**
   * Search courses by title or description
   */
  async searchCourses(query: string): Promise<CourseRecord[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .textSearch('title', query)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching courses:', error);
      throw new Error('Failed to search courses');
    }
  }

  // ==================== USER PROGRESS METHODS ====================

  /**
   * Mark lesson as completed
   */
  async markLessonCompleted(lessonId: string): Promise<UserProgressRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking lesson completed:', error);
      throw new Error('Failed to mark lesson as completed');
    }
  }

  /**
   * Mark lesson as incomplete
   */
  async markLessonIncomplete(lessonId: string): Promise<UserProgressRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking lesson incomplete:', error);
      throw new Error('Failed to mark lesson as incomplete');
    }
  }

  /**
   * Get user's progress for a specific course
   */
  async getCourseProgress(courseId: string): Promise<CourseProgressSummary> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .rpc('get_course_progress', {
          p_user_id: user.id,
          p_course_id: courseId
        })
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting course progress:', error);
      throw new Error('Failed to get course progress');
    }
  }

  /**
   * Get user's overall learning statistics
   */
  async getUserLearningStats(): Promise<UserLearningStats> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .rpc('get_user_learning_stats', {
          p_user_id: user.id
        })
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user learning stats:', error);
      throw new Error('Failed to get learning statistics');
    }
  }

  /**
   * Get user's progress for multiple courses
   */
  async getMultipleCourseProgress(courseIds: string[]): Promise<Record<string, CourseProgressSummary>> {
    try {
      const user = await this.getCurrentUser();
      const progressMap: Record<string, CourseProgressSummary> = {};
      
      // Get progress for each course
      for (const courseId of courseIds) {
        try {
          const progress = await this.getCourseProgress(courseId);
          progressMap[courseId] = progress;
        } catch (error) {
          // If error getting progress for a course, set default values
          progressMap[courseId] = {
            total_lessons: 0,
            completed_lessons: 0,
            progress_percentage: 0,
            last_completed_at: null
          };
        }
      }
      
      return progressMap;
    } catch (error) {
      console.error('Error getting multiple course progress:', error);
      throw new Error('Failed to get course progress');
    }
  }

  /**
   * Get user's lesson progress for a specific course
   */
  async getLessonProgress(courseId: string): Promise<UserProgressRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          lessons!inner(
            id,
            course_id,
            title,
            order
          )
        `)
        .eq('user_id', user.id)
        .eq('lessons.course_id', courseId)
        .order('lessons.order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      throw new Error('Failed to get lesson progress');
    }
  }

  // ==================== NOTES METHODS ====================

  /**
   * Create a new note
   */
  async createNote(input: CreateNoteInput): Promise<NoteRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          content: input.content,
          type: input.type,
          related_id: input.related_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note');
    }
  }

  /**
   * Get user's notes with optional filtering
   */
  async getNotes(
    type?: 'assistant' | 'lesson',
    relatedId?: string,
    limit: number = 50
  ): Promise<NoteRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      if (relatedId) {
        query = query.eq('related_id', relatedId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw new Error('Failed to fetch notes');
    }
  }

  /**
   * Get notes for a specific lesson
   */
  async getLessonNotes(lessonId: string): Promise<NoteRecord[]> {
    return this.getNotes('lesson', lessonId);
  }

  /**
   * Get notes for a specific assistant chat
   */
  async getAssistantNotes(chatId: string): Promise<NoteRecord[]> {
    return this.getNotes('assistant', chatId);
  }

  /**
   * Update a note
   */
  async updateNote(noteId: string, content: string): Promise<NoteRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('notes')
        .update({ content })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  /**
   * Search notes by content
   */
  async searchNotes(
    query: string,
    type?: 'assistant' | 'lesson'
  ): Promise<NoteRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      let dbQuery = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false });

      if (type) {
        dbQuery = dbQuery.eq('type', type);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching notes:', error);
      throw new Error('Failed to search notes');
    }
  }

  // ==================== BOOKMARKS METHODS ====================

  /**
   * Create a new bookmark
   */
  async createBookmark(input: CreateBookmarkInput): Promise<BookmarkRecord> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          type: input.type,
          related_id: input.related_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw new Error('Failed to create bookmark');
    }
  }

  /**
   * Get user's bookmarks with optional filtering
   */
  async getBookmarks(
    type?: 'lesson' | 'chat',
    limit: number = 50
  ): Promise<BookmarkRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      let query = supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw new Error('Failed to fetch bookmarks');
    }
  }

  /**
   * Get bookmarks for lessons
   */
  async getLessonBookmarks(): Promise<BookmarkRecord[]> {
    return this.getBookmarks('lesson');
  }

  /**
   * Get bookmarks for chat responses
   */
  async getChatBookmarks(): Promise<BookmarkRecord[]> {
    return this.getBookmarks('chat');
  }

  /**
   * Check if item is bookmarked
   */
  async isBookmarked(type: 'lesson' | 'chat', relatedId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('related_id', relatedId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  /**
   * Toggle bookmark status
   */
  async toggleBookmark(type: 'lesson' | 'chat', relatedId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      // Check if bookmark exists
      const { data: existing, error: fetchError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('related_id', relatedId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existing) {
        // Remove bookmark
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;
        return false; // Not bookmarked anymore
      } else {
        // Create bookmark
        await this.createBookmark({ type, related_id: relatedId });
        return true; // Now bookmarked
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw new Error('Failed to toggle bookmark');
    }
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw new Error('Failed to delete bookmark');
    }
  }

  /**
   * Get bookmarked lessons with lesson details
   */
  async getBookmarkedLessonsWithDetails(): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      
      // First, get all lesson bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'lesson')
        .order('created_at', { ascending: false });

      if (bookmarksError) throw bookmarksError;
      if (!bookmarks || bookmarks.length === 0) return [];

      // Get lesson IDs from bookmarks
      const lessonIds = bookmarks.map(bookmark => bookmark.related_id);

      // Fetch lesson details with course information
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          duration,
          course_id,
          courses!inner(
            title,
            category
          )
        `)
        .in('id', lessonIds);

      if (lessonsError) throw lessonsError;

      // Combine bookmarks with lesson details
      const result = bookmarks.map(bookmark => {
        const lesson = lessons?.find(l => l.id === bookmark.related_id);
        return {
          ...bookmark,
          lessons: lesson || null
        };
      }).filter(item => item.lessons !== null);

      return result;
    } catch (error) {
      console.error('Error fetching bookmarked lessons:', error);
      throw new Error('Failed to fetch bookmarked lessons');
    }
  }

  /**
   * Get bookmarked chats with chat details
   */
  async getBookmarkedChatsWithDetails(): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      
      // First, get all chat bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'chat')
        .order('created_at', { ascending: false });

      if (bookmarksError) throw bookmarksError;
      if (!bookmarks || bookmarks.length === 0) return [];

      // Get chat IDs from bookmarks
      const chatIds = bookmarks.map(bookmark => bookmark.related_id);

      // Fetch chat history details
      const { data: chats, error: chatsError } = await supabase
        .from('chat_history')
        .select(`
          id,
          question,
          answer,
          created_at
        `)
        .in('id', chatIds);

      if (chatsError) throw chatsError;

      // Combine bookmarks with chat details
      const result = bookmarks.map(bookmark => {
        const chat = chats?.find(c => c.id === bookmark.related_id);
        return {
          ...bookmark,
          chat_history: chat || null
        };
      }).filter(item => item.chat_history !== null);

      return result;
    } catch (error) {
      console.error('Error fetching bookmarked chats:', error);
      throw new Error('Failed to fetch bookmarked chats');
    }
  }
}

/**
 * Course Interfaces
 */
export interface CourseRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail_url: string;
  duration: string;
  rating: number;
  students_count: number;
  instructor_name: string;
  instructor_bio: string;
  course_content: any[];
  tags: string[];
  price: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Lesson Interfaces
 */
export interface LessonRecord {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  transcript: string;
  order: number;
  duration: string;
  description: string;
  resources: any[];
  quiz_questions: any[];
  is_preview: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User Progress Interfaces
 */
export interface UserProgressRecord {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseProgressSummary {
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  last_completed_at: string | null;
}

export interface UserLearningStats {
  total_courses_started: number;
  total_courses_completed: number;
  total_lessons_completed: number;
  total_learning_time_minutes: number;
  current_streak_days: number;
  last_activity_date: string | null;
}

/**
 * Notes Interfaces
 */
export interface NoteRecord {
  id: string;
  user_id: string;
  content: string;
  type: 'assistant' | 'lesson';
  related_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  content: string;
  type: 'assistant' | 'lesson';
  related_id: string;
}

/**
 * Bookmarks Interfaces
 */
export interface BookmarkRecord {
  id: string;
  user_id: string;
  type: 'lesson' | 'chat';
  related_id: string;
  created_at: string;
}

export interface CreateBookmarkInput {
  type: 'lesson' | 'chat';
  related_id: string;
}

/**
 * Singleton Database Service Instance
 * 
 * Pre-configured DatabaseService instance ready for immediate use.
 * This singleton pattern ensures consistent database access across the app.
 */
export const databaseService = new DatabaseService();

/**
 * Type Exports for TypeScript Support
 */
export type { 
  ChatHistoryRecord, 
  CreateChatHistoryInput, 
  BusinessPlanRecord, 
  CreateBusinessPlanInput,
  CourseRecord,
  LessonRecord,
  UserProgressRecord,
  CourseProgressSummary,
  UserLearningStats,
  NoteRecord,
  CreateNoteInput,
  BookmarkRecord,
  CreateBookmarkInput
};