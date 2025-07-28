/**
 * Bookmarks Panel Component
 * 
 * A comprehensive bookmarks management component for both chat responses and lessons.
 * Displays bookmarked content with filtering and management capabilities.
 * 
 * Key Features:
 * - View bookmarked chat responses and lessons
 * - Filter bookmarks by type (chat/lesson)
 * - Remove bookmarks with confirmation
 * - Navigate to original content
 * - Mobile-responsive design
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  MessageSquare, 
  BookOpen, 
  Trash2, 
  ExternalLink,
  Filter,
  Loader2,
  BookmarkX
} from 'lucide-react';
import { databaseService, type BookmarkRecord } from '../lib/database';

interface BookmarksPanelProps {
  className?: string;
}

export default function BookmarksPanel({ className = '' }: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'chat' | 'lesson'>('all');

  /**
   * Load bookmarks from database
   */
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [chatBookmarks, lessonBookmarks] = await Promise.all([
          databaseService.getBookmarkedChatsWithDetails(),
          databaseService.getBookmarkedLessonsWithDetails()
        ]);
        
        // Combine and sort bookmarks
        const allBookmarks = [
          ...chatBookmarks.map(b => ({ ...b, type: 'chat' })),
          ...lessonBookmarks.map(b => ({ ...b, type: 'lesson' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setBookmarks(allBookmarks);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        setError('Failed to load bookmarks');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  /**
   * Remove bookmark
   */
  const removeBookmark = async (bookmarkId: string) => {
    if (!confirm('Are you sure you want to remove this bookmark?')) return;
    
    try {
      await databaseService.deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      setError('Failed to remove bookmark');
    }
  };

  /**
   * Filter bookmarks based on type
   */
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (filterType === 'all') return true;
    return bookmark.type === filterType;
  });

  /**
   * Format bookmark date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">Bookmarks</h3>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredBookmarks.length} items
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'chat' | 'lesson')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Bookmarks</option>
            <option value="chat">Chat Responses</option>
            <option value="lesson">Lessons</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Bookmarks List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-8">
            <BookmarkX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h4>
            <p className="text-gray-600 mb-4">
              {filterType === 'all' 
                ? 'Start bookmarking chat responses and lessons to save them for later.'
                : `No ${filterType} bookmarks found.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Bookmark Type Badge */}
                    <div className="flex items-center space-x-2 mb-2">
                      {bookmark.type === 'chat' ? (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                            Chat Response
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3 text-purple-500" />
                          <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                            Lesson
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-500">{formatDate(bookmark.created_at)}</span>
                    </div>

                    {/* Bookmark Content */}
                    {bookmark.type === 'chat' ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          Q: {bookmark.chat_history.question}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          A: {bookmark.chat_history.answer}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {bookmark.lessons.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Course: {bookmark.lessons.courses.title} • {bookmark.lessons.courses.category}
                        </p>
                        {bookmark.lessons.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {bookmark.lessons.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => {
                        // Navigate to original content
                        if (bookmark.type === 'chat') {
                          window.location.href = '/assistant';
                        } else {
                          window.location.href = '/learning';
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Go to original"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove bookmark"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}