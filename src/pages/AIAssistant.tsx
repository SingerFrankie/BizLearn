/**
 * AI Assistant Page Component
 * 
 * This component provides a comprehensive AI-powered business assistant interface.
 * It handles real-time conversations with AI, message management, and user interactions.
 * 
 * Key Features:
 * - Real-time AI chat with business expertise
 * - Message history and context management
 * - Bookmarking important responses
 * - Conversation export functionality
 * - Mobile-first responsive design
 * - Error handling and loading states
 * - Keyboard shortcuts and accessibility
 * 
 * Architecture:
 * - React functional component with hooks
 * - State management for messages and UI states
 * - Integration with OpenRouter API via businessAssistant
 * - Responsive design with Tailwind CSS
 * - Proper error boundaries and user feedback
 * 
 * Mobile-First Design:
 * - Base styles for mobile (320px+)
 * - Enhanced with sm: breakpoints (640px+)
 * - Touch-friendly interface elements
 * - Optimized typography and spacing
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Bookmark, Download, Trash2, AlertCircle, Loader2, StickyNote } from 'lucide-react';
import { businessAssistant, type ChatMessage } from '../lib/openai';
import { databaseService, type ChatHistoryRecord } from '../lib/database';
import NotesPanel from '../components/NotesPanel';

/**
 * Message Interface
 * 
 * Defines the structure of chat messages in the UI.
 * Extends the basic ChatMessage with UI-specific properties.
 * 
 * Properties:
 * - id: Unique identifier for React keys and operations
 * - type: Message sender (user or assistant)
 * - content: Message text content
 * - timestamp: When the message was created
 * - bookmarked: Whether user has bookmarked this message
 * - isStreaming: Whether message is currently being streamed (future feature)
 */
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  bookmarked?: boolean;
  isStreaming?: boolean;
}

/**
 * AIAssistant Component
 * 
 * Main component for the AI business assistant chat interface.
 * Manages conversation state, API interactions, and user interface.
 * 
 * State Management:
 * - messages: Array of conversation messages
 * - input: Current user input text
 * - isLoading: API request loading state
 * - error: Error message display
 * 
 * Key Methods:
 * - handleSend: Process user input and get AI response
 * - toggleBookmark: Bookmark/unbookmark messages
 * - clearConversation: Reset chat history
 * - exportConversation: Download chat as text file
 * 
 * Responsive Design:
 * - Mobile-first approach with base styles
 * - sm: breakpoints for larger screens
 * - Touch-friendly buttons and inputs
 * - Adaptive text sizes and spacing
 */
