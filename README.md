# RHBC CRM - Church Management System

A modern, full-stack church management system built with React, TypeScript, and AWS serverless architecture. Designed to streamline family management, childcare check-in/check-out, and event registration for small to mid-sized churches.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange)
![DynamoDB](https://img.shields.io/badge/DynamoDB-NoSQL-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Family Management
- ✅ View all families with member/guest status
- ✅ Add new families with primary contact
- ✅ View detailed family information (all members)
- ✅ Track parents with contact information
- ✅ Track children with allergies and special notes
- 🚧 Edit and delete families (coming soon)

### Childcare Check-In/Check-Out *(Planned)*
- 📋 Check in children to specific rooms
- 🔐 PIN-based secure checkout
- 👨‍👩‍👧 Manual override with authorization
- 📊 Active check-ins dashboard
- 📝 Check-in history and audit trail

### Event Registration *(Planned)*
- 🎉 Create and manage church events
- 📧 Email-based registration
- 👥 Automatic family matching
- 📊 Attendee lists and capacity management
- ✉️ Email confirmations

---

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 6** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

### Backend
- **AWS Lambda** - Serverless compute (Node.js 20)
- **DynamoDB** - NoSQL database with GSI optimization
- **API Gateway** - RESTful API management
- **TypeScript** - End-to-end type safety

### Development Tools
- **Yarn 4 with Plug'n'Play** - Fast, reliable package management
- **Monorepo with Workspaces** - Shared types across packages
- **ESLint + Prettier** - Code quality and formatting
- **Git with PR workflow** - Professional version control

---

## 🏗 Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                   React 18 + TypeScript                      │
│              Tailwind CSS v4 + shadcn/ui                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (REST)                       │
│               /families, /checkin, /events                   │
└───────┬─────────────────────┬───────────────────────────────┘
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Lambda     │      │   Lambda     │      │   Lambda     │
│ getFamilies  │      │createFamily  │      │  getFamily   │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                      │
       └─────────────────────┼──────────────────────┘
                             ▼
                    ┌─────────────────┐
                    │   DynamoDB      │
                    │  Families Table │
                    │  People Table   │
                    │  CheckIns Table │
                    │   (with GSIs)   │
                    └─────────────────┘
```

### Key Design Decisions

#### Serverless Architecture
- **Auto-scaling:** Handles 1 to 1000+ concurrent requests
- **Cost-effective:** Pay only for actual usage (~$5-10/month)
- **Zero ops:** No server maintenance or patching
- **High availability:** 99.9% SLA from AWS

#### Query-Based DynamoDB Design
- **No Scan operations:** All queries use GSI for O(log n) performance
- **Strategic denormalization:** Family IDs duplicated for fast lookups
- **Single table design:** Optimized for access patterns
- **Cost optimization:** On-demand pricing for variable traffic

#### Monorepo Architecture
- **Shared types:** TypeScript interfaces used across frontend/backend
- **Type safety:** Compile-time errors prevent runtime bugs
- **Code reuse:** Utilities and types shared between packages
- **Atomic commits:** Related changes committed together

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **Yarn** 4.x (Corepack enabled)
- **Git** for version control
- **AWS Account** (for deployment)

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/yourusername/rhbc-crm.git
   cd rhbc-crm
```

2. **Enable Corepack (for Yarn 4)**
```bash
   corepack enable
```

3. **Install dependencies**
```bash
   yarn install
```

4. **Build shared types**
```bash
   yarn workspace @rhbc-crm/shared build
```

5. **Start frontend development server**
```bash
   yarn workspace @rhbc-crm/frontend dev
```

6. **Open browser**
```
   http://localhost:3000
```

### Type Checking
```bash
# Check all packages
yarn workspaces foreach -A run type-check

# Check individual packages
yarn workspace @rhbc-crm/shared type-check
yarn workspace @rhbc-crm/frontend type-check
yarn workspace @rhbc-crm/backend type-check
```

---

## 📁 Project Structure
```
rhbc-crm/
├── packages/
│   ├── shared/                    # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── Family.ts      # Family data model
│   │   │   │   ├── Person.ts      # Person (parent/child) model
│   │   │   │   ├── CheckIn.ts     # Check-in/out tracking
│   │   │   │   ├── Event.ts       # Church events
│   │   │   │   └── EventRegistration.ts
│   │   │   └── index.ts           # Type exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                  # React application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/            # shadcn/ui components
│   │   │   │   ├── FamilyDetails.tsx
│   │   │   │   ├── AddFamilyDialog.tsx
│   │   │   ├── data
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   │
│   └── backend/                   # AWS Lambda functions
│       ├── src/
│       │   ├── handlers/
│       │   │   ├── getFamilies.ts     # GET /families
│       │   │   ├── createFamily.ts    # POST /families
│       │   │   ├── getFamily.ts       # GET /families/{id}
│       │   │   └── index.ts
│       │   ├── services/
│       │   │   └── familyService.ts   # DynamoDB operations
│       │   └── utils/
│       │       ├── dynamodb.ts        # DynamoDB client
│       │       └── response.ts        # API responses
│       ├── package.json
│       └── tsconfig.json
│
├── .yarnrc.yml                    # Yarn 4 configuration
├── package.json                   # Workspace root
├── tsconfig.json                  # Root TypeScript config
├── PRD.md                         # Product requirements
├── PROGRESS.md                    # Development progress
└── README.md                      # This file
```

---

## 💻 Development

### Available Scripts

#### Root Commands
```bash
# Install all dependencies
yarn install

# Type check all packages
yarn workspaces foreach -A run type-check

# Run specific package script
yarn workspace <package-name> <script>
```

#### Frontend (`@rhbc-crm/frontend`)
```bash
# Start dev server (localhost:3000)
yarn workspace @rhbc-crm/frontend dev

# Build for production
yarn workspace @rhbc-crm/frontend build

# Preview production build
yarn workspace @rhbc-crm/frontend preview

# Type check
yarn workspace @rhbc-crm/frontend type-check

# Lint
yarn workspace @rhbc-crm/frontend lint
```

#### Backend (`@rhbc-crm/backend`)
```bash
# Type check
yarn workspace @rhbc-crm/backend type-check

# Build
yarn workspace @rhbc-crm/backend build
```

#### Shared (`@rhbc-crm/shared`)
```bash
# Build types
yarn workspace @rhbc-crm/shared build

# Type check
yarn workspace @rhbc-crm/shared type-check
```

### Git Workflow

This project follows a **feature branch + PR workflow**:

1. **Create feature branch**
```bash
   git checkout -b feat/feature-name
```

2. **Make changes and commit**
```bash
   git add .
   git commit -m "feat: descriptive message"
```

3. **Push and create PR**
```bash
   git push origin feat/feature-name
   # Create PR on GitHub
```

4. **Merge and cleanup**
```bash
   git checkout main
   git pull origin main
   git branch -d feat/feature-name
```

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for formatting (auto-format on save)
- **Meaningful variable names** (no single letters except loops)
- **JSDoc comments** on all exported functions/types
- **No `any` types** (use proper typing)

---

## 🚀 Deployment

### DynamoDB Tables Setup

#### Families Table
```
Table Name: rhbc-families
Primary Key: familyId (String)
GSI: pk-createdAt-index
  - Partition Key: pk (String)
  - Sort Key: createdAt (String)
```

#### People Table
```
Table Name: rhbc-people
Primary Key: personId (String)
GSI: familyId-index
  - Partition Key: familyId (String)
  - Sort Key: createdAt (String)
```

#### CheckIns Table
```
Table Name: rhbc-checkins
Primary Key: checkInId (String)
GSI: familyId-checkInTime-index
  - Partition Key: familyId (String)
  - Sort Key: checkInTime (String)
```

### Lambda Deployment

*(Detailed deployment instructions coming soon)*

1. Build backend package
2. Create Lambda functions in AWS Console
3. Upload compiled code
4. Configure environment variables
5. Set up API Gateway endpoints
6. Deploy frontend to S3 + CloudFront

---

## 📚 API Documentation

### Endpoints

#### `GET /families`
List all families in the system.

**Response:**
```json
{
  "families": [
    {
      "familyId": "fam-1738425600000-x7k9m2p",
      "pk": "FAMILY",
      "lastName": "Smith",
      "status": "member",
      "createdAt": "2026-01-31T12:00:00.000Z",
      "updatedAt": "2026-01-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### `POST /families`
Create a new family with primary contact.

**Request:**
```json
{
  "lastName": "Smith",
  "status": "member",
  "parentFirstName": "John",
  "parentPhone": "7145551234",
  "parentEmail": "john.smith@email.com"
}
```

**Response:**
```json
{
  "family": { ... },
  "parent": { ... }
}
```

#### `GET /families/{id}`
Get a single family with all members.

**Response:**
```json
{
  "family": { ... },
  "people": [ ... ]
}
```

---

## 🗄 Database Schema

### Family
```typescript
{
  familyId: string;        // Primary key
  pk: string;              // Constant "FAMILY" for GSI
  lastName: string;
  status: 'member' | 'guest';
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### Person
```typescript
{
  personId: string;        // Primary key
  familyId: string;        // Foreign key
  firstName: string;
  phone?: string;          // Optional (children don't have phones)
  email?: string;
  role: 'parent' | 'child';
  allergies?: string;      // Child safety info
  notes?: string;          // Special instructions
  createdAt: string;
  updatedAt: string;
}
```

### CheckIn
```typescript
{
  checkInId: string;       // Primary key
  childId: string;         // Person ID (role='child')
  familyId: string;        // Denormalized for fast queries
  checkInTime: string;     // When dropped off
  checkOutTime: string | null;
  checkOutPin: string;     // 4-digit security PIN
  checkOutMethod: 'pin' | 'manual_override' | null;
  manualOverrideNotes: string | null;
  room: string;            // Classroom assignment
  createdAt: string;
  updatedAt: string;
}
```

---

## 🤝 Contributing

This is currently a solo project, but contributions are welcome!

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all type checks pass
5. Create a pull request

### Code Standards
- Follow existing TypeScript patterns
- Add JSDoc comments for all public APIs
- Write meaningful commit messages
- Update documentation as needed

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🎯 Roadmap

### Phase 1: Foundation ✅
- [x] Monorepo setup with Yarn 4
- [x] TypeScript configuration
- [x] Shared type definitions
- [x] React frontend with Tailwind + shadcn/ui
- [x] Mock data system

### Phase 2: Family Management ✅
- [x] Family list with stats dashboard
- [x] Family details view
- [x] Add family form with validation
- [x] Backend Lambda handlers
- [x] DynamoDB service layer

### Phase 3: Backend Deployment 🚧
- [ ] AWS account setup
- [ ] DynamoDB table creation
- [ ] Lambda function deployment
- [ ] API Gateway configuration
- [ ] Frontend integration with real API

### Phase 4: Check-In Feature 📋
- [ ] Check-in UI
- [ ] PIN generation
- [ ] Check-out with PIN verification
- [ ] Active check-ins dashboard
- [ ] Manual override with authorization

### Phase 5: Events 🎉
- [ ] Event creation form
- [ ] Event registration
- [ ] Attendee management
- [ ] Email matching logic
- [ ] Capacity tracking

### Phase 6: Polish & Deploy 🚀
- [ ] Edit/delete families
- [ ] Search and filters
- [ ] Reports and analytics
- [ ] Email notifications
- [ ] User authentication (AWS Cognito)
- [ ] Production deployment

---

## 📞 Contact

**Project Maintainer:** David Kim  
**Email:** [your-email]  
**GitHub:** [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful component library
- **Tailwind CSS** - Utility-first styling
- **AWS** - Reliable cloud infrastructure
- **Yarn Team** - Modern package management
- **TypeScript Team** - Type safety excellence

---

## 📊 Project Stats

- **Languages:** TypeScript (100%)
- **Packages:** 3 (shared, frontend, backend)
- **Components:** 8+
- **Lambda Functions:** 3
- **Database Tables:** 5 (designed)
- **Lines of Code:** ~2,000+
- **Test Coverage:** Coming soon!

---

**Built with ❤️ for Rolling Hills Baptist Church**