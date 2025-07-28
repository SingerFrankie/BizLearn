import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import BusinessPlan from './pages/BusinessPlan';
import LearningHub from './pages/LearningHub';
import Analytics from './pages/Analytics';
import { Profile } from './pages/Profile';
import Login from './pages/Login';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="assistant" element={<AIAssistant />} />
                <Route path="business-plan" element={<BusinessPlan />} />
                <Route path="learning" element={<LearningHub />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </ProgressProvider>
    </AuthProvider>
  );
}

export default App;