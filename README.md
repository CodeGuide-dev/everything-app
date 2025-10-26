# Codeguide Starter Fullstack

A modern web application starter template built with Next.js 15, featuring authentication, database integration, and dark mode support.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router with Turbopack)
- **Language:** TypeScript
- **Authentication:** [Better Auth](https://better-auth.com/)
- **Database:** [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (New York style)
- **Theme System:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Icons:** [Lucide React](https://lucide.dev/)

## Prerequisites

Before you begin, ensure you have the following:
- Node.js 18+ installed
- Docker and Docker Compose (for database setup)
- Generated project documents from [CodeGuide](https://codeguide.dev/) for best development experience

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codeguide-starter-fullstack
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Variables Setup**
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - The default values work with Docker setup, modify as needed

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.**

## Configuration

### Option 1: Docker Setup (Recommended)
1. **Start PostgreSQL with Docker:**
   ```bash
   npm run db:up
   ```
   This starts PostgreSQL in a Docker container with default credentials.

2. **Push database schema:**
   ```bash
   npm run db:push
   ```

### Option 2: Local Database Setup
1. Create a PostgreSQL database locally
2. Update your environment variables in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   POSTGRES_DB=your_database_name
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   ```
3. Run database migrations:
   ```bash
   npm run db:push
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (defaults work with Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Authentication
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# MinIO Object Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BROWSER_REDIRECT_URL=http://localhost:9001
```

## MinIO Object Storage

This project includes MinIO for S3-compatible object storage. Perfect for file uploads, media storage, and data backups.

### Quick Start

```bash
# Start MinIO server
docker-compose up minio -d

# Create default buckets (optional)
docker-compose --profile setup up create-buckets
```

### Access MinIO

- **API Endpoint**: http://localhost:9000
- **Web Console**: http://localhost:9001
- **Default Credentials**: minioadmin / minioadmin123

### Using MinIO Client

```bash
# Start MinIO client container
docker-compose --profile tools up mc

# Or use local mc command
mc alias set local http://localhost:9000 minioadmin minioadmin123
mc admin info local
```

### Configuration

The `docker-compose.yml` includes several MinIO services:

- **minio**: Main MinIO server with persistent storage
- **mc**: Optional MinIO client for convenience (profile: tools)
- **create-buckets**: Automatic bucket creation (profile: setup)

### Default Buckets

When using the setup profile, these buckets are created:
- `uploads`: Public bucket for user uploads
- `backups`: Private bucket for backups
- `media`: Download-only bucket for media files
- `logs`: Private bucket for application logs

### Integration

Update your application configuration to use MinIO:

```env
# MinIO client configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false
```

## Features

- 🔐 Authentication with Better Auth (email/password)
- 🗄️ PostgreSQL Database with Drizzle ORM
- 🗃️ MinIO S3-compatible object storage
- 🎨 40+ shadcn/ui components (New York style)
- 🌙 Dark mode with system preference detection
- 🚀 App Router with Server Components and Turbopack
- 📱 Responsive design with TailwindCSS v4
- 🎯 Type-safe database operations
- 🔒 Modern authentication patterns
- 🐳 Full Docker support with multi-stage builds
- 🚀 Production-ready deployment configuration

## Project Structure

```
codeguide-starter-fullstack/
├── app/                        # Next.js app router pages
│   ├── globals.css            # Global styles with dark mode
│   ├── layout.tsx             # Root layout with providers
│   └── page.tsx               # Main page
├── components/                # React components
│   └── ui/                    # shadcn/ui components (40+)
├── db/                        # Database configuration
│   ├── index.ts              # Database connection
│   └── schema/               # Database schemas
├── docker/                    # Docker configuration
│   └── postgres/             # PostgreSQL initialization
├── hooks/                     # Custom React hooks
├── lib/                       # Utility functions
│   ├── auth.ts               # Better Auth configuration
│   └── utils.ts              # General utilities
├── auth-schema.ts            # Authentication schema
├── docker-compose.yml        # Docker services configuration
├── Dockerfile                # Application container definition
├── drizzle.config.ts         # Drizzle configuration
└── components.json           # shadcn/ui configuration
```

## Database Integration

This starter includes modern database integration:

- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the database provider
- **Better Auth** integration with Drizzle adapter
- **Database migrations** with Drizzle Kit

## Development Commands

### Application
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:up` - Start PostgreSQL in Docker
- `npm run db:down` - Stop PostgreSQL container
- `npm run db:dev` - Start development PostgreSQL (port 5433)
- `npm run db:dev-down` - Stop development PostgreSQL
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Drizzle migration files
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:reset` - Reset database (drop all tables and recreate)

### Styling with shadcn/ui
- Pre-configured with 40+ shadcn/ui components in New York style
- Components are fully customizable and use CSS variables for theming
- Automatic dark mode support with next-themes integration
- Add new components: `npx shadcn@latest add [component-name]`

### Docker
- `npm run docker:build` - Build application Docker image
- `npm run docker:up` - Start full application stack (app + database)
- `npm run docker:down` - Stop all containers
- `npm run docker:logs` - View container logs
- `npm run docker:clean` - Stop containers and clean up volumes

## Docker Development

### Quick Start with Docker
```bash
# Start the entire stack (recommended for new users)
npm run docker:up

# View logs
npm run docker:logs

# Stop everything
npm run docker:down
```

### Development Workflow
```bash
# Option 1: Database only (develop app locally)
npm run db:up          # Start PostgreSQL
npm run dev            # Start Next.js development server

# Option 2: Full Docker stack
npm run docker:up      # Start both app and database
```

### Docker Services

The `docker-compose.yml` includes:

- **postgres**: Main PostgreSQL database (port 5432)
- **postgres-dev**: Development database (port 5433) - use `--profile dev`
- **minio**: MinIO object storage server (ports 9000, 9001)
- **app**: Next.js application container (port 3000)
- **mc**: MinIO client for convenience (profile: tools)
- **create-buckets**: Automatic bucket creation (profile: setup)

### Docker Profiles

```bash
# Start development database on port 5433
docker-compose --profile dev up postgres-dev -d

# Start MinIO server only
docker-compose up minio -d

# Start MinIO with client tools
docker-compose --profile tools up mc minio -d

# Create default buckets automatically
docker-compose --profile setup up create-buckets minio -d

# Or use the npm scripts
npm run db:dev
```

## Deployment

### Production Deployment

#### Option 1: Docker Compose (VPS/Server)

1. **Clone and setup on your server:**
   ```bash
   git clone <your-repo>
   cd codeguide-starter-fullstack
   cp .env.example .env
   ```

2. **Configure environment variables:**
   ```bash
   # Edit .env with production values
   DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/postgres
   POSTGRES_DB=postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   BETTER_AUTH_SECRET=your-very-secure-secret-key
   BETTER_AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com
   ```

3. **Deploy:**
   ```bash
   npm run docker:up
   ```

#### Option 2: Container Registry (AWS/GCP/Azure)

1. **Build and push image:**
   ```bash
   # Build the image
   docker build -t your-registry/codeguide-starter-fullstack:latest .
   
   # Push to registry
   docker push your-registry/codeguide-starter-fullstack:latest
   ```

2. **Deploy using your cloud provider's container service**

#### Option 3: Vercel + External Database

1. **Deploy to Vercel:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Add environment variables in Vercel dashboard:**
   - `DATABASE_URL`: Your managed PostgreSQL connection string
   - `BETTER_AUTH_SECRET`: Generate a secure secret
   - `BETTER_AUTH_URL`: Your Vercel deployment URL

3. **Setup database:**
   ```bash
   # Push schema to your managed database
   npm run db:push
   ```

### Environment Variables for Production

```env
# Required for production
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=generate-a-very-secure-32-character-key
BETTER_AUTH_URL=https://yourdomain.com

# Optional optimizations
NODE_ENV=production
```

### Production Considerations

- **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- **Security**: Generate strong secrets, use HTTPS
- **Performance**: Enable Next.js output: 'standalone' for smaller containers
- **Monitoring**: Add logging and health checks
- **Backup**: Regular database backups
- **SSL**: Terminate SSL at load balancer or reverse proxy

### Health Checks

The application includes basic health checks. You can extend them:

```dockerfile
# In Dockerfile, add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

## AI Coding Agent Integration

This starter is optimized for AI coding agents:

- **Clear file structure** and naming conventions
- **TypeScript integration** with proper type definitions
- **Modern authentication** patterns
- **Database schema** examples

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
# codeguide-starter-fullstack