export default function AIAssistant() {
  // Message history state - starts with welcome message
  const [messages, setMessages] = useState<Message[]>([]);
  
  // User input state
  const [input, setInput] = useState('');
  
  // Loading state for API requests
  const [isLoading, setIsLoading] = useState(false);
  
  // Error state for user feedback
  const [error, setError] = useState<string | null>(null);
  
  // Loading state for initial data fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Notes panel state
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom of messages
   * 
   * Ensures new messages are always visible to the user.
   * Uses smooth scrolling for better user experience.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Effect: Auto-scroll when messages change
   * 
   * Automatically scrolls to show new messages when they're added.
   * Runs after every message state update.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Load Chat History from Database
   * 
   * Fetches user's chat history on component mount and converts
   * database records to UI message format.
   */
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsInitialLoading(true);
        const chatHistory = await databaseService.getChatHistory(50);
        
        if (chatHistory.length === 0) {
          // Show welcome message if no history
          setMessages([{
            id: '1',
            type: 'assistant',
            content: "Hello! I'm your AI business assistant powered by BizGenius AI. I can help you with marketing strategies, financial planning, operations management, business strategy, and more. What business challenge can I help you solve today?",
            timestamp: new Date()
          }]);
        } else {
          // Convert database records to UI messages
          const uiMessages: Message[] = [];
          
          // Group by conversation and sort
          const sortedHistory = chatHistory.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          // Get bookmarked chat IDs for proper bookmark state
          const chatBookmarks = await databaseService.getChatBookmarks();
          const bookmarkedChatIds = new Set(chatBookmarks.map(b => b.related_id));
          
          sortedHistory.forEach(record => {
            // Add user question
            uiMessages.push({
              id: `${record.id}-question`,
              type: 'user',
              content: record.question,
              timestamp: new Date(record.created_at)
            });
            
            // Add AI answer
            uiMessages.push({
              id: record.id,
              type: 'assistant',
              content: record.answer,
              timestamp: new Date(record.created_at),
              bookmarked: bookmarkedChatIds.has(record.id)
            });
          });
          
          setMessages(uiMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setError('Failed to load chat history');
        // Show welcome message on error
        setMessages([{
          id: '1',
          type: 'assistant',
          content: "Hello! I'm your AI business assistant powered by BizGenius. I can help you with marketing strategies, financial planning, operations management, business strategy, and more. What business challenge can I help you solve today?",
          timestamp: new Date()
        }]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadChatHistory();
  }, []);
  /**
   * Handle Send Message
   * 
   * Main method for processing user input and getting AI responses.
   * Handles the complete conversation flow with proper error handling.
   * 
   * Process Flow:
   * 1. Validate input and API configuration
   * 2. Add user message to conversation
   * 3. Send request to AI assistant
   * 4. Add AI response to conversation
   * 5. Handle errors and loading states
   * 
   * Error Handling:
   * - API key validation
   * - Network errors
   * - Rate limiting
   * - Invalid responses
   * 
   * State Management:
   * - Updates messages array
   * - Manages loading state
   * - Handles error display
   * - Clears input field
   */
  const handleSend = async () => {
    // Validate input and loading state
    if (!input.trim() || isLoading || isInitialLoading) return;

    // Validate API key configuration
    if (!import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      setError('OpenRouter API key not configured. Please add your API key to the .env file.');
      return;
    }

    // Create user message object
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    // Update UI state
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      // Convert UI messages to API format
      const chatMessages: ChatMessage[] = messages
        .filter(msg => !msg.isStreaming)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Include current user message in context
      chatMessages.push({
        role: 'user',
        content: input
      });

      // Request AI response with full conversation context
      const response = await businessAssistant.getChatCompletion(chatMessages);
      const responseTime = Date.now() - startTime;

      // Create AI response message with temporary ID
      const tempId = `temp-${Date.now()}`;
      const aiResponse: Message = {
        id: tempId,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      // Add AI response to conversation
      setMessages(prev => [...prev, aiResponse]);
      
      // Save to database
      try {
        const savedRecord = await databaseService.saveChatHistory({
          question: input,
          answer: response,
          conversation_id: crypto.randomUUID(),
          message_type: 'interaction',
          tokens_used: 0, // Would need to get from API response
          model_used: businessAssistant.getCurrentModel(),
          response_time_ms: responseTime
        });
        
        // Update the message with the actual database UUID
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, id: savedRecord.id }
              : msg
          )
        );
      } catch (dbError) {
        console.error('Failed to save chat to database:', dbError);
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
      
      // Add error message to conversation for user visibility
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble connecting to the AI service right now. Please check your API configuration and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Always clear loading state
      setIsLoading(false);
    }
  };

  /**
   * Toggle Message Bookmark
   * 
   * Uses the new bookmarks system to bookmark chat responses.
   * Updates both local state and database bookmarks table.
   * 
   * @param messageId - ID of message to bookmark/unbookmark
   */
  const toggleBookmark = async (messageId: string) => {
    try {
      // Check if message has a valid UUID (is saved to database)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(messageId)) {
        setError('Cannot bookmark message that is still being processed. Please wait a moment and try again.');
        return;
      }
      
      // Update local state immediately for better UX
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, bookmarked: !msg.bookmarked }
            : msg
        )
      );
      
      // Update database using new bookmarks system
      const isNowBookmarked = await databaseService.toggleBookmark('chat', messageId);
      
      // Ensure local state matches database state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, bookmarked: isNowBookmarked }
            : msg
        )
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert local state on error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, bookmarked: !msg.bookmarked }
            : msg
        )
      );
      setError('Failed to update bookmark');
    }
  };

  /**
   * Clear Conversation
   * 
   * Resets the conversation to initial state with welcome message.
   * Useful for starting fresh conversations or clearing sensitive data.
   * 
   * Resets:
   * - Messages array to initial welcome message
   * - Error state
   * - Clears database history
   */
  const clearConversation = async () => {
    try {
      await databaseService.clearAllChatHistory();
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: "Hello! I'm your AI business assistant powered by BizGenius. I can help you with marketing strategies, financial planning, operations management, business strategy, and more. What business challenge can I help you solve today?",
          timestamp: new Date()
        }
      ]);
      setError(null);
    } catch (error) {
      console.error('Error clearing conversation:', error);
      setError('Failed to clear conversation');
    }
  };

  /**
   * Export Conversation
   * 
   * Generates a downloadable text file of the entire conversation.
   * Useful for record-keeping, sharing, or further analysis.
   * 
   * Format:
   * - Plain text format
   * - Clear speaker identification
   * - Chronological order
   * - Timestamped filename
   * 
   * Enhancement Opportunities:
   * - Add PDF export option
   * - Include conversation metadata
   * - Support for different export formats
   * - Email sharing functionality
   */
  const exportConversation = () => {
    // Format conversation as readable text
    const conversationText = messages
      .map(msg => `${msg.type === 'user' ? 'You' : 'AI Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    // Create and download file
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-consultation-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Handle Keyboard Input
   * 
   * Provides keyboard shortcuts for better user experience.
   * Enter sends message, Shift+Enter creates new line.
   * 
   * @param e - Keyboard event
   * 
   * Shortcuts:
   * - Enter: Send message
   * - Shift+Enter: New line in textarea
   * 
   * Accessibility:
   * - Prevents default form submission
   * - Maintains textarea functionality
   * - Clear user feedback
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Component Render
   * 
   * Renders the complete AI assistant interface with mobile-first design.
   * 
   * Layout Structure:
   * 1. Header with title and action buttons
   * 2. Error banner (conditional)
   * 3. Messages container with scrolling
   * 4. Input area with send button
   * 
   * Mobile-First Design:
   * - Base styles for mobile (text-sm, p-3, etc.)
   * - Enhanced with sm: breakpoints for larger screens
   * - Touch-friendly button sizes
   * - Responsive typography and spacing
   * 
   * Accessibility:
   * - Proper ARIA labels
   * - Keyboard navigation support
   * - Screen reader friendly
   * - High contrast colors
   */
  return (
    <div className="h-full flex bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
      {/* Initial Loading State */}
      {isInitialLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your conversation history...</p>
          </div>
        </div>
      )}
      
      {/* Header Section - App title and action buttons */}
      {!isInitialLoading && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          {/* App branding and title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">AI Business Assistant</h1>
              <p className="text-xs text-gray-500 sm:text-sm">Powered by OpenRouter AI</p>
            </div>
          </div>
          
          {/* Action buttons - Export and Clear */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Export conversation button */}
            <button
              onClick={exportConversation}
              className="px-2 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors sm:px-3 sm:text-sm"
            >
              <Download className="h-4 w-4 sm:mr-2 inline" />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            {/* Clear conversation button */}
            <button
              onClick={clearConversation}
              className="px-2 py-2 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors sm:px-3 sm:text-sm"
            >
              <Trash2 className="h-4 w-4 sm:mr-2 inline" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            
            {/* Notes toggle button */}
            <button
              onClick={() => setShowNotesPanel(!showNotesPanel)}
              className={`px-2 py-2 text-xs font-medium border rounded-md transition-colors sm:px-3 sm:text-sm ${
                showNotesPanel
                  ? 'text-amber-700 bg-amber-50 border-amber-300'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <StickyNote className="h-4 w-4 sm:mr-2 inline" />
              <span className="hidden sm:inline">Notes</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Error Banner - Shows API or connection errors */}
      {!isInitialLoading && error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Messages Container - Scrollable conversation area */}
      {!isInitialLoading && (
        <div className="flex-1 overflow-auto p-3 space-y-4 sm:p-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Message bubble with avatar and content */}
            <div className={`flex space-x-2 max-w-full sm:space-x-3 sm:max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center sm:w-8 sm:h-8 ${
                message.type === 'user' ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-3 w-3 text-white sm:h-5 sm:w-5" />
                ) : (
                  <Bot className="h-3 w-3 text-gray-600 sm:h-5 sm:w-5" />
                )}
              </div>
              
              {/* Message content bubble */}
              <div className={`flex-1 px-3 py-2 rounded-lg sm:px-4 sm:py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}>
                {/* Message text with proper formatting */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                
                {/* Message metadata - timestamp and bookmark */}
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  
                  {/* Bookmark button for assistant messages */}
                  {message.type === 'assistant' && (
                    <button
                      onClick={() => toggleBookmark(message.id)}
                      className={`p-1 rounded ${
                        message.bookmarked
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-gray-400 hover:text-gray-600'
                      } transition-colors`}
                    >
                      <Bookmark className="h-4 w-4" fill={message.bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator while AI is responding */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-2 max-w-full sm:space-x-3 sm:max-w-3xl">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center sm:w-8 sm:h-8">
                <Bot className="h-3 w-3 text-gray-600 sm:h-5 sm:w-5" />
              </div>
              <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg sm:px-4 sm:py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>
      )}

      {/* Input Section - Message composition area */}
      {!isInitialLoading && (
        <div className="bg-white border-t border-gray-200 p-3 sm:p-6">
        <div className="flex space-x-2 sm:space-x-4">
          {/* Auto-resizing textarea for user input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about marketing, finance, operations, strategy, or any business topic..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none sm:px-4 sm:py-3 sm:text-base"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            // Auto-resize functionality
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          
          {/* Send button with loading state */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isInitialLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:px-6 sm:py-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
        
        {/* Usage instructions */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
      )}
    </div>

      {/* Notes Panel */}
      {showNotesPanel && (
        <NotesPanel onClose={() => setShowNotesPanel(false)} />
      )}
    </div>
  );
}