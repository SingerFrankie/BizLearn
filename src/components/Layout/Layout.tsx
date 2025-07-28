import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import AuthPage from '../../pages/AuthPage';

/**
 * Layout Component
 * 
 * Main layout wrapper that handles authentication state and app structure.
 * Provides the overall application layout with sidebar, header, and main content area.
 * 
 * Features:
 * - Authentication state management
 * - Conditional rendering based on auth status
 * - Responsive layout with sidebar and header
 * - Loading states during auth initialization
 * - JWT session handling
 * 
 * Layout Structure:
 * - Unauthenticated: Shows AuthPage (login/register)
 * - Authenticated: Shows full app layout with sidebar and header
 * - Loading: Shows loading spinner during auth initialization
 * 
 * Mobile-First Design:
 * - Responsive sidebar (hidden on mobile, overlay on tablet, fixed on desktop)
 * - Flexible main content area
 * - Touch-friendly navigation
 * 
 * @author BizGenius Team
 * @version 2.0.0
 */
export default function Layout() {
  const { user, isLoading } = useAuth();

  /**
   * Loading State
   * 
   * Shows loading spinner while authentication state is being determined.
   * This prevents flash of login page for authenticated users.
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BizGenius...</p>
        </div>
      </div>
    );
  }

  /**
   * Unauthenticated State
   * 
   * Shows authentication page when user is not logged in.
   * Uses AuthPage which provides both login and registration functionality.
   */
  if (!user) {
    return <AuthPage />;
  }

  /**
   * Authenticated Layout
   * 
   * Main application layout for authenticated users.
   * Includes sidebar navigation, header, and main content area.
   * 
   * Layout Features:
   * - Responsive sidebar (mobile overlay, desktop fixed)
   * - Header with user info and search
   * - Main content area with routing
   * - Proper overflow handling
   */
  return (
    <div className="lg:flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header />
        
        {/* Main Content with Routing */}
        <main className="flex-1 overflow-auto pt-0 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}