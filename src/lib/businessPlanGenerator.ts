/**
 * Business Plan Generator Module
 * 
 * This module provides comprehensive AI-powered business plan generation using OpenRouter API.
 * It creates professional, investor-ready business plans based on user inputs and industry context.
 * 
 * Key Features:
 * - AI-generated comprehensive business plans with 10 structured sections
 * - Industry-specific content and market analysis
 * - Multiple export formats (PDF, Word, Text)
 * - Plan modification and editing capabilities
 * - Mobile-first responsive design integration
 * - Free DeepSeek model for cost-effective generation
 * 
 * Architecture:
 * - Input validation and form handling
 * - AI prompt engineering for business expertise
 * - Response parsing and section organization
 * - Export functionality for different formats
 * - Modification system for plan updates
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */

/**
 * Business Plan Input Interface
 * 
 * Defines the structure of user inputs required for business plan generation.
 * This interface ensures type safety and consistent data handling.
 * 
 * Template Example:
 * {
 *   "businessName": "SunPower Tech",
 *   "industry": "Renewable Energy",
 *   "businessType": "Startup",
 *   "location": "Tanzania",
 *   "targetAudience": "Investors",
 *   "uniqueValue": "We provide affordable, solar-powered smart systems for rural homes",
 *   "revenueModel": "Product sales and maintenance contracts",
 *   "goals": "Expand to East African markets in 3 years"
 * }
 */
interface BusinessPlanInput {
  businessName: string;
  industry: string;
  businessType: string;
  location: string;
  targetAudience: string;
  uniqueValue: string;
  revenueModel: string;
  goals: string;
}

/**
 * Business Plan Section Interface
 * 
 * Represents individual sections within a business plan.
 * Each section has a title and content for organized presentation.
 */
interface BusinessPlanSection {
  title: string;
  content: string;
}

/**
 * Generated Business Plan Interface
 * 
 * Complete structure of a generated business plan with metadata.
 * Includes all sections, creation info, and status tracking.
 */
interface GeneratedBusinessPlan {
  id: string;
  title: string;
  industry: string;
  createdAt: Date;
  sections: BusinessPlanSection[];
  status: 'draft' | 'complete';
}

/**
 * BusinessPlanGenerator Class
 * 
 * Main class for AI-powered business plan generation and management.
 * Handles the complete lifecycle from input to formatted output.
 * 
 * Core Responsibilities:
 * - Generate comprehensive business plans using AI
 * - Parse and structure AI responses into sections
 * - Handle plan modifications and updates
 * - Provide export functionality
 * - Manage different AI models and configurations
 * 
 * Usage Pattern:
 * 1. Create input object with business details
 * 2. Call generateBusinessPlan() method
 * 3. Receive structured business plan object
 * 4. Display, edit, or export as needed
 */
export class BusinessPlanGenerator {
  // OpenRouter API configuration
  private apiKey: string;
  
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = 'tngtech/deepseek-r1t2-chimera:free'; // Free model optimized for business content

  /**
   * System Prompt for Business Plan Generation
   * 
   * This is the core prompt that defines the AI's expertise and output format.
   * It's crucial for generating professional, structured business plans.
   * 
   * Key Elements:
   * - Establishes AI as expert business consultant
   * - Defines 20+ years of experience context
   * - Lists specific areas of expertise
   * - Sets quality standards for output
   * - Specifies exact section structure required
   * - Ensures plain text formatting (no markdown)
   * 
   * Modification Guide:
   * - Update expertise areas for different industries
   * - Adjust section structure as needed
   * - Modify tone for different audiences
   * - Add specific requirements for your use case
   */
  private systemPrompt = `You are an expert business plan consultant with 20+ years of experience helping entrepreneurs and startups create professional, investor-ready business plans. Your expertise includes:

- Market analysis and competitive research
- Financial modeling and projections
- Strategic planning and growth strategies
- Risk assessment and mitigation
- Industry-specific insights and trends
- Investor presentation and funding strategies

Create comprehensive, professional business plans that are:
- Well-structured with clear sections
- Data-driven with realistic projections
- Tailored to the specific industry and market
- Investor-ready with compelling narratives
- Actionable with clear implementation steps

IMPORTANT: Format your response as clean, readable text without any markdown formatting, asterisks, or special characters. Use plain text with proper paragraphs and line breaks. Structure your response with the following sections:
1. Executive Summary
2. Company Description
3. Market Analysis
4. Organization & Management
5. Products or Services
6. Marketing & Sales Strategy
7. Financial Projections
8. Risk Analysis
9. Implementation Timeline
10. Appendices

Each section should be detailed, professional, and specific to the business context provided. Write in clear, professional language without any formatting symbols, asterisks, or markdown. Use proper paragraphs with line breaks for readability.`;

