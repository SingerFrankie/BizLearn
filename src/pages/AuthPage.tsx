import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Briefcase, Loader2 } from 'lucide-react';

/**
 * AuthPage Component
 * 
 * Comprehensive authentication page with login and registration functionality.
 * Features JWT-based authentication, form validation, and mobile-first design.
 * 
 * Key Features:
 * - Toggle between login and registration modes
 * - Real-time form validation
 * - Password visibility toggle
 * - Loading states and error handling
 * - Mobile-responsive design
 * - JWT token management via Supabase
 * - Email confirmation flow
 * 
 * Mobile-First Design:
 * - Base styles optimized for mobile (320px+)
 * - Enhanced with sm: breakpoints (640px+)
 * - Touch-friendly form elements
 * - Responsive typography and spacing
 * 
 * @author BizGenius Team
 * @version 2.0.0
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, error: authError, clearError, isLoading: authLoading } = useAuth();
  
  // UI state management
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  /**
   * Handle Input Change
   * 
   * Updates form data and clears any existing error messages.
   * Provides real-time form state management.
   * 
   * @param e - Input change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (message.text || authError) {
      setMessage({ type: '', text: '' });
      clearError();
    }
  };

  /**
   * Validate Form
   * 
   * Client-side form validation before submission.
   * Provides immediate feedback to users.
   * 
   * @returns boolean - True if form is valid
   * 
   * Validation Rules:
   * - All fields required
   * - Password minimum 6 characters
   * - Valid email format
   */
  const validateForm = () => {
    if (!isLogin && (!formData.firstName || !formData.lastName)) {
      setMessage({ type: 'error', text: 'Please fill in your first and last name' });
      return false;
    }
    
    if (!formData.email || !formData.password || (!isLogin && !formData.confirmPassword)) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return false;
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return false;
    }
    
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }
    
    return true;
  };

  /**
   * Handle Form Submit
   * 
   * Processes login or registration based on current mode.
   * Handles JWT authentication and navigation on success.
   * 
   * @param e - Form submit event
   * 
   * Process Flow:
   * 1. Validate form inputs
   * 2. Set loading state
   * 3. Call appropriate auth function (login/register)
   * 4. Handle success/error responses
   * 5. Navigate on successful authentication
   * 6. Display error messages if needed
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    clearError();

    try {
      if (isLogin) {
        // Login process
        await login(formData.email, formData.password);
        
        // Success - navigate to dashboard
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        // Registration process
        try {
          await register(formData.email, formData.password, formData.firstName, formData.lastName);
          
          // Registration successful
          setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } catch (regError) {
          // Handle registration-specific errors
          if (regError instanceof Error && regError.message.includes('check your email')) {
            setMessage({ 
              type: 'success', 
              text: regError.message 
            });
          } else {
            throw regError;
          }
        }
      }
    } catch (error) {
      // Handle authentication errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle Authentication Mode
   * 
   * Switches between login and registration modes.
   * Clears form data and error states.
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage({ type: '', text: '' });
    clearError();
    setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  };

  /**
   * Component Render
   * 
   * Renders the complete authentication interface with mobile-first design.
   * 
   * Layout Structure:
   * 1. Centered container with gradient background
   * 2. App branding and title
   * 3. Mode toggle buttons (Login/Register)
   * 4. Error/success message display
   * 5. Authentication form with validation
   * 6. Submit button with loading state
   * 7. Mode switch link and demo info
   * 
   * Mobile-First Features:
   * - Responsive container sizing
   * - Touch-friendly form elements
   * - Adaptive typography scaling
   * - Proper spacing for mobile interaction
   * - Loading states with visual feedback
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6 bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {/* App Header with Branding */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">BizGenius</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {isLogin ? 'Welcome back! Sign in to your account' : 'Create your account to get started'}
          </p>
        </div>

        {/* Mode Toggle Buttons - Login/Register */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => !isLogin && toggleMode()}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
              isLogin
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => isLogin && toggleMode()}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
              !isLogin
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error/Success Message Display */}
        {(message.text || authError) && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'error' || authError
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.text || authError}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields - Only show during registration */}
          {!isLogin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name Input */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required={!isLogin}
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name Input */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required={!isLogin}
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your last name"
                />
              </div>
            </div>
          )}

          {/* Email Input Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Input Field with Visibility Toggle */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={isLogin ? 'Enter your password' : 'Create a password (min. 6 characters)'}
              />
              {/* Password visibility toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Password Confirmation Field - Only show during registration */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          {/* Submit Button with Loading State */}
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full flex justify-center items-center py-2 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {(isLoading || authLoading) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Footer with Mode Switch Link */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
        </div>

        {/* Demo Information for Testing */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            For testing: Use any valid email format and password (6+ characters)
          </p>
        </div>
      </div>
    </div>
  );
}