import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { databaseService, type UserLearningStats } from '../lib/database';
import AvatarUpload from '../components/AvatarUpload';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  X,
  Award,
  BookOpen,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';

export function Profile() {
  const { user, updateUserProfile } = useAuth();
  const { progress } = useProgress();
  
  // Real data state
  const [profileData, setProfileData] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserLearningStats | null>(null);
  const [businessPlansCount, setBusinessPlansCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [realAchievements, setRealAchievements] = useState<string[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar_url: user?.avatar || '',
    phone: '+255750939217',
    location: 'Mbeya, Tanzania',
    company: 'Tech Startup Inc.',
    position: 'Founder & CEO',
    bio: 'Passionate entrepreneur focused on building innovative solutions and continuous learning.'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        
        // Load profile data
        const profile = await databaseService.getProfile();
        setProfileData(profile);
        
        // Load user stats
        const stats = await databaseService.getUserLearningStats();
        setUserStats(stats);
        
        // Load business plans count
        const plans = await databaseService.getBusinessPlans();
        setBusinessPlansCount(plans.length);
        
        // Update form data with real profile data
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || user?.name || '',
            phone: profile.phone || '+255750939217',
            location: profile.location || 'Mbeya, Tanzania',
            company: profile.company || 'Tech Startup Inc.',
            position: profile.position || 'Founder & CEO',
            bio: profile.bio || 'Passionate entrepreneur focused on building innovative solutions and continuous learning.',
            avatar_url: profile.avatar_url || user?.avatar || ''
          }));
        }
        
        // Generate real achievements based on actual data
        const achievements = [];
        if (stats.total_courses_completed >= 1) {
          achievements.push('First Course Completed');
        }
        if (plans.length >= 1) {
          achievements.push('First Business Plan Created');
        }
        if (stats.current_streak_days >= 3) {
          achievements.push(`${stats.current_streak_days}-Day Learning Streak`);
        }
        if (stats.total_lessons_completed >= 5) {
          achievements.push('5 Lessons Mastered');
        }
        if (stats.total_lessons_completed >= 10) {
          achievements.push('10 Lessons Mastered');
        }
        if (stats.total_lessons_completed >= 25) {
          achievements.push('25 Lessons Mastered');
        }
        if (plans.length >= 3) {
          achievements.push('Business Plan Expert');
        }
        if (stats.total_courses_completed >= 3) {
          achievements.push('Course Completion Champion');
        }
        if (stats.current_streak_days >= 7) {
          achievements.push('Week-Long Learner');
        }
        if (stats.total_learning_time_minutes >= 300) { // 5+ hours
          achievements.push('Dedicated Learner');
        }
        
        setRealAchievements(achievements);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setMessage({ 
          type: 'error', 
          text: 'Failed to load profile data' 
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      await databaseService.updateProfile({
        full_name: formData.name,
        avatar_url: formData.avatar_url,
        phone: formData.phone,
        location: formData.location,
        company: formData.company,
        position: formData.position,
        bio: formData.bio
      });
      
      // Update the user context with new profile data
      await updateUserProfile({
        name: formData.name,
        avatar: formData.avatar_url
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      avatar_url: user?.avatar || '',
      phone: '+255750939217',
      location: 'Mbeya, Tanzania',
      company: 'Tech Startup Inc.',
      position: 'Founder & CEO',
      bio: 'Passionate entrepreneur focused on building innovative solutions and continuous learning.'
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleAvatarUploadSuccess = (url: string) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));
    // Update the user context and database when avatar is uploaded
    updateUserProfile({ avatar: url }).catch(error => {
      console.error('Error updating avatar in context:', error);
    });
    setMessage({ type: 'success', text: 'Avatar updated successfully!' });
  };

  const handleAvatarUploadError = (error: string) => {
    setMessage({ type: 'error', text: error });
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Profile Header */}
      {!isLoadingData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <img
              src={formData.avatar_url || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=ffffff&size=80`}
              alt={user?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{formData.name}</h1>
              <p className="text-sm sm:text-base text-gray-600">{formData.position && formData.company ? `${formData.position} at ${formData.company}` : formData.position || formData.company || 'BizGenius User'}</p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {formData.location || 'Location not set'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            <span className="sm:hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Avatar Upload Section - Only show when editing */}
          {isEditing && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">Profile Photo</h2>
              <AvatarUpload
                currentAvatar={formData.avatar_url}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleAvatarUploadError}
              />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h2>
              {isEditing && (
                <div className="flex space-x-1 sm:space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{formData.name}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{formData.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{formData.phone}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{formData.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Achievements */}
          {/* Achievements - Only show if user has achievements */}
          {!isLoadingData && realAchievements.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">Achievements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {realAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                    <Award className="h-6 w-6 text-amber-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{achievement}</p>
                      <p className="text-xs text-gray-600">Earned through your progress</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Learning Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <span className="text-xs sm:text-sm text-gray-600">Courses Completed</span>
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {userStats?.total_courses_completed || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-teal-500" />
                  <span className="text-xs sm:text-sm text-gray-600">Business Plans</span>
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">{businessPlansCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="text-xs sm:text-sm text-gray-600">Learning Streak</span>
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {userStats?.current_streak_days || 0} days
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-xs sm:text-sm text-gray-600">Achievements</span>
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">{realAchievements.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl p-4 sm:p-6 text-white">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Learning Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>{userStats ? Math.round((userStats.total_courses_completed / 12) * 100) : 0}%</span>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${userStats ? (userStats.total_courses_completed / 12) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-blue-100 mt-4">
                Keep up the great work! You're making excellent progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}