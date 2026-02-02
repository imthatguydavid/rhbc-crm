# RHBC CRM - Product Requirements Document (PRD)

## Project Overview
**Name:** RHBC CRM (Redeemer Heights Bible Community - Church Relationship Management)  
**Purpose:** Streamlined church management system for small churches  
**Target Users:** Church staff, volunteers, administrators  
**Tech Stack:** React + TypeScript + AWS Lambda + DynamoDB

---

## Core Features (v1.0)

### 1. Family Management
**Purpose:** Manage church families and members

**Features:**
- View all families in sortable table
- Add new families with primary contact
- View detailed family information
- Edit family information (future)
- Track member vs guest status

**Data Model:**
- Family: familyId, lastName, status (member/guest), timestamps
- Person: personId, familyId, firstName, phone, email, role (parent/child), allergies, notes

---

### 2. Childcare Check-In/Check-Out
**Purpose:** Safe, trackable child drop-off and pickup system

**Features:**
- Check in children to specific rooms
- Generate unique PIN for checkout
- PIN-based checkout verification
- Manual override with notes (for emergencies)
- Track check-in/out times and methods

**Security Requirements:**
- 4-digit PIN required for checkout
- Only authorized adults can check out
- Manual override requires admin approval
- Audit trail of all check-ins/outs

**Data Model:**
- CheckIn: checkInId, childId, familyId, checkInTime, checkOutTime, checkOutPin, checkOutMethod, room, manualOverrideNotes

---

### 3. Event Registration
**Purpose:** Manage church events and track attendees

**Features:**
- Create events with details
- Track registrations by email
- Match registrations to existing families
- View event attendance lists
- Send confirmation emails (future)

**Data Model:**
- Event: eventId, name, description, date, location, capacity
- EventRegistration: registrationId, eventId, email, firstName, lastName, familyId (optional), registeredAt

---

## Technical Architecture

### Frontend
- **Framework:** React 18
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **Build Tool:** Vite 6
- **State:** React useState/useContext

### Backend
- **Runtime:** Node.js 20 on AWS Lambda
- **Language:** TypeScript
- **Database:** DynamoDB (serverless NoSQL)
- **API:** API Gateway REST API
- **Authentication:** IAM-based (v1), Cognito (future)

### Infrastructure
- **Hosting:** AWS (Lambda + DynamoDB + S3 + CloudFront)
- **Deployment:** Manual (v1), GitHub Actions CI/CD (future)
- **Region:** us-west-2 (Oregon)

### Monorepo Structure
```
rhbc-crm/
├── packages/
│   ├── shared/        # Shared TypeScript types
│   ├── frontend/      # React application
│   └── backend/       # Lambda functions
├── package.json       # Workspace root
└── .yarnrc.yml        # Yarn 4 config
```

---

## Database Design (DynamoDB)

### Families Table
- **Primary Key:** familyId (Partition Key)
- **Attributes:** lastName, status, createdAt, updatedAt
- **GSI:** None (scan for list view)

### People Table
- **Primary Key:** personId (Partition Key)
- **GSI:** familyId-index (for querying by family)
- **Attributes:** familyId, firstName, phone, email, role, allergies, notes

### CheckIns Table
- **Primary Key:** checkInId (Partition Key)
- **GSI:** familyId-checkInTime-index (for active check-ins)
- **Attributes:** childId, familyId, checkInTime, checkOutTime, checkOutPin, room, etc.

### Events Table
- **Primary Key:** eventId (Partition Key)
- **Attributes:** name, description, date, location, capacity

### EventRegistrations Table
- **Primary Key:** registrationId (Partition Key)
- **GSI:** eventId-index (for event attendees)
- **Attributes:** eventId, email, firstName, lastName, familyId

---

## API Endpoints (v1.0)

### Family Management
- `GET /families` - List all families
- `POST /families` - Create new family
- `GET /families/{id}` - Get family details
- `PUT /families/{id}` - Update family (future)
- `DELETE /families/{id}` - Delete family (future)

### People Management
- `GET /families/{familyId}/people` - Get family members
- `POST /people` - Add person to family
- `PUT /people/{id}` - Update person (future)
- `DELETE /people/{id}` - Delete person (future)

### Check-In/Out
- `POST /checkin` - Check in child
- `POST /checkout` - Check out child with PIN
- `GET /checkin/active` - Get active check-ins
- `GET /checkin/history` - Get check-in history

### Events
- `GET /events` - List upcoming events
- `POST /events` - Create event
- `POST /events/{id}/register` - Register for event
- `GET /events/{id}/registrations` - Get event attendees

---

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- API response < 500ms
- Database queries < 100ms

### Security
- HTTPS only
- API authentication (IAM-based initially)
- Input validation on all endpoints
- PIN encryption for check-out

### Scalability
- Support 500+ families
- Handle 100+ concurrent check-ins
- DynamoDB on-demand pricing

### Reliability
- 99.9% uptime (AWS SLA)
- Automatic backups (DynamoDB PITR)
- Error logging (CloudWatch)

---

## Future Enhancements (v2.0+)

### Phase 2
- Edit/delete families and people
- Multi-child check-in (select multiple kids)
- SMS notifications for check-out
- Event email confirmations
- Volunteer scheduling

### Phase 3
- User authentication (Cognito)
- Role-based access control (admin/volunteer)
- Attendance reports
- Family photo uploads
- Online giving integration

### Phase 4
- Mobile app (React Native)
- Offline mode
- Push notifications
- Calendar integration

---

## Success Metrics

### V1.0 Goals
- Replace paper check-in system
- Reduce check-in time by 50%
- Zero lost children incidents
- Positive volunteer feedback
- 100% family data digitized

### KPIs
- Average check-in time: < 30 seconds
- System uptime: > 99%
- User satisfaction: > 4/5 stars
- Monthly active users: Church staff + volunteers

---

## Development Roadmap

### Phase 1: Foundation (COMPLETED ✅)
- ✅ Monorepo setup
- ✅ Shared TypeScript types
- ✅ React + Vite + Tailwind frontend
- ✅ Mock data system
- ✅ Family list + details UI
- ✅ Add family form

### Phase 2: Backend (IN PROGRESS 🔨)
- 🔨 Lambda functions
- DynamoDB tables
- API Gateway setup
- Frontend integration

### Phase 3: Check-In Feature
- Check-in UI
- PIN generation
- Check-out with PIN
- Active check-ins list

### Phase 4: Events
- Event creation UI
- Registration form
- Attendee list
- Email matching

### Phase 5: Deployment
- AWS infrastructure
- CI/CD pipeline
- Production deployment
- User testing

---

## Constraints & Assumptions

### Constraints
- Budget: $0-10/month (AWS free tier)
- Timeline: MVP in 8-12 weeks
- Team: Solo developer
- Deployment: Self-managed AWS

### Assumptions
- Church has 100-200 families
- 20-50 children per service
- 5-10 staff/volunteers using system
- Internet connectivity available
- Desktop/tablet usage (mobile-friendly, not mobile-first)

---

## Glossary

**Family:** A household unit (parents + children)  
**Member:** Regular church attendee (registered family)  
**Guest:** First-time or occasional visitor  
**Check-In:** Child arrival and room assignment  
**Check-Out:** Child pickup with PIN verification  
**Event Registration:** Sign-up for church events  
**Manual Override:** Emergency check-out without PIN (requires notes)

---

**Document Version:** 2.0  
**Last Updated:** February 1, 2026  
**Status:** Active Development