import React, { createContext, useContext, useState, ReactNode } from 'react';
import { databaseService, type UserLearningStats } from '../lib/database';

interface Progress {
  coursesCompleted: number;
  totalCourses: number;
  businessPlansCreated: number;
  aiInteractions: number;
  learningStreak: number;
  achievements: string[];
  realStats?: UserLearningStats;
}

interface ProgressContextType {
  progress: Progress;
  updateProgress: (key: keyof Progress, value: number | string[]) => void;
  addAchievement: (achievement: string) => void;
  refreshStats: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
}

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useState<Progress>({
    coursesCompleted: 3,
    totalCourses: 12,
    businessPlansCreated: 2,
    aiInteractions: 47,
    learningStreak: 5,
    achievements: ['First Business Plan', 'AI Expert', '5-Day Streak']
  });

  const refreshStats = async () => {
    try {
      const realStats = await databaseService.getUserLearningStats();
      setProgress(prev => ({
        ...prev,
        coursesCompleted: realStats.total_courses_completed,
        learningStreak: realStats.current_streak_days,
        realStats
      }));
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  const updateProgress = (key: keyof Progress, value: number | string[]) => {
    setProgress(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addAchievement = (achievement: string) => {
    setProgress(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievement]
    }));
  };

  return (
    <ProgressContext.Provider value={{ progress, updateProgress, addAchievement, refreshStats }}>
      {children}
    </ProgressContext.Provider>
  );
}