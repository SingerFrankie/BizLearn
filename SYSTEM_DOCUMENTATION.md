# BizGenius System Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Flow](#user-flow)
3. [Database Schema](#database-schema)
4. [Authentication & Security](#authentication--security)
5. [API Integration](#api-integration)
6. [Component Architecture](#component-architecture)

---

## 🎯 System Overview

**BizGenius** is an AI-powered business learning platform that combines:
- **AI Business Assistant** - Real-time business consulting via OpenRouter API
- **Business Plan Generator** - AI-generated professional business plans
- **Learning Hub** - Structured courses and lessons
- **Progress Tracking** - Analytics and achievement system
- **User Management** - Profiles, bookmarks, and notes

### Technology Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenRouter API (DeepSeek model)
- **Deployment**: Vite development server

---

## 🔄 User Flow

### 1. Authentication Flow
```
Unauthenticated User
    ↓
AuthPage (Login/Register)
    ↓
Supabase Auth (JWT)
    ↓
Profile Creation (automatic)
    ↓
Dashboard (Home)
```

### 2. AI Assistant Flow
```
User Question
    ↓
OpenRouter API Request
    ↓
AI Response Generation
    ↓
Save to chat_history
    ↓
Display with Bookmark Option
    ↓
Optional: Add to bookmarks table
```

### 3. Business Plan Flow
```
Business Details Form
    ↓
AI Plan Generation (OpenRouter)
    ↓
Save to business_plans
    ↓
Display Structured Sections
    ↓
Export Options (PDF/Word)
```

### 4. Learning Flow
```
Browse Courses
    ↓
Select Course/Lesson
    ↓
Track Progress (user_progress)
    ↓
Take Notes (notes table)
    ↓
Bookmark Content (bookmarks)
    ↓
Update Learning Stats
```

### 5. Data Management Flow
```
User Actions
    ↓
Database Operations (RLS Protected)
    ↓
Real-time UI Updates
    ↓
Progress Analytics
    ↓
Achievement System
```

---

## 🗄️ Database Schema

### Core Tables Structure

```sql
-- Authentication (Supabase managed)
auth.users
├── id (UUID, PK)
├── email
├── created_at
└── metadata

-- User Profiles
profiles
├── id (UUID, PK, FK → auth.users)
├── full_name
├── avatar_url
├── email
├── phone
├── location
├── company
├── position
├── bio
├── preferences (JSONB)
└── timestamps

-- Chat History
chat_history
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── question (TEXT)
├── answer (TEXT)
├── conversation_id (UUID)
├── message_type (ENUM)
├── tokens_used (INTEGER)
├── model_used (TEXT)
├── response_time_ms (INTEGER)
└── timestamps

-- Business Plans
business_plans
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── business_name
├── industry
├── business_type
├── location
├── target_audience
├── value_proposition
├── revenue_model
├── goals
├── generated_plan (JSONB)
├── title
├── status (ENUM: draft|complete|archived)
├── ai_model_used
├── generation_time_ms
├── is_favorite (BOOLEAN)
├── export_count (INTEGER)
└── timestamps

-- Courses (Public Content)
courses
├── id (UUID, PK)
├── title
├── description
├── category
├── level (ENUM: beginner|intermediate|advanced)
├── thumbnail_url
├── duration
├── rating (DECIMAL)
├── students_count (INTEGER)
├── instructor_name
├── instructor_bio
├── course_content (JSONB)
├── tags (TEXT[])
├── price (DECIMAL)
├── is_featured (BOOLEAN)
├── is_published (BOOLEAN)
└── timestamps

-- Lessons (Public Content)
lessons
├── id (UUID, PK)
├── course_id (UUID, FK → courses)
├── title
├── video_url
├── transcript
├── order (INTEGER)
├── duration
├── description
├── resources (JSONB)
├── quiz_questions (JSONB)
├── is_preview (BOOLEAN)
├── is_published (BOOLEAN)
└── timestamps

-- User Progress Tracking
user_progress
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── lesson_id (UUID, FK → lessons)
├── is_completed (BOOLEAN)
├── completed_at (TIMESTAMP)
└── timestamps

-- Notes System
notes
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── content (TEXT)
├── type (ENUM: assistant|lesson)
├── related_id (UUID) -- Polymorphic reference
└── timestamps

-- Bookmarks System
bookmarks
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── type (ENUM: lesson|chat)
├── related_id (UUID) -- Polymorphic reference
└── created_at
```

### Relationship Diagram

```
auth.users (1) ←→ (1) profiles
    ↓
    ├── (1) ←→ (∞) chat_history
    ├── (1) ←→ (∞) business_plans
    ├── (1) ←→ (∞) user_progress
    ├── (1) ←→ (∞) notes
    └── (1) ←→ (∞) bookmarks

courses (1) ←→ (∞) lessons
lessons (1) ←→ (∞) user_progress

-- Polymorphic Relationships (via related_id)
notes.related_id → chat_history.id | lessons.id
bookmarks.related_id → chat_history.id | lessons.id
```

### Data Flow Relationships

```
User Registration
    ↓
Profile Creation (auto-trigger)
    ↓
Learning Activities
    ├── Chat History → Bookmarks
    ├── Course Progress → User Progress
    ├── Note Taking → Notes
    └── Business Plans → Export Tracking
```

---

## 🔒 Authentication & Security

### Row-Level Security (RLS) Implementation

```sql
-- All user tables have RLS enabled with policies:

-- SELECT Policy (Read Own Data)
CREATE POLICY "Users can read own data" ON table_name
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT Policy (Create Own Data)
CREATE POLICY "Users can insert own data" ON table_name
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy (Modify Own Data)
CREATE POLICY "Users can update own data" ON table_name
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy (Delete Own Data)
CREATE POLICY "Users can delete own data" ON table_name
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

### Security Features
- **JWT Authentication**: Supabase managed tokens
- **Database-Level Security**: RLS policies enforce user isolation
- **API Key Protection**: OpenRouter keys stored in environment variables
- **Data Validation**: TypeScript interfaces ensure data integrity
- **Error Handling**: Comprehensive error boundaries and user feedback

---

## 🔌 API Integration

### OpenRouter AI Integration

```typescript
// Business Assistant Configuration
Model: 'tngtech/deepseek-r1t2-chimera:free'
Max Tokens: 1000-4000 (depending on use case)
Temperature: 0.7 (balanced creativity)
System Prompt: Business expertise context

// API Endpoints Used
POST /chat/completions - Chat responses
GET /models - Available models
```

### Supabase Integration

```typescript
// Database Operations
- Real-time subscriptions for live updates
- Batch operations for performance
- Transaction support for data consistency
- File storage for avatars and documents

// Authentication
- Email/password authentication
- JWT token management
- Session persistence
- Password reset flows
```

---

## 🏗️ Component Architecture

### Page Components
```
src/pages/
├── Home.tsx              # Dashboard with overview
├── AIAssistant.tsx       # Chat interface
├── BusinessPlan.tsx      # Plan generation & management
├── LearningHub.tsx       # Course catalog & progress
├── Analytics.tsx         # Progress tracking & insights
├── Profile.tsx           # User profile management
└── AuthPage.tsx          # Login/registration
```

### Layout Components
```
src/components/Layout/
├── Layout.tsx            # Main app wrapper
├── Header.tsx            # Top navigation
└── Sidebar.tsx           # Side navigation
```

### Feature Components
```
src/components/
├── AvatarUpload.tsx      # Profile image upload
├── BookmarksPanel.tsx    # Bookmark management
└── NotesPanel.tsx        # Note-taking interface
```

### Service Layer
```
src/lib/
├── supabase.ts           # Database client
├── database.ts           # Database service methods
├── openai.ts             # AI assistant service
├── businessPlanGenerator.ts # Business plan AI service
└── storage.ts            # File upload service
```

### Context Providers
```
src/contexts/
├── AuthContext.tsx       # Authentication state
└── ProgressContext.tsx   # Learning progress state
```

---

## 📊 Data Relationships Summary

### User-Centric Design
All user data is isolated and secured through RLS policies. Each user has:

1. **Profile Data**: Personal information and preferences
2. **Learning Data**: Course progress, notes, and bookmarks
3. **AI Interactions**: Chat history and business plans
4. **Analytics Data**: Computed from user activities

### Polymorphic Relationships
- **Notes**: Can reference chat_history OR lessons via related_id
- **Bookmarks**: Can reference chat_history OR lessons via related_id
- **Type Field**: Distinguishes the target table for polymorphic references

### Performance Optimizations
- **Strategic Indexes**: On user_id, created_at, and frequently queried fields
- **Computed Fields**: sections_count, progress_percentage calculated via triggers
- **Efficient Queries**: Batch operations and optimized joins where possible

---

## 🚀 Deployment & Scaling

### Current Architecture
- **Development**: Vite dev server with hot reload
- **Database**: Supabase hosted PostgreSQL
- **AI**: OpenRouter API with rate limiting
- **Storage**: Supabase Storage for file uploads

### Scaling Considerations
- **Database**: Supabase handles scaling automatically
- **AI Costs**: Free tier with upgrade options
- **CDN**: Static assets served via Supabase
- **Monitoring**: Built-in Supabase analytics

---

*This documentation provides a comprehensive overview of the BizGenius system architecture, data flow, and relationships. For specific implementation details, refer to the individual source files and database migration scripts.*