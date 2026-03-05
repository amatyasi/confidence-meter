# Confidence Meter - Web Application

## Overview

The Confidence Meter is a web-based implementation of Itamar Gilad's Confidence Meter methodology for systematic, evidence-based scoring of product ideas in ICE (Impact, Confidence, Ease) prioritization frameworks. The application provides an interactive interface for product managers to calculate reproducible confidence scores based on defined evidence categories and their weights, moving away from subjective "vibes-based" scoring toward a more rigorous evaluation process.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development and build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: React hooks for local state, TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Design System**: Dark theme with CSS variables, Inter font family, responsive design with mobile-first approach

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for assessment CRUD operations and evidence parsing
- **Data Validation**: Zod schemas shared between client and server
- **Development**: Hot reload with Vite integration for full-stack development

### Data Storage Solutions
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via Neon Database serverless)
- **Schema**: Structured tables for users and confidence assessments with JSON fields for flexible evidence data
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Local Storage**: Client-side persistence for evidence data with 30-minute expiry

### Authentication and Authorization
- **Strategy**: Session-based authentication (infrastructure prepared but not fully implemented)
- **Security**: Password hashing and secure session management prepared in schema
- **Current State**: Application operates without authentication requirement for MVP

### Core Calculation Engine
- **Methodology**: Faithful implementation of Itamar Gilad's Confidence Meter with fixed evidence category weights
- **Evidence Categories**: Nine categories grouped into five logical groups with maximum confidence caps
- **Scoring Algorithm**: Weighted scoring with group-level caps to prevent overflow
- **Real-time Calculation**: Immediate score updates as evidence is adjusted

### AI Integration
- **Service**: OpenAI GPT-4o for intelligent evidence parsing
- **Functionality**: Automatic categorization of free-text evidence into appropriate evidence categories
- **Fallback**: Manual evidence entry when AI parsing is unavailable
- **Error Handling**: Graceful degradation when AI services are blocked or unavailable

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migrations and schema management

### AI Services
- **OpenAI API**: GPT-4o model for evidence text analysis and categorization
- **Configuration**: API key-based authentication with error handling for service unavailability

### Analytics and Monitoring
- **Google Analytics 4**: Page view and event tracking with ad-blocker protection
- **Mixpanel**: Advanced user behavior analytics with comprehensive error handling
- **Implementation**: Safe analytics wrappers that gracefully handle blocked scripts

### UI and Component Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Consistent icon library with TypeScript support
- **React Hook Form**: Form state management with validation integration

### Development and Build Tools
- **Vite**: Fast development server and build tool with HMR
- **Replit Integration**: Development environment plugins and runtime error overlay
- **TypeScript**: Strong typing across full stack with shared type definitions
- **ESBuild**: Fast bundling for production server builds

### Cloud and Deployment
- **Replit Hosting**: Integrated development and deployment platform
- **Environment Variables**: Secure configuration management for API keys and database connections
- **Asset Management**: Static file serving with proper caching headers