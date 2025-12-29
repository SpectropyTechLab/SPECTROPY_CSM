# Spectropy PMS

## Overview

Spectropy PMS is a fullstack Project Management System built as a monorepo. It provides project tracking, task management with Kanban-style boards, team collaboration features, and a dashboard for monitoring project progress. The application uses a React frontend with a Node.js/Express backend, connected to a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with a dark theme (slate-900 background, indigo primary, cyan accent)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for page transitions and UI animations
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with typed routes defined in shared/routes.ts
- **Database ORM**: Drizzle ORM for type-safe database queries
- **Schema Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod

### Data Storage
- **Database**: PostgreSQL
- **Schema Location**: shared/schema.ts defines all database tables (users, projects, tasks)
- **Migrations**: Drizzle Kit for schema migrations (output to /migrations folder)
- **Relations**: Projects have many tasks, tasks can have assignees (users)

### Project Structure
```
/client          - React frontend application
  /src
    /pages       - Page components (Dashboard, Projects, Tasks, Welcome)
    /components  - Reusable UI components
    /hooks       - Custom React hooks for data fetching
    /lib         - Utility functions and query client
/server          - Express backend
  /routes.ts     - API route handlers
  /storage.ts    - Database access layer
  /db.ts         - Database connection
/shared          - Shared types and schemas between frontend/backend
  /schema.ts     - Drizzle database schema definitions
  /routes.ts     - API route definitions with Zod schemas
```

### Key Design Decisions
- **Monorepo Structure**: Client and server share types through the /shared directory, ensuring type safety across the stack
- **Type-Safe API**: Route definitions in shared/routes.ts provide compile-time validation for both client and server
- **Storage Abstraction**: IStorage interface in storage.ts allows for easy testing and potential storage backend changes
- **Component Library**: Using shadcn/ui provides accessible, customizable components without heavy dependencies

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database access with PostgreSQL dialect

### UI Libraries
- **Radix UI**: Headless accessible component primitives (dialog, dropdown, tabs, etc.)
- **Recharts**: Data visualization for analytics charts
- **Embla Carousel**: Carousel component
- **Framer Motion**: Animation library

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation for forms and API requests
- **@hookform/resolvers**: Zod integration for React Hook Form

### Development Tools
- **Vite**: Frontend build tool with HMR
- **TSX**: TypeScript execution for Node.js
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS/Autoprefixer**: CSS processing

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator