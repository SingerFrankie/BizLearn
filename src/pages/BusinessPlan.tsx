/**
 * Business Plan Page Component
 * 
 * This component provides a comprehensive business plan management interface.
 * It handles plan generation, viewing, editing, and AI-powered modifications.
 * 
 * Key Features:
 * - AI-powered business plan generation using OpenRouter
 * - Professional form with industry-specific inputs
 * - Plan viewing with structured sections
 * - Direct editing capabilities
 * - AI-powered plan modifications
 * - Export functionality (PDF, Word)
 * - Plan management (view, edit, delete)
 * - Mobile-first responsive design
 * 
 * Component States:
 * - Plans list view (default)
 * - Plan generation form
 * - Plan viewer with sections
 * - Edit mode for direct editing
 * - AI modification mode
 * 
 * Architecture:
 * - React functional component with hooks
 * - Multiple view states managed with conditional rendering
 * - Integration with businessPlanGenerator service
 * - Form validation and error handling
 * - Responsive design with Tailwind CSS
 * 
 * Mobile-First Design:
 * - Base styles optimized for mobile (320px+)
 * - Enhanced with sm: breakpoints (640px+)
 * - Touch-friendly forms and buttons
 * - Responsive grid layouts
 * - Optimized typography scaling
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */
import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Eye, Edit, Trash2, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { businessPlanGenerator, type BusinessPlanInput, type GeneratedBusinessPlan } from '../lib/businessPlanGenerator';
import { databaseService, type BusinessPlanRecord } from '../lib/database';

/**
 * BusinessPlan Component
 * 
 * Main component for business plan management and generation.
 * Handles multiple view states and user interactions.
 * 
 * State Management:
 * - plans: Array of generated business plans
 * - showGenerator: Boolean for form visibility
 * - showPlanView: Current plan being viewed
 * - showEditMode: Boolean for edit mode
 * - showModifyMode: Boolean for AI modification mode
 * - editedPlan: Plan being edited
 * - modificationRequest: User's modification request
 * - isGenerating: Loading state for plan generation
 * - isModifying: Loading state for AI modifications
 * - error: Error message display
 * - formData: Form input data
 * 
 * View States:
 * 1. Plans List - Default view showing all plans
 * 2. Generator Form - Input form for new plans
 * 3. Plan Viewer - Display generated plan sections
 * 4. Edit Mode - Direct editing interface
 * 5. Modify Mode - AI modification interface
 * 
 * Key Methods:
 * - handleGeneratePlan: Create new business plan
 * - handleEditPlan: Enter edit mode
 * - handleModifyRequest: Request AI modifications
 * - exportPlan: Download plan in different formats
 * - deletePlan: Remove plan from list
 */
