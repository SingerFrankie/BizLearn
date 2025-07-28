/**
 * OpenRouter API Integration for AI Business Assistant
 * 
 * This module provides a comprehensive interface to OpenRouter's API for business consulting.
 * It handles chat completions, streaming responses, and model management with proper error handling.
 * 
 * Key Features:
 * - Business-specialized AI assistant with expert system prompt
 * - Real-time chat completions with context management
 * - Streaming responses for better user experience
 * - Comprehensive error handling for different API scenarios
 * - Model switching capabilities
 * - Response formatting for human readability
 * 
 * Usage:
 * - Import businessAssistant instance for immediate use
 * - Call getChatCompletion() for standard responses
 * - Use getStreamingResponse() for real-time streaming
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */

/**
 * Interface defining the structure of chat messages
 * Used for maintaining conversation context and API communication
 */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * BusinessAssistant Class
 * 
 * Main class for handling AI business consulting through OpenRouter API.
 * Provides methods for chat completions, streaming, and model management.
 * 
 * Architecture:
 * - Singleton pattern for consistent API usage
 * - Configurable model selection
 * - Built-in response formatting
 * - Comprehensive error handling
 */
export class BusinessAssistant {
  // OpenRouter API configuration
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = 'tngtech/deepseek-r1t2-chimera:free'; // Free DeepSeek model - excellent for business advice

  /**
   * System prompt that defines the AI's expertise and behavior
   * 
   * This prompt is crucial for:
   * - Setting the AI's role as a business expert
   * - Defining areas of expertise
   * - Ensuring consistent response quality
   * - Maintaining professional tone
   * 
   * Modification Guide:
   * - Update expertise areas as needed
   * - Adjust tone and style requirements
   * - Add industry-specific knowledge
   */
  private systemPrompt = `You are an expert AI Business Assistant specializing in helping entrepreneurs, startups, and business owners. Your expertise includes:

- Marketing strategies and digital marketing
- Financial planning and analysis  
- Operations management and optimization
- Business strategy and competitive analysis
- Leadership and team management
- Startup funding and investment
- Legal and regulatory guidance
- Technology and innovation

IMPORTANT: Always respond in clean, readable plain text without any markdown formatting, asterisks, or special characters. 

Provide practical, actionable advice that is:
- Clear and easy to understand
- Specific to the user's situation
- Based on current best practices
- Focused on real-world implementation

Keep responses concise but comprehensive and tailored to users context. Write in professional, conversational language using proper paragraphs and line breaks for readability. Do not use any formatting symbols, asterisks, or markdown. Ask clarifying questions when needed to provide better advice.`;

