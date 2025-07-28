import React, { useState, useEffect } from 'react';
import { Play, BookOpen, Clock, Star, Bookmark, CheckCircle, Filter, StickyNote, BookmarkCheck } from 'lucide-react';
import { databaseService, type CourseRecord, type CourseProgressSummary } from '../lib/database';
import NotesPanel from '../components/NotesPanel';

// Extended interface for UI state
interface CourseWithProgress extends CourseRecord {
  completed: boolean;
  bookmarked: boolean;
  progress: number;
  realProgress?: CourseProgressSummary;
}

export default function LearningHub() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  // Notes panel state
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [selectedCourseForNotes, setSelectedCourseForNotes] = useState<string | null>(null);

  const categories = ['All', 'Marketing', 'Finance', 'Operations', 'Strategy', 'Leadership'];
  const levels = ['All', 'beginner', 'intermediate', 'advanced'];

  /**
   * Load courses from database
   */
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load courses and user stats in parallel
        const [coursesData, statsData] = await Promise.all([
          databaseService.getCourses(),
          databaseService.getUserLearningStats().catch(() => ({
            total_courses_started: 0,
            total_courses_completed: 0,
            total_lessons_completed: 0,
            total_learning_time_minutes: 0,
            current_streak_days: 0,
            last_activity_date: null
          }))
        ]);
        
        setUserStats(statsData);
        
        // Get real progress for all courses
        const courseIds = coursesData.map(course => course.id);
        const progressData = await databaseService.getMultipleCourseProgress(courseIds).catch(() => ({}));
        
        // Get bookmarked lessons to determine course bookmark status
        const lessonBookmarks = await databaseService.getLessonBookmarks().catch(() => []);
        const bookmarkedLessonIds = new Set(lessonBookmarks.map(b => b.related_id));
        
        // Get lessons for each course to check bookmark status
        const courseLessons = await Promise.all(
          coursesData.map(course => 
            databaseService.getLessonsByCourse(course.id).catch(() => [])
          )
        );
        
        // Add UI state to database courses
        const coursesWithProgress: CourseWithProgress[] = coursesData.map((course, index) => ({
          ...course,
          completed: progressData[course.id]?.progress_percentage === 100,
          bookmarked: courseLessons[index]?.some(lesson => bookmarkedLessonIds.has(lesson.id)) || false,
          progress: progressData[course.id]?.progress_percentage || 0,
          realProgress: progressData[course.id]
        }));
        
        setCourses(coursesWithProgress);
      } catch (error) {
        console.error('Error loading courses:', error);
        setError('Failed to load courses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const categoryMatch = selectedCategory === 'All' || course.category === selectedCategory;
    const levelMatch = selectedLevel === 'All' || course.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  const toggleBookmark = async (courseId: string) => {
    try {
      // Get first lesson of the course to bookmark
      const lessons = await databaseService.getLessonsByCourse(courseId);
      if (lessons.length === 0) {
        setError('No lessons found for this course');
        return;
      }
      
      const firstLesson = lessons[0];
      const isNowBookmarked = await databaseService.toggleBookmark('lesson', firstLesson.id);
      
      // Update local state
      setCourses(prev =>
        prev.map(course =>
          course.id === courseId
            ? { ...course, bookmarked: isNowBookmarked }
            : course
        )
      );
    } catch (error) {
      console.error('Error toggling course bookmark:', error);
      setError('Failed to update bookmark');
    }
  };

  // Capitalize level for display
  const formatLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="flex h-full">
      {/* Main Learning Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Learning Hub</h1>
              <p className="text-sm sm:text-base text-gray-600">Expand your business knowledge with expert-led courses</p>
            </div>
            
            {/* Notes toggle button */}
            <button
              onClick={() => setShowNotesPanel(!showNotesPanel)}
              className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors flex items-center space-x-2 ${
                showNotesPanel
                  ? 'text-amber-700 bg-amber-50 border-amber-300'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <StickyNote className="h-4 w-4" />
              <span className="hidden sm:inline">Learning Notes</span>
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Courses Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userStats?.total_courses_completed || 0} / {courses.length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${courses.length > 0 ? ((userStats?.total_courses_completed || 0) / courses.length) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hours Learned</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userStats ? Math.round((userStats.total_learning_time_minutes || 0) / 60 * 10) / 10 : 0}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Learning Streak</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userStats?.current_streak_days || 0} days
                </p>
              </div>
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Keep it up!</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Category:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Level:</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none"
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                      course.level === 'beginner' ? 'bg-green-500' :
                      course.level === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {formatLevel(course.level)}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleBookmark(course.id)}
                      className={`p-2 rounded-full ${
                        course.bookmarked ? 'bg-amber-500 text-white' : 'bg-white text-gray-600'
                      } hover:scale-110 transition-transform`}
                    >
                      {course.bookmarked ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {course.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 px-3 py-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{course.progress}% complete</span>
                        {course.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      {course.realProgress && course.realProgress.total_lessons > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          {course.realProgress.completed_lessons}/{course.realProgress.total_lessons} lessons
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>{course.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.students_count}</span>
                    </div>
                  </div>
                  
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span className="text-sm sm:text-base">{course.progress > 0 ? 'Continue' : 'Start Course'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more courses.</p>
          </div>
        )}
      </div>
    </div>
  );
}