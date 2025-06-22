# AI Newsletter Automation Hub

## Overview

This is a full-stack AI-powered newsletter automation system built with React, Express, and PostgreSQL. The application automates the process of fetching news articles, generating newsletters using Claude AI, and publishing them through Beehiiv. It features a dashboard interface for managing news sources, article selection, newsletter generation, and system settings.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with structured error handling
- **Development**: Hot reload with Vite middleware in development

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver (migrated from in-memory storage)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: Users, articles, newsletters, settings, activity logs, schedules, and social media posts
- **Data Validation**: Zod schemas for runtime type checking
- **Storage Layer**: DatabaseStorage implementation with full CRUD operations

## Key Components

### News Management System
- **News Fetching**: Supports multiple feed formats (RSS, Atom, JSON, Inoreader)
- **Article Storage**: Temporary storage with selection capabilities
- **Source Configuration**: Configurable news sources with default Inoreader feed
- **Auto-refresh**: Optional automatic news fetching every 5 minutes

### AI Newsletter Generation
- **AI Service**: Anthropic Claude integration (default model: claude-sonnet-4-20250514)
- **Content Generation**: Automated newsletter creation from selected articles
- **Rich Text Editor**: WYSIWYG editor with formatting tools and multi-platform preview
- **Platform Preview**: Mobile, desktop, and email format previews
- **Customization**: Configurable temperature, max tokens, and custom prompts
- **Templates**: Standardized newsletter format with issue numbering

### Publishing Integration
- **Beehiiv Integration**: Direct publishing to Beehiiv platform
- **Draft Management**: Save drafts before publishing
- **Publication Management**: Support for multiple publications
- **Status Tracking**: Track newsletter status (draft, generated, published)

### Settings Management
- **API Configuration**: Claude, Beehiiv, and SendGrid API key management
- **Newsletter Settings**: Title, issue numbering, and default sources
- **AI Parameters**: Model selection, temperature, and token limits
- **Email Settings**: SendGrid configuration and approval workflow settings
- **Scheduling Settings**: Daily automation, article selection, and time configuration
- **Connection Testing**: Built-in API connectivity testing

### Activity Monitoring
- **Real-time Logging**: Comprehensive activity tracking
- **Log Management**: View, export, and clear system logs
- **Error Handling**: Structured error logging with details
- **Performance Monitoring**: API response time tracking

### Scheduling System
- **Automated Generation**: Daily, weekly, and monthly newsletter schedules
- **Multi-source Support**: Different news sources for different schedules
- **Auto-approval**: Optional automatic approval and publishing
- **Schedule Management**: Create, edit, pause, and delete schedules

### Email Approval Workflow
- **Approval Notifications**: Email notifications for newsletter approval
- **One-click Actions**: Approve or reject newsletters via email links
- **Toggle Control**: Enable/disable approval requirement per newsletter
- **SendGrid Integration**: Professional email delivery service

### Social Media Automation
- **Multi-platform Generation**: Automated posts for Twitter/X, Instagram, and YouTube Shorts
- **AI-powered Content**: Claude AI generates engaging, platform-specific content
- **Random Scheduling**: Posts scheduled at optimal engagement times
- **Subscription Focus**: Content designed to drive newsletter subscriptions
- **Hashtag Optimization**: Platform-specific hashtag strategies for maximum reach

## Data Flow

1. **News Ingestion**: Articles are fetched from configured RSS/JSON feeds
2. **Content Curation**: Users manually select articles for newsletter inclusion
3. **AI Processing**: Selected articles are processed by Claude AI to generate newsletter content
4. **Review & Edit**: Generated newsletters can be reviewed and modified
5. **Publishing**: Final newsletters are published to Beehiiv platform
6. **Social Media Generation**: AI creates platform-specific posts for Twitter, Instagram, and YouTube
7. **Multi-channel Distribution**: Content is automatically scheduled across social platforms
8. **Tracking**: All activities are logged for monitoring and debugging

## External Dependencies

### AI Services
- **Anthropic Claude**: Primary AI service for content generation
- **Model Support**: Latest Claude models with configurable parameters
- **API Management**: Secure key storage and connection testing

### Publishing Platform
- **Beehiiv**: Newsletter publishing and distribution platform
- **API Integration**: Full CRUD operations for newsletter management
- **Publication Management**: Support for multiple publication endpoints

### News Sources
- **Inoreader**: Default aggregated AI news feed
- **RSS/Atom Feeds**: Support for standard news feed formats
- **Custom Sources**: Configurable feed URLs for different topics

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Connection Pooling**: Efficient database connection management
- **Migration Support**: Automated schema updates and versioning

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Local or hosted PostgreSQL instance
- **Environment Variables**: Secure configuration for API keys and database URLs

### Production Deployment
- **Platform**: Replit autoscale deployment
- **Build Process**: Vite production build with Express server bundling
- **Static Assets**: Optimized client bundle served by Express
- **Process Management**: Single Node.js process handling both API and static content

### Environment Configuration
- **Port Management**: Configurable port with external port mapping (5000 → 80)
- **Database Connection**: Environment-based PostgreSQL connection string
- **API Keys**: Secure environment variable storage for external services
- **Session Management**: PostgreSQL-backed session storage

## Changelog
- June 22, 2025: Initial setup
- June 22, 2025: Enhanced with advanced features
  - Added rich text editor with multi-platform preview (mobile, desktop, email)
  - Implemented scheduling system for automated newsletter generation
  - Added email approval workflow with SendGrid integration
  - Enhanced settings with scheduling and email configuration options
  - Added schedule manager for creating daily/weekly/monthly automated newsletters
- June 22, 2025: Migrated to PostgreSQL database
  - Replaced in-memory storage with DatabaseStorage implementation
  - Added database connection and ORM configuration
  - Pushed schema to PostgreSQL for persistent data storage
- June 22, 2025: Added Social Media Automation
  - Implemented AI-powered social media post generation for Twitter, Instagram, and YouTube Shorts
  - Added SocialMediaService for platform-specific content creation
  - Created SocialMediaManager component for managing multi-platform posts
  - Integrated random scheduling for optimal engagement times
  - Added social media posts database table with full CRUD operations

## User Preferences

Preferred communication style: Simple, everyday language.