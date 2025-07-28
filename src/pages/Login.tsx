import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff } from 'lucide-react';

/**
 * Login Component
 * 
 * Simplified login page component with JWT authentication.
 * This is a fallback/alternative to the main AuthPage component.
 * 
 * Features:
 * - Email/password authentication
 * - JWT token handling via Supabase
 * - Password visibility toggle
 * - Loading states and error handling
 * - Mobile-first responsive design
 * 
 * Note: Consider using AuthPage for full login/register functionality.
 * This component is kept for backward compatibility and simple login flows.
 * 
 * @author BizGenius Team
 * @version 2.0.0
 */
export default function Login() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading: authLoading } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /**
   * Handle Form Submit
   * 
   * Processes login with JWT authentication.
   * Navigates to dashboard on successful login.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setLocalError(null);
    clearError();
    
    try {
      await login(email, password);
      // Navigation will be handled by the auth context/layout
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      setLocalError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear errors when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (localError || error) {
      setLocalError(null);
      clearError();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (localError || error) {
      setLocalError(null);
      clearError();
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4 space-y-8 p-6 sm:p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Briefcase className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">BizGenius</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Sign in to your account</p>
        </div>
        
        {/* Error Display */}
        {(localError || error) && (
          <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
            {localError || error}
          </div>
        )}
        
        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={handleEmailChange}
              className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={handlePasswordChange}
                className="block w-full px-3 py-2 pr-10 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {(isLoading || authLoading) ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign in'
            )}
          </button>
          
          <div className="text-xs sm:text-sm text-center text-gray-500">
            Use any valid email format and password (6+ characters)
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Need an account? Sign up here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}