  /**
   * Constructor - Initialize BusinessPlanGenerator
   * 
   * Sets up API configuration and validates environment setup.
   * Provides warnings for missing API keys to help with debugging.
   */
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      console.warn('OpenRouter API key not configured');
    }
  }

  /**
   * Generate Business Plan
   * 
   * Main method for creating comprehensive business plans using AI.
   * Takes user inputs and generates a professional, structured business plan.
   * 
   * @param input - BusinessPlanInput object with all required business details
   * @returns Promise<GeneratedBusinessPlan> - Complete business plan with sections
   * 
   * Process Flow:
   * 1. Validate API key configuration
   * 2. Create detailed prompt from user inputs
   * 3. Send request to OpenRouter API
   * 4. Parse AI response into structured sections
   * 5. Return formatted business plan object
   * 
   * Error Handling:
   * - API key validation
   * - Network and API errors
   * - Response parsing failures
   * - Rate limiting and quota issues
   * 
   * Usage Example:
   * const input = {
   *   businessName: "SunPower Tech",
   *   industry: "Renewable Energy",
   *   // ... other fields
   * };
   * const plan = await generator.generateBusinessPlan(input);
   */
  async generateBusinessPlan(input: BusinessPlanInput): Promise<GeneratedBusinessPlan> {
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured. Please add your API key to the .env file.');
    }

    try {
      // Create comprehensive prompt from user inputs
      const prompt = this.createBusinessPlanPrompt(input);
      
      // Make API request to OpenRouter
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BizGenius Business Plan Generator'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000, // Longer responses for comprehensive plans
          temperature: 0.7, // Balanced creativity for business content
          stream: false,
        })
      });

      // Handle API errors with specific messages
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

      // Extract AI response content
      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content || 'Failed to generate business plan.';

      // Parse AI response into structured sections
      const sections = this.parseBusinessPlanSections(generatedContent);

      // Create final business plan object
      const businessPlan: GeneratedBusinessPlan = {
        id: Date.now().toString(),
        title: `${input.businessName} Business Plan`,
        industry: input.industry,
        createdAt: new Date(), 
        sections,
        status: 'complete'
      };

      return businessPlan;
    } catch (error) {
      console.error('Business Plan Generation Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to generate business plan. Please try again.');
    }
  }

  /**
   * Create Business Plan Prompt
   * 
   * Constructs a detailed prompt for the AI based on user inputs.
   * This method is crucial for generating relevant, industry-specific content.
   * 
   * @param input - User's business information
   * @returns string - Formatted prompt for AI
   * 
   * Prompt Structure:
   * - Business details section
   * - Specific requirements for content
   * - Industry and location context
   * - Target audience considerations
   * - Expected deliverables
   * 
   * Customization Points:
   * - Add industry-specific requirements
   * - Include regional market data requests
   * - Specify financial modeling depth
   * - Adjust for different business types
   */
  private createBusinessPlanPrompt(input: BusinessPlanInput): string {
    return `Create a comprehensive, professional business plan for the following business:

**Business Details:**
- Business Name: ${input.businessName}
- Industry: ${input.industry}
- Business Type: ${input.businessType}
- Location: ${input.location}
- Target Audience: ${input.targetAudience}
- Unique Value Proposition: ${input.uniqueValue}
- Revenue Model: ${input.revenueModel}
- Goals: ${input.goals}

Please create a detailed, investor-ready business plan that includes:
- Market research specific to ${input.industry} in ${input.location}
- Competitive analysis and positioning
- Realistic financial projections for 3-5 years
- Marketing strategies tailored to ${input.targetAudience}
- Implementation roadmap aligned with the goal: ${input.goals}
- Risk assessment and mitigation strategies
- Industry-specific insights and trends

The plan should be professional, comprehensive, and ready for presentation to investors, lenders, or stakeholders. Include specific data, metrics, and actionable strategies where possible.`;
  }

  /**
   * Parse Business Plan Sections
   * 
   * Converts AI-generated text into structured sections for easy display and editing.
   * This method handles the complex task of identifying and organizing content.
   * 
   * @param content - Raw AI response text
   * @returns BusinessPlanSection[] - Array of structured sections
   * 
   * Process:
   * 1. Clean up formatting and markdown
   * 2. Identify section headers
   * 3. Split content by sections
   * 4. Format each section's content
   * 5. Handle edge cases and fallbacks
   * 
   * Section Headers Recognized:
   * - Executive Summary
   * - Company Description
   * - Market Analysis
   * - Organization & Management
   * - Products or Services
   * - Marketing & Sales Strategy
   * - Financial Projections
   * - Risk Analysis
   * - Implementation Timeline
   * - Appendices
   * 
   * Maintenance Notes:
   * - Update sectionHeaders array to add new sections
   * - Modify regex patterns for different header formats
   * - Adjust content cleaning rules as needed
   */
  private parseBusinessPlanSections(content: string): BusinessPlanSection[] {
    const sections: BusinessPlanSection[] = [];
    
    // Clean up AI response - remove markdown and formatting
    const cleanContent = content
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove asterisks
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/^\s*[-•]\s/gm, '• ') // Normalize bullet points
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
      .trim();
    
    // Define expected business plan sections
    const sectionHeaders = [
      'Executive Summary',
      'Company Description',
      'Market Analysis',
      'Organization & Management',
      'Products or Services',
      'Marketing & Sales Strategy',
      'Financial Projections',
      'Risk Analysis',
      'Implementation Timeline',
      'Appendices'
    ];

    let currentSection = '';
    let currentContent = '';
    
    const lines = cleanContent.split('\n');
    
    // Process each line to identify sections and content
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if current line matches a section header
      const matchedHeader = sectionHeaders.find(header => 
        trimmedLine.toLowerCase().includes(header.toLowerCase()) &&
        (trimmedLine.match(/^\d+\./) || trimmedLine.toLowerCase() === header.toLowerCase())
      );
      
      if (matchedHeader) {
        // Save previous section before starting new one
        if (currentSection && currentContent.trim()) {
          sections.push({
            title: currentSection,
            content: this.formatSectionContent(currentContent.trim())
          });
        }
        
        // Initialize new section
        currentSection = matchedHeader;
        currentContent = '';
      } else {
        // Accumulate content for current section
        currentContent += line + '\n';
      }
    }
    
    // Don't forget the last section
    if (currentSection && currentContent.trim()) {
      sections.push({
        title: currentSection,
        content: this.formatSectionContent(currentContent.trim())
      });
    }
    
    // Fallback: if parsing failed, create single section
    if (sections.length === 0) {
      sections.push({
        title: 'Business Plan',
        content: this.formatSectionContent(cleanContent)
      });
    }
    
    return sections;
  }

  /**
   * Format Section Content
   * 
   * Cleans and formats individual section content for consistent presentation.
   * Ensures all sections have uniform formatting and readability.
   * 
   * @param content - Raw section content
   * @returns string - Cleaned and formatted content
   * 
   * Formatting Rules:
   * - Remove remaining markdown symbols
   * - Normalize bullet points
   * - Clean up line breaks
   * - Remove excessive whitespace
   * - Maintain paragraph structure
   */
  private formatSectionContent(content: string): string {
    return content
      .replace(/\*\*/g, '') // Remove any remaining bold markdown
      .replace(/\*/g, '') // Remove any remaining asterisks
      .replace(/^\s*[-•]\s/gm, '• ') // Normalize bullet points
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .replace(/^\s+/gm, '') // Remove leading whitespace from lines
      .trim();
  }

  /**
   * Export Business Plan to PDF
   * 
   * Generates a downloadable text file of the business plan.
   * Note: This creates a .txt file, not a true PDF. For real PDF generation,
   * you would need a library like jsPDF or Puppeteer.
   * 
   * @param businessPlan - Complete business plan object
   * 
   * Enhancement Opportunities:
   * - Integrate jsPDF for real PDF generation
   * - Add custom styling and formatting
   * - Include charts and graphs
   * - Add company branding
   */
  exportToPDF(businessPlan: GeneratedBusinessPlan): void {
    const content = this.formatBusinessPlanForExport(businessPlan);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessPlan.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export Business Plan to Word
   * 
   * Generates a downloadable Word-compatible file.
   * Note: This creates a .doc file with plain text. For true Word documents,
   * you would need a library like docx or mammoth.js.
   * 
   * @param businessPlan - Complete business plan object
   * 
   * Enhancement Opportunities:
   * - Use docx library for real Word documents
   * - Add professional formatting
   * - Include tables and charts
   * - Support for headers and footers
   */
  exportToWord(businessPlan: GeneratedBusinessPlan): void {
    const content = this.formatBusinessPlanForExport(businessPlan);
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessPlan.title.replace(/\s+/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Format Business Plan for Export
   * 
   * Creates a formatted text version of the business plan suitable for export.
   * Includes metadata, proper section headers, and clean content formatting.
   * 
   * @param businessPlan - Business plan object to format
   * @returns string - Formatted text content
   * 
   * Format Structure:
   * - Title and metadata header
   * - Separator line
   * - Each section with title and content
   * - Consistent spacing and formatting
   */
  private formatBusinessPlanForExport(businessPlan: GeneratedBusinessPlan): string {
    let content = `${businessPlan.title}\n`;
    content += `Industry: ${businessPlan.industry}\n`;
    content += `Created: ${businessPlan.createdAt.toLocaleDateString()}\n\n`;
    content += '='.repeat(50) + '\n\n';
    
    businessPlan.sections.forEach(section => {
      content += `${section.title}\n`;
      content += '-'.repeat(section.title.length) + '\n\n';
      content += `${section.content}\n\n`;
    });
    
    return content;
  }

  /**
   * Get Available Models
   * 
   * Retrieves list of available AI models from OpenRouter.
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
   * Changes the AI model used for business plan generation.
   * Different models may have different strengths and costs.
   * 
   * @param model - Model identifier
   * 
   * Recommended Models:
   * - 'tngtech/deepseek-r1t2-chimera:free' (Free, good for business)
   * - 'anthropic/claude-3.5-sonnet' (Excellent for structured content)
   * - 'openai/gpt-4' (High quality, more expensive)
   */
  setModel(model: string) {
    this.model = model;
  }

  /**
   * Get Current Model
   * 
   * Returns the currently selected AI model.
   * 
   * @returns string - Current model identifier
   */
  getCurrentModel(): string {
    return this.model;
  }

  /**
   * Modify Business Plan with AI Assistance
   * 
   * Allows users to request specific modifications to existing business plans.
   * The AI understands the current plan context and makes targeted changes.
   * 
   * @param businessPlan - Existing business plan to modify
   * @param modificationRequest - Natural language description of desired changes
   * @returns Promise<GeneratedBusinessPlan> - New modified business plan
   * 
   * Process:
   * 1. Format current plan for AI context
   * 2. Create modification prompt with specific request
   * 3. Send to AI with current plan context
   * 4. Parse response into new business plan
   * 5. Return modified version with new ID
   * 
   * Example Requests:
   * - "Add more details about our marketing strategy"
   * - "Make the financial projections more conservative"
   * - "Include information about our main competitors"
   * - "Expand the risk analysis section"
   * 
   * Usage Example:
   * const modifiedPlan = await generator.modifyBusinessPlan(
   *   existingPlan,
   *   "Add more details about our marketing strategy"
   * );
   */
  async modifyBusinessPlan(
    businessPlan: GeneratedBusinessPlan, 
    modificationRequest: string
  ): Promise<GeneratedBusinessPlan> {
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured. Please add your API key to the .env file.');
    }

    try {
      // Format current plan for AI context
      const currentPlanText = this.formatBusinessPlanForModification(businessPlan);
      
      // Create modification prompt with context and request
      const prompt = `You are an expert business plan consultant. Please modify the following business plan based on this specific request: "${modificationRequest}"

Current Business Plan:
${currentPlanText}

Please provide the complete modified business plan with all sections updated as needed. Maintain the same professional structure and format. Focus specifically on the requested changes while ensuring the entire plan remains coherent and professional.

IMPORTANT: Format your response as clean, readable text without any markdown formatting, asterisks, or special characters. Use plain text with proper paragraphs and line breaks.`;

      // Send modification request to AI
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BizGenius Business Plan Modifier'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.7,
          stream: false,
        })
      });

      // Handle API errors
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

      // Extract and parse modified content
      const data = await response.json();
      const modifiedContent = data.choices[0]?.message?.content || 'Failed to modify business plan.';

      // Parse modified content into structured sections
      const sections = this.parseBusinessPlanSections(modifiedContent);

      // Create new business plan object with modifications
      const modifiedPlan: GeneratedBusinessPlan = {
        ...businessPlan,
        id: Date.now().toString(), // New ID to distinguish from original
        title: `${businessPlan.title} (Modified)`,
        createdAt: new Date(),
        sections,
        status: 'complete'
      };

      return modifiedPlan;
    } catch (error) {
      console.error('Business Plan Modification Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to modify business plan. Please try again.');
    }
  }

  /**
   * Format Business Plan for Modification
   * 
   * Prepares existing business plan content for AI modification context.
   * Creates a clean, readable format that the AI can understand and work with.
   * 
   * @param businessPlan - Business plan to format
   * @returns string - Formatted plan text for AI context
   */
  private formatBusinessPlanForModification(businessPlan: GeneratedBusinessPlan): string {
    let content = `${businessPlan.title}\n`;
    content += `Industry: ${businessPlan.industry}\n\n`;
    
    businessPlan.sections.forEach(section => {
      content += `${section.title}\n`;
      content += `${section.content}\n\n`;
    });
    
    return content;
  }
}

/**
 * Singleton Instance Export
 * 
 * Pre-configured BusinessPlanGenerator instance ready for immediate use.
 * This singleton pattern ensures consistent configuration across the app.
 * 
 * Usage:
 * import { businessPlanGenerator } from './lib/businessPlanGenerator';
 * const plan = await businessPlanGenerator.generateBusinessPlan(input);
 */
export const businessPlanGenerator = new BusinessPlanGenerator();

/**
 * Type Exports for TypeScript Support
 * 
 * Exports all interfaces for type safety in components and other modules.
 * Use these when defining props, state, or function parameters.
 */
export type { BusinessPlanInput, GeneratedBusinessPlan, BusinessPlanSection };