  /**
   * Constructor - Initializes the BusinessAssistant with API configuration
   * 
   * Automatically retrieves API key from environment variables
   * Provides warning if API key is not properly configured
   */
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      console.warn('OpenRouter API key not configured');
    }
  }

  /**
   * Get Chat Completion from OpenRouter API
   * 
   * Main method for getting AI responses to business questions.
   * Handles the complete request/response cycle with proper error handling.
   * 
   * @param messages - Array of chat messages for context
   * @returns Promise<string> - Formatted AI response
   * 
   * Error Handling:
   * - 401: Invalid API key
   * - 402: Insufficient credits
   * - 429: Rate limit exceeded
   * - Network errors and timeouts
   * 
   * Usage Example:
   * const response = await businessAssistant.getChatCompletion([
   *   { role: 'user', content: 'How do I create a marketing strategy?' }
   * ]);
   */
  async getChatCompletion(messages: ChatMessage[]): Promise<string> {
    // Validate API key configuration
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured. Please add your API key to the .env file.');
    }

    try {
      // Prepare messages with system prompt for consistent AI behavior
      const messagesWithSystem = [
        { role: 'system' as const, content: this.systemPrompt },
        ...messages
      ];

      // Make API request to OpenRouter
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`, // API authentication
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin, // Required by OpenRouter
          'X-Title': 'BizGenius AI Assistant' // App identification
        },
        body: JSON.stringify({
          model: this.model, // DeepSeek model for free usage
          messages: messagesWithSystem,
          max_tokens: 1000, // Reasonable response length
          temperature: 0.7, // Balanced creativity vs consistency
          stream: false, // Standard completion mode
        })
      });

      // Handle different types of API errors with specific messages
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenRouter API key configuration.');
        } else if (response.status === 402) {
          throw new Error('Insufficient credits. Please check your OpenRouter billing.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else {
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }
      }

      // Extract and format the AI response
      const data = await response.json();
      const rawContent = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      // Format response for human readability (remove markdown, etc.)
      return this.formatResponse(rawContent);
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  /**
   * Format AI Response for Human Readability
   * 
   * Cleans up AI responses by removing markdown formatting and normalizing text.
   * This ensures consistent, professional presentation in the UI.
   * 
   * @param content - Raw AI response content
   * @returns string - Cleaned, formatted content
   * 
   * Transformations:
   * - Removes bold markdown (**text**)
   * - Removes asterisks and formatting symbols
   * - Normalizes bullet points
   * - Cleans up excessive line breaks
   * - Removes leading whitespace
   */
  private formatResponse(content: string): string {
    return content
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove asterisks
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/^\s*[-•]\s/gm, '• ') // Normalize bullet points
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
      .replace(/^\s+/gm, '') // Remove leading whitespace
      .trim();
  }

  /**
   * Get Streaming Response (Advanced Feature)
   * 
   * Provides real-time streaming of AI responses for better user experience.
   * Useful for long responses or when you want to show progress.
   * 
   * @param messages - Array of chat messages for context
   * @returns Promise<ReadableStream> - Stream of response chunks
   * 
   * Usage Example:
   * const stream = await businessAssistant.getStreamingResponse(messages);
   * // Process stream chunks as they arrive
   */
  async getStreamingResponse(messages: ChatMessage[]): Promise<ReadableStream> {
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured. Please add your API key to the .env file.');
    }

    try {
      const messagesWithSystem = [
        { role: 'system' as const, content: this.systemPrompt },
        ...messages
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BizGenius AI Assistant'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messagesWithSystem,
          max_tokens: 1000,
          temperature: 0.7,
          stream: true, // Enable streaming mode
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      // Create ReadableStream for processing streaming data
      return new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.error(new Error('No response body'));
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Process streaming chunks and extract content
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    controller.close();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || '';
                    if (content) {
                      controller.enqueue(content);
                    }
                  } catch (e) {
                    // Skip invalid JSON chunks (normal in streaming)
                  }
                }
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    } catch (error) {
      console.error('OpenRouter Streaming Error:', error);
      throw error;
    }
  }

  /**
   * Get Available Models from OpenRouter
   * 
   * Retrieves list of available AI models for potential switching.
   * Useful for implementing model selection features.
   * 
   * @returns Promise<any[]> - Array of available models
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  /**
   * Set AI Model
   * 
   * Allows switching between different AI models available on OpenRouter.
   * 
   * @param model - Model identifier (e.g., 'anthropic/claude-3.5-sonnet')
   * 
   * Popular Models:
   * - 'tngtech/deepseek-r1t2-chimera:free' (Free, good for business)
   * - 'anthropic/claude-3.5-sonnet' (Excellent reasoning)
   * - 'openai/gpt-4' (OpenAI's flagship)
   * - 'openai/gpt-3.5-turbo' (Fast and efficient)
   */
  setModel(model: string) {
    this.model = model;
  }

  /**
   * Get Current Model
   * 
   * Returns the currently selected AI model identifier.
   * 
   * @returns string - Current model identifier
   */
  getCurrentModel(): string {
    return this.model;
  }
}

/**
 * Singleton Instance Export
 * 
 * Pre-configured BusinessAssistant instance ready for immediate use.
 * This singleton pattern ensures consistent configuration across the app.
 * 
 * Usage:
 * import { businessAssistant } from './lib/openai';
 * const response = await businessAssistant.getChatCompletion(messages);
 */
export const businessAssistant = new BusinessAssistant();

/**
 * Type Export for TypeScript Support
 * 
 * Exports the ChatMessage interface for type safety in components.
 * Use this when defining message arrays or function parameters.
 */
export type { ChatMessage };