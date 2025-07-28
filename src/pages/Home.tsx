import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService, type CourseRecord, type BusinessPlanRecord, type ChatHistoryRecord, type UserLearningStats } from '../lib/database';
import BookmarksPanel from '../components/BookmarksPanel';
import { 
  MessageSquare, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  Award,
  Clock,
  Target,
  Zap,
  Star,
  Bookmark
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<CourseRecord[]>([]);
  const [userStats, setUserStats] = useState<UserLearningStats | null>(null);
  const [businessPlans, setBusinessPlans] = useState<BusinessPlanRecord[]>([]);
  const [recentChats, setRecentChats] = useState<ChatHistoryRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);

  /**
   * Load all dashboard data from database
   */
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoadingCourses(true);
        setIsLoadingStats(true);
        
        // Load all data in parallel
        const [
          courses,
          stats,
          plans,
          chats
        ] = await Promise.all([
          databaseService.getFeaturedCourses(),
          databaseService.getUserLearningStats().catch(() => ({
            total_courses_started: 0,
            total_courses_completed: 0,
            total_lessons_completed: 0,
            total_learning_time_minutes: 0,
            current_streak_days: 0,
            last_activity_date: null
          })),
          databaseService.getBusinessPlans().catch(() => []),
          databaseService.getChatHistory(5).catch(() => [])
        ]);
        
        setFeaturedCourses(courses.slice(0, 3));
        setUserStats(stats);
        setBusinessPlans(plans);
        setRecentChats(chats);
        
        // Create recent activity from different sources
        const activities = [];
        
        // Add recent business plans
        plans.slice(0, 2).forEach(plan => {
          activities.push({
            type: 'business_plan',
            title: `Generated "${plan.title}"`,
            time: new Date(plan.created_at),
            icon: FileText,
            color: 'bg-teal-500'
          });
        });
        
        // Add recent AI interactions
        chats.slice(0, 2).forEach(chat => {
          activities.push({
            type: 'ai_chat',
            title: `Asked about ${chat.question.slice(0, 50)}...`,
            time: new Date(chat.created_at),
            icon: MessageSquare,
            color: 'bg-purple-500'
          });
        });
        
        // Sort by time and take most recent
        activities.sort((a, b) => b.time.getTime() - a.time.getTime());
        setRecentActivity(activities.slice(0, 3));
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoadingCourses(false);
        setIsLoadingStats(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const quickActions = [
    {
      title: 'Ask AI Assistant',
      description: 'Get instant business advice',
      icon: MessageSquare,
      link: '/assistant',
      color: 'bg-blue-500'
    },
    {
      title: 'Create Business Plan',
      description: 'Generate professional plans',
      icon: FileText,
      link: '/business-plan',
      color: 'bg-teal-500'
    },
    {
      title: 'Continue Learning',
      description: 'Pick up where you left off',
      icon: BookOpen,
      link: '/learning',
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'Track your progress',
      icon: TrendingUp,
      link: '/analytics',
      color: 'bg-amber-500',
      comingSoon: true
    }
  ];

  // Calculate total courses for remaining courses display
  const totalCourses = featuredCourses.length > 0 ? 12 : 0; // Assuming 12 total courses
  const coursesRemaining = userStats ? totalCourses - userStats.total_courses_completed : totalCourses;
  
  // Generate achievements based on user progress
  const generateAchievements = () => {
    const achievements = [];
    if (userStats) {
      if (userStats.total_courses_completed >= 1) achievements.push('First Course Completed');
      if (businessPlans.length >= 1) achievements.push('First Business Plan');
      if (userStats.current_streak_days >= 3) achievements.push('3-Day Learning Streak');
      if (userStats.total_lessons_completed >= 10) achievements.push('10 Lessons Mastered');
      if (businessPlans.length >= 3) achievements.push('Business Plan Expert');
    }
    return achievements;
  };
  
  const achievements = generateAchievements();
  
  const stats = [
    {
      title: 'Courses Completed',
      value: userStats ? `${userStats.total_courses_completed}/${totalCourses}` : '0/12',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      title: 'Business Plans',
      value: businessPlans.length,
      icon: FileText,
      color: 'text-teal-600'
    },
    {
      title: 'AI Interactions',
      value: recentChats.length,
      icon: MessageSquare,
      color: 'text-purple-600'
    },
    {
      title: 'Learning Streak',
      value: userStats ? `${userStats.current_streak_days} days` : '0 days',
      icon: Zap,
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</h1>
            <p className="text-blue-100">Ready to take your business knowledge to the next level?</p>
          </div>
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors flex items-center space-x-2"
          >
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Bookmarks</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{userStats ? Math.round(userStats.total_learning_time_minutes / 60) : 0}h total learning</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>{coursesRemaining} courses remaining</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>{achievements.length} achievements</span>
          </div>
        </div>
      </div>

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <BookmarksPanel className="mb-6" />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="group p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300"
          >
            <div className="relative">
              {action.comingSoon && (
                <span className="absolute -top-2 -right-2 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                  Coming Soon
                </span>
              )}
            </div>
            <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${action.color} text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{action.title}</h3>
            <p className="text-gray-600 text-xs sm:text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">{stat.title}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 ${activity.color.replace('bg-', 'bg-')} rounded-full mt-2`}></div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {activity.time.toLocaleDateString() === new Date().toLocaleDateString() 
                        ? activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : activity.time.toLocaleDateString()
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
              <p className="text-sm text-gray-500">Start learning or create a business plan to see your activity here</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{achievement}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No achievements yet</p>
              <p className="text-sm text-gray-500">Complete courses and create business plans to earn achievements</p>
            </div>
          )}
        </div>
      </div>

      {/* Featured Courses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Featured Courses</h3>
          <Link 
            to="/learning" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>
        
        {isLoadingCourses ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCourses.map((course) => (
              <Link
                key={course.id}
                to="/learning"
                className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
                <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-amber-500" />
                    <span>{course.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}