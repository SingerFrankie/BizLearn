import React from 'react';
import { useProgress } from '../contexts/ProgressContext';
import { 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Target, 
  Award,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function Analytics() {
  const { progress } = useProgress();

  const weeklyProgress = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 1.8 },
    { day: 'Wed', hours: 3.2 },
    { day: 'Thu', hours: 2.1 },
    { day: 'Fri', hours: 4.0 },
    { day: 'Sat', hours: 1.5 },
    { day: 'Sun', hours: 2.8 }
  ];

  const categoryProgress = [
    { category: 'Marketing', completed: 4, total: 8, color: 'bg-blue-500' },
    { category: 'Finance', completed: 3, total: 6, color: 'bg-teal-500' },
    { category: 'Operations', completed: 2, total: 5, color: 'bg-purple-500' },
    { category: 'Strategy', completed: 1, total: 4, color: 'bg-amber-500' },
    { category: 'Leadership', completed: 2, total: 3, color: 'bg-red-500' }
  ];

  const maxHours = Math.max(...weeklyProgress.map(d => d.hours));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">Track your progress and identify areas for improvement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Learning Hours</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">147.5</p>
              <p className="text-xs sm:text-sm text-green-600 font-medium">+12.3% from last month</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">68%</p>
              <p className="text-xs sm:text-sm text-green-600 font-medium">+5.2% from last month</p>
            </div>
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-teal-500" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Learning Streak</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{progress.learningStreak} days</p>
              <p className="text-xs sm:text-sm text-green-600 font-medium">Personal best!</p>
            </div>
            <Award className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Avg. Session</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">45 min</p>
              <p className="text-xs sm:text-sm text-gray-600">Optimal range</p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Weekly Progress Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Weekly Learning Hours</h3>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {weeklyProgress.map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-xs sm:text-sm font-medium text-gray-600 w-6 sm:w-8">{day.day}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(day.hours / maxHours) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900 w-8 sm:w-10 text-right">{day.hours}h</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total this week:</span>
              <span className="font-medium text-gray-900">18.9 hours</span>
            </div>
          </div>
        </div>

        {/* Category Progress */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Progress by Category</h3>
            <PieChart className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {categoryProgress.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{category.category}</span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {category.completed}/{category.total} courses
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${category.color}`}
                    style={{ width: `${(category.completed / category.total) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round((category.completed / category.total) * 100)}% complete
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Achievements */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Achievements</h3>
            <Award className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {progress.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                <Award className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{achievement}</p>
                  <p className="text-xs text-gray-600">Earned recently</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Goals */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Learning Goals</h3>
            <Target className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-medium text-gray-900">Complete 5 courses this month</span>
                <span className="text-xs sm:text-sm text-gray-600">3/5</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-medium text-gray-900">Study 20 hours per week</span>
                <span className="text-xs sm:text-sm text-gray-600">18.9/20</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: '94.5%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-medium text-gray-900">Maintain 7-day streak</span>
                <span className="text-xs sm:text-sm text-gray-600">5/7</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: '71.4%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Insights */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="h-6 w-6" />
          <h3 className="text-base sm:text-lg font-semibold">Learning Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 className="text-sm sm:text-base font-medium mb-2">Peak Learning Time</h4>
            <p className="text-sm text-blue-100">You're most productive between 2-4 PM</p>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 className="text-sm sm:text-base font-medium mb-2">Preferred Format</h4>
            <p className="text-sm text-blue-100">Video tutorials work best for you</p>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 className="text-sm sm:text-base font-medium mb-2">Recommendation</h4>
            <p className="text-sm text-blue-100">Focus more on Finance courses</p>
          </div>
        </div>
      </div>
    </div>
  );
}