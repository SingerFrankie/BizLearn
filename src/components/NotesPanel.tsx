/**
 * Notes Panel Component
 * 
 * A comprehensive notes management component for both Learning and Assistant features.
 * Supports creating, editing, deleting, and filtering notes with a modern UI.
 * 
 * Key Features:
 * - Create notes for lessons or assistant chats
 * - Edit existing notes inline
 * - Delete notes with confirmation
 * - Filter notes by type (assistant/lesson)
 * - Search notes by content
 * - Mobile-responsive design
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  StickyNote, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  Filter,
  MessageSquare,
  BookOpen,
  Loader2
} from 'lucide-react';
import { databaseService, type NoteRecord } from '../lib/database';

interface NotesPanelProps {
  type?: 'assistant' | 'lesson';
  relatedId?: string;
  title?: string;
  className?: string;
}

export default function NotesPanel({ 
  type, 
  relatedId, 
  title = 'Notes',
  className = '' 
}: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create note state
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Filter and search state
  const [filterType, setFilterType] = useState<'all' | 'assistant' | 'lesson'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Load notes from database
   */
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let notesData: NoteRecord[];
        
        if (relatedId && type) {
          // Load notes for specific item (lesson or chat)
          notesData = await databaseService.getNotes(type, relatedId);
        } else if (type) {
          // Load notes by type only
          notesData = await databaseService.getNotes(type);
        } else {
          // Load all notes
          notesData = await databaseService.getNotes();
        }
        
        setNotes(notesData);
      } catch (error) {
        console.error('Error loading notes:', error);
        setError('Failed to load notes');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [type, relatedId]);

  /**
   * Create new note
   */
  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    
    // Determine note type and related_id
    const noteType = type || 'assistant';
    const noteRelatedId = relatedId || crypto.randomUUID();
    
    setIsSaving(true);
    try {
      const newNote = await databaseService.createNote({
        content: newNoteContent.trim(),
        type: noteType,
        related_id: noteRelatedId
      });
      
      setNotes(prev => [newNote, ...prev]);
      setNewNoteContent('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Start editing note
   */
  const startEditing = (note: NoteRecord) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  /**
   * Save edited note
   */
  const saveEdit = async () => {
    if (!editingNoteId || !editContent.trim()) return;
    
    try {
      const updatedNote = await databaseService.updateNote(editingNoteId, editContent.trim());
      setNotes(prev => prev.map(note => 
        note.id === editingNoteId ? updatedNote : note
      ));
      setEditingNoteId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note');
    }
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  /**
   * Delete note
   */
  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await databaseService.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note');
    }
  };

  /**
   * Filter notes based on search and type
   */
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || note.type === filterType;
    
    return matchesSearch && matchesType;
  });

  /**
   * Format note date
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
            <StickyNote className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Note</span>
          </button>
        </div>

        {/* Search and Filter */}
        {!type && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'assistant' | 'lesson')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Notes</option>
                <option value="assistant">Assistant</option>
                <option value="lesson">Lessons</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create Note Form */}
      {isCreating && (
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-blue-50">
          <div className="space-y-3">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your note here..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreateNote}
                disabled={!newNoteContent.trim() || isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Note</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewNoteContent('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h4>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No notes match your search.' : 'Start taking notes to remember important insights.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotes.map((note) => (
              <div key={note.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Note Type Badge */}
                    <div className="flex items-center space-x-2 mb-2">
                      {note.type === 'assistant' ? (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                            Assistant
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
                      <span className="text-xs text-gray-500">{formatDate(note.created_at)}</span>
                    </div>

                    {/* Note Content */}
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
                          >
                            <Save className="h-3 w-3" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {editingNoteId !== note.id && (
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}