export default function BusinessPlan() {
  // Plans storage - in production, this would be persisted
  const [plans, setPlans] = useState<BusinessPlanRecord[]>([]);
  
  // Loading state for initial data fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // View state management
  const [showGenerator, setShowGenerator] = useState(false);
  const [showPlanView, setShowPlanView] = useState<GeneratedBusinessPlan | null>(null);
  const [showEditMode, setShowEditMode] = useState(false);
  const [showModifyMode, setShowModifyMode] = useState(false);
  
  // Edit state management
  const [editedPlan, setEditedPlan] = useState<BusinessPlanRecord | null>(null);
  const [modificationRequest, setModificationRequest] = useState('');
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Form Data State
   * 
   * Manages user input for business plan generation.
   * Uses the BusinessPlanInput interface for type safety.
   * 
   * Default Values:
   * - All fields start empty for user input
   * - Form validation ensures required fields are filled
   * - Industry and business type use dropdown selections
   */
  const [formData, setFormData] = useState<BusinessPlanInput>({
    businessName: '',
    industry: '',
    businessType: '',
    location: '',
    targetAudience: '',
    uniqueValue: '',
    revenueModel: '',
    goals: ''
  });

  /**
   * Load Business Plans from Database
   * 
   * Fetches user's business plans on component mount.
   */
  useEffect(() => {
    const loadBusinessPlans = async () => {
      try {
        setIsInitialLoading(true);
        const businessPlans = await databaseService.getBusinessPlans();
        setPlans(businessPlans);
      } catch (error) {
        console.error('Error loading business plans:', error);
        setError('Failed to load business plans');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadBusinessPlans();
  }, []);

  /**
   * Convert GeneratedBusinessPlan to BusinessPlanRecord format
   */
  const convertToBusinessPlanRecord = (generatedPlan: GeneratedBusinessPlan, formData: BusinessPlanInput): BusinessPlanRecord => {
    // This conversion would be handled by the database service
    return generatedPlan as any; // Type assertion for now
  };

  /**
   * Industry Options
   * 
   * Predefined list of industries for dropdown selection.
   * Covers major business sectors with 'Other' option for flexibility.
   * 
   * Usage:
   * - Populated in industry dropdown
   * - Used for AI context and industry-specific content
   * - Can be extended with more specific industries
   */
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Food & Beverage',
    'Education', 'Manufacturing', 'Real Estate', 'Consulting', 'Renewable Energy',
    'Agriculture', 'Transportation', 'Entertainment', 'Tourism', 'Other'
  ];

  /**
   * Business Type Options
   * 
   * Different business structures and stages.
   * Affects the tone and content of generated plans.
   */
  const businessTypes = [
    'Startup', 'Small Business', 'Enterprise', 'Non-Profit', 'Franchise', 'Partnership'
  ];

  /**
   * Target Audience Options
   * 
   * Different audiences for business plans.
   * Influences the writing style and focus areas.
   */
  const targetAudiences = [
    'Investors', 'Lenders', 'Partners', 'Internal Team', 'Government Grants', 'Customers'
  ];

  /**
   * Handle Input Change
   * 
   * Updates form data state when user types in form fields.
   * Also clears any existing error messages.
   * 
   * @param field - The form field being updated
   * @param value - New value for the field
   * 
   * Features:
   * - Type-safe field updates
   * - Automatic error clearing
   * - Real-time form state updates
   */
  const handleInputChange = (field: keyof BusinessPlanInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  /**
   * Validate Form
   * 
   * Ensures all required fields are filled before plan generation.
   * Provides specific error messages for missing fields.
   * 
   * @returns boolean - True if form is valid
   * 
   * Required Fields:
   * - businessName: Company/product name
   * - industry: Business sector
   * - businessType: Company structure
   * - location: Geographic market
   * - targetAudience: Plan audience
   * - uniqueValue: Value proposition
   * 
   * Optional Fields:
   * - revenueModel: How business makes money
   * - goals: Business objectives
   */
  const validateForm = (): boolean => {
    const requiredFields: (keyof BusinessPlanInput)[] = [
      'businessName', 'industry', 'businessType', 'location', 'targetAudience', 'uniqueValue'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        setError(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        return false;
      }
    }
    return true;
  };

  /**
   * Handle Generate Plan
   * 
   * Main method for creating new business plans using AI.
   * Handles the complete generation process with error handling.
   * 
   * Process Flow:
   * 1. Validate form inputs
   * 2. Set loading state
   * 3. Call AI generation service
   * 4. Add plan to plans list
   * 5. Reset form and return to list view
   * 6. Handle any errors
   * 
   * Error Handling:
   * - Form validation errors
   * - API configuration issues
   * - Network and service errors
   * - Rate limiting and quotas
   * 
   * State Updates:
   * - Adds new plan to beginning of plans array
   * - Closes generator form
   * - Resets form data
   * - Manages loading and error states
   */
  const handleGeneratePlan = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    setError(null);
    
    const startTime = Date.now();
    try {
      // Generate plan using AI service
      const generatedPlan = await businessPlanGenerator.generateBusinessPlan(formData);
      const generationTime = Date.now() - startTime;
      
      // Save to database
      const savedPlan = await databaseService.saveBusinessPlan({
        business_name: formData.businessName,
        industry: formData.industry,
        business_type: formData.businessType,
        location: formData.location,
        target_audience: formData.targetAudience,
        value_proposition: formData.uniqueValue,
        revenue_model: formData.revenueModel,
        goals: formData.goals,
        generated_plan: generatedPlan.sections,
        title: generatedPlan.title,
        ai_model_used: businessPlanGenerator.getCurrentModel(),
        generation_time_ms: generationTime
      });
      
      // Add to local state (newest first)
      setPlans(prev => [savedPlan, ...prev]);
      
      // Return to list view and reset form
      setShowGenerator(false);
      setFormData({
        businessName: '',
        industry: '',
        businessType: '',
        location: '',
        targetAudience: '',
        uniqueValue: '',
        revenueModel: '',
        goals: ''
      });
    } catch (error) {
      console.error('Business Plan Generation Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate business plan');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Export Plan
   * 
   * Downloads business plan in specified format.
   * Currently supports PDF (text) and Word (doc) formats.
   * 
   * @param plan - Business plan to export
   * @param format - Export format ('pdf' or 'docx')
   * 
   * Export Formats:
   * - PDF: Plain text file with .txt extension
   * - Word: Word-compatible file with .doc extension
   * 
   * Enhancement Opportunities:
   * - True PDF generation with formatting
   * - Real Word document creation
   * - Custom styling and branding
   * - Multiple export templates
   */
  const exportPlan = async (plan: BusinessPlanRecord, format: 'pdf' | 'docx') => {
    try {
      // Increment export count in database
      await databaseService.incrementExportCount(plan.id);
    } catch (error) {
      console.error('Failed to update export count:', error);
    }
    
    // Convert to GeneratedBusinessPlan format for export
    const exportPlan: GeneratedBusinessPlan = {
      id: plan.id,
      title: plan.title,
      industry: plan.industry,
      createdAt: new Date(plan.created_at),
      sections: plan.generated_plan,
      status: plan.status as 'draft' | 'complete'
    };
    
    if (format === 'pdf') {
      businessPlanGenerator.exportToPDF(exportPlan);
    } else {
      businessPlanGenerator.exportToWord(exportPlan);
    }
  };

  /**
   * Delete Plan
   * 
   * Removes a business plan from the plans list.
   * In production, this would also delete from database.
   * 
   * @param planId - ID of plan to delete
   * 
   * Features:
   * - Immediate removal from UI
   * - No confirmation dialog (could be added)
   * - Maintains other plans in list
   * 
   * Enhancement Opportunities:
   * - Add confirmation dialog
   * - Soft delete with undo option
   * - Bulk delete functionality
   * - Archive instead of delete
   */
  const deletePlan = async (planId: string) => {
    try {
      await databaseService.deleteBusinessPlan(planId);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting business plan:', error);
      setError('Failed to delete business plan');
    }
  };

  /**
   * Handle Edit Plan
   * 
   * Enters edit mode for direct plan modification.
   * Creates a copy of the plan for editing.
   * 
   * @param plan - Plan to edit
   * 
   * Process:
   * 1. Create editable copy of plan
   * 2. Enter edit mode
   * 3. Close plan viewer if open
   * 
   * Features:
   * - Non-destructive editing (original preserved)
   * - Full section editing capability
   * - Title editing support
   */
  const handleEditPlan = (plan: BusinessPlanRecord) => {
    setEditedPlan({ ...plan });
    setShowEditMode(true);
    setShowPlanView(null);
  };

  /**
   * Handle Save Edit
   * 
   * Saves edited plan changes and returns to view mode.
   * Updates the plan in the plans list.
   * 
   * Process:
   * 1. Update plan in plans array
   * 2. Exit edit mode
   * 3. Return to plan viewer
   * 4. Clear edit state
   * 
   * Features:
   * - Replaces original plan with edited version
   * - Maintains plan ID and metadata
   * - Seamless transition back to viewer
   */
  const handleSaveEdit = () => {
    if (editedPlan) {
      // Update database
      databaseService.updateBusinessPlan(editedPlan.id, {
        title: editedPlan.title,
        generated_plan: editedPlan.generated_plan
      }).then(updatedPlan => {
        setPlans(prev => prev.map(plan => 
          plan.id === editedPlan.id ? updatedPlan : plan
        ));
      }).catch(error => {
        console.error('Error updating business plan:', error);
        setError('Failed to update business plan');
      });
      
      setShowEditMode(false);
      setShowPlanView(editedPlan);
      setEditedPlan(null);
    }
  };

  /**
   * Handle Cancel Edit
   * 
   * Cancels editing and discards changes.
   * Returns to previous view state.
   * 
   * Process:
   * 1. Exit edit mode
   * 2. Clear edited plan state
   * 3. Return to previous view (if applicable)
   * 
   * Features:
   * - Discards all unsaved changes
   * - Returns to appropriate view
   * - Cleans up edit state
   */
  const handleCancelEdit = () => {
    setShowEditMode(false);
    setEditedPlan(null);
    if (showPlanView) {
      // Return to plan view if editing from viewer
      return;
    }
  };

  /**
   * Handle Modify Request
   * 
   * Processes AI-powered modification requests.
   * Creates a new modified version of the plan.
   * 
   * Process Flow:
   * 1. Validate modification request
   * 2. Set loading state
   * 3. Send request to AI service
   * 4. Add modified plan to list
   * 5. Update viewer to show new plan
   * 6. Reset modification state
   * 
   * Features:
   * - Natural language modification requests
   * - Creates new plan version (preserves original)
   * - Full context awareness
   * - Professional quality modifications
   * 
   * Example Requests:
   * - "Add more details about marketing strategy"
   * - "Make financial projections more conservative"
   * - "Include competitor analysis"
   * - "Expand risk assessment section"
   */
  const handleModifyRequest = async () => {
    if (!showPlanView || !modificationRequest.trim()) return;
    
    setIsModifying(true);
    setError(null);
    
    const startTime = Date.now();
    try {
      // Convert BusinessPlanRecord to GeneratedBusinessPlan for modification
      const planForModification: GeneratedBusinessPlan = {
        id: showPlanView.id,
        title: showPlanView.title,
        industry: showPlanView.industry,
        createdAt: new Date(showPlanView.created_at),
        sections: showPlanView.generated_plan,
        status: showPlanView.status as 'draft' | 'complete'
      };
      
      // Request AI modification
      const modifiedPlan = await businessPlanGenerator.modifyBusinessPlan(
        planForModification, 
        modificationRequest
      );
      const modificationTime = Date.now() - startTime;
      
      // Save modified plan to database
      const savedModifiedPlan = await databaseService.saveBusinessPlan({
        business_name: showPlanView.business_name,
        industry: showPlanView.industry,
        business_type: showPlanView.business_type,
        location: showPlanView.location,
        target_audience: showPlanView.target_audience,
        value_proposition: showPlanView.value_proposition,
        revenue_model: showPlanView.revenue_model,
        goals: showPlanView.goals,
        generated_plan: modifiedPlan.sections,
        title: `${showPlanView.title} (Modified)`,
        ai_model_used: businessPlanGenerator.getCurrentModel(),
        generation_time_ms: modificationTime
      });
      
      // Add modified plan to list and show it
      setPlans(prev => [savedModifiedPlan, ...prev]);
      setShowPlanView(savedModifiedPlan);
      
      // Reset modification state
      setShowModifyMode(false);
      setModificationRequest('');
    } catch (error) {
      console.error('Business Plan Modification Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to modify business plan');
    } finally {
      setIsModifying(false);
    }
  };

  /**
   * Update Edited Section
   * 
   * Updates content of a specific section during editing.
   * Maintains section structure while allowing content changes.
   * 
   * @param sectionIndex - Index of section to update
   * @param newContent - New content for the section
   * 
   * Features:
   * - Preserves section title
   * - Updates only content
   * - Maintains section order
   * - Real-time updates
   */
  const updateEditedSection = (sectionIndex: number, newContent: string) => {
    if (editedPlan) {
      const updatedSections = [...editedPlan.generated_plan];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        content: newContent
      };
      setEditedPlan({
        ...editedPlan,
        generated_plan: updatedSections
      });
    }
  };

  /**
   * Edit Mode Render
   * 
   * Renders the plan editing interface when in edit mode.
   * Provides form-based editing for all plan sections.
   * 
   * Features:
   * - Title editing
   * - Section-by-section content editing
   * - Large text areas for comfortable editing
   * - Save/Cancel actions
   * - Mobile-responsive design
   * 
   * Layout:
   * - Header with save/cancel buttons
   * - Title input field
   * - Section editing forms
   * - Responsive grid layout
   */
  if (showEditMode && editedPlan) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Edit mode header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Business Plan</h1>
            <div className="flex space-x-2">
              {/* Save changes button */}
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              {/* Cancel editing button */}
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Edit form container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            {/* Business plan title editing */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Plan Title
              </label>
              <input
                type="text"
                value={editedPlan.title}
                onChange={(e) => setEditedPlan({ ...editedPlan, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Section editing forms */}
            <div className="space-y-6">
              {editedPlan.generated_plan.map((section, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {section.title}
                  </label>
                  {/* Large textarea for section content */}
                  <textarea
                    value={section.content || ''}
                    onChange={(e) => updateEditedSection(index, e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
                    placeholder={`Enter content for ${section.title}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Plan Viewer Render
   * 
   * Renders the plan viewing interface with all sections.
   * Includes action buttons for editing, modifying, and exporting.
   * 
   * Features:
   * - Full plan display with formatted sections
   * - Action buttons (Edit, AI Modify, Export)
   * - AI modification panel (conditional)
   * - Error display
   * - Mobile-responsive layout
   * - Professional typography
   * 
   * Layout:
   * - Header with back button and actions
   * - AI modification panel (when active)
   * - Plan content with sections
   * - Responsive design for all screen sizes
   */
  if (showPlanView) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Plan viewer header */}
          <div className="flex items-center justify-between mb-6">
            {/* Back to plans list button */}
            <button
              onClick={() => setShowPlanView(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Plans
            </button>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Edit plan button */}
              <button
                onClick={() => handleEditPlan(showPlanView)}
                className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              
              {/* AI modify button */}
              <button
                onClick={() => setShowModifyMode(!showModifyMode)}
                className="px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-1"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">AI Modify</span>
              </button>
              
              {/* Export PDF button */}
              <button
                onClick={() => exportPlan(showPlanView, 'pdf')}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
              
              {/* Export Word button */}
              <button
                onClick={() => exportPlan(showPlanView, 'docx')}
                className="px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export Word</span>
              </button>
            </div>
          </div>

          {/* AI Modification Panel - Shows when modify mode is active */}
          {showModifyMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 mb-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Request AI Modifications
              </h3>
              <div className="space-y-4">
                {/* Modification request textarea */}
                <textarea
                  value={modificationRequest}
                  onChange={(e) => setModificationRequest(e.target.value)}
                  placeholder="Describe what you'd like to modify in your business plan. For example: 'Add more details about our marketing strategy' or 'Update the financial projections to be more conservative'"
                  rows={3}
                  className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
                <div className="flex space-x-2">
                  {/* Apply modifications button */}
                  <button
                    onClick={handleModifyRequest}
                    disabled={!modificationRequest.trim() || isModifying}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isModifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Modifying...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" />
                        <span>Apply Modifications</span>
                      </>
                    )}
                  </button>
                  
                  {/* Cancel modifications button */}
                  <button
                    onClick={() => {
                      setShowModifyMode(false);
                      setModificationRequest('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Plan content display */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            {/* Plan header with metadata */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{showPlanView.title}</h1>
              <p className="text-gray-600">Industry: {showPlanView.industry}</p>
              <p className="text-sm text-gray-500">Created: {new Date(showPlanView.created_at).toLocaleDateString()}</p>
            </div>

            {/* Plan sections display */}
            <div className="space-y-8">
              {showPlanView.generated_plan.map((section, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  {/* Section title */}
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  
                  {/* Section content with proper formatting */}
                  <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {(section.content || '').split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-4 last:mb-0">
                        {paragraph.split('\n').map((line, lIndex) => (
                          <span key={lIndex}>
                            {line}
                            {lIndex < paragraph.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Generator Form Render
   * 
   * Renders the business plan generation form.
   * Collects all necessary information for AI plan generation.
   * 
   * Features:
   * - Comprehensive business information form
   * - Industry and business type dropdowns
   * - Form validation with error display
   * - Mobile-responsive layout
   * - Loading states during generation
   * - Professional styling
   * 
   * Form Fields:
   * - Business Name (required)
   * - Industry (required dropdown)
   * - Business Type (required dropdown)
   * - Location (required)
   * - Target Audience (required dropdown)
   * - Unique Value Proposition (required textarea)
   * - Revenue Model (optional)
   * - Business Goals (optional textarea)
   * 
   * Layout:
   * - Centered form with max width
   * - Header with icon and description
   * - Error display
   * - Form fields in logical groups
   * - Action buttons at bottom
   */
  if (showGenerator) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Form container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            {/* Form header */}
            <div className="text-center mb-8">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">AI Business Plan Generator</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Provide details about your business and our AI will create a comprehensive, professional business plan
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-6">
              {/* Business Name - Required field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SunPower Tech"
                />
              </div>

              {/* Industry & Business Type - Two column layout on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Industry dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                {/* Business type dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Target Audience - Two column layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Tanzania, East Africa"
                  />
                </div>

                {/* Target audience dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select audience</option>
                    {targetAudiences.map(audience => (
                      <option key={audience} value={audience}>{audience}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unique Value Proposition - Required textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unique Value Proposition *
                </label>
                <textarea
                  value={formData.uniqueValue}
                  onChange={(e) => handleInputChange('uniqueValue', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., We provide affordable, solar-powered smart systems for rural homes"
                />
              </div>

              {/* Revenue Model - Optional field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revenue Model
                </label>
                <input
                  type="text"
                  value={formData.revenueModel}
                  onChange={(e) => handleInputChange('revenueModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Product sales and maintenance contracts"
                />
              </div>

              {/* Business Goals - Optional textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Goals
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Expand to East African markets in 3 years"
                />
              </div>

              {/* Form action buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                {/* Cancel button */}
                <button
                  onClick={() => setShowGenerator(false)}
                  className="flex-1 px-6 py-3 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                {/* Generate plan button with loading state */}
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="flex-1 px-6 py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    'Generate Business Plan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Plans List Render (Default View)
   * 
   * Renders the main business plans dashboard.
   * Shows all generated plans in a grid layout with actions.
   * 
   * Features:
   * - Grid layout of plan cards
   * - Plan metadata display
   * - Action buttons for each plan
   * - Empty state for no plans
   * - Mobile-responsive design
   * - Professional card styling
   * 
   * Plan Card Information:
   * - Plan title and industry
   * - Creation date
   * - Number of sections
   * - Status indicator
   * 
   * Plan Actions:
   * - View: Open plan viewer
   * - Edit: Enter edit mode
   * - Export: Download options (hover menu)
   * - Delete: Remove plan
   * 
   * Layout:
   * - Header with title and new plan button
   * - Grid of plan cards (responsive columns)
   * - Empty state with call-to-action
   */
  return (
    <div className="p-4 sm:p-6">
      {/* Initial Loading State */}
      {isInitialLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your business plans...</p>
          </div>
        </div>
      )}
      
      {/* Page header */}
      {!isInitialLoading && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Business Plans</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Create professional business plans with AI assistance
            </p>
          </div>
          
          {/* New plan button */}
          <button
            onClick={() => setShowGenerator(true)}
            className="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">New Plan</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      )}

      {/* Plans grid or empty state */}
      {!isInitialLoading && (plans.length > 0 ? (
        <>
          {/* Plans grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{plan.title}</h3>
                      <p className="text-sm text-gray-600">{plan.industry}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {plan.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    Created: {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {plan.sections_count || plan.generated_plan.length} sections
                  </p>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setShowPlanView(plan)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    
                    <button 
                      onClick={() => handleEditPlan(plan)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    
                    <div className="relative group">
                      <button className="px-3 py-2 text-sm font-medium text-teal-700 bg-teal-100 rounded-md hover:bg-teal-200 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => exportPlan(plan, 'pdf')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export PDF
                        </button>
                        <button
                          onClick={() => exportPlan(plan, 'docx')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export Word
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No business plans yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI-powered business plan to get started</p>
          <button
            onClick={() => setShowGenerator(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Plan
          </button>
        </div>
      ))}
    </div>
  );
}