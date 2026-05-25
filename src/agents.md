# GesAvo Engineering Guidelines

## Project Overview

GesAvo is a professional legal management SaaS platform for law firms and legal teams.

The platform manages:

* authentication and RBAC
* clients management
* legal cases (dossiers)
* hearings and calendar
* tasks and follow-up
* financial management
* legal documents
* reporting and analytics
* AI-assisted legal workflows

The project is designed as a scalable monorepo architecture.

Current frontend already contains:

* existing React pages
* existing Tailwind UI
* existing routing
* existing business logic

IMPORTANT:
The current UI/UX/design must remain visually identical unless explicitly requested.

This repository is under active restructuring toward a professional scalable architecture.

---

# Core Engineering Principles

## 1. Preserve Existing UI

The current UI design is considered production reference.

DO NOT:

* redesign pages
* replace layouts
* change Tailwind structure unnecessarily
* modify colors/spacing/typography
* introduce random design systems
* change responsive behavior
* create visual regressions

Allowed:

* refactoring
* modularization
* extracting reusable components
* improving maintainability

This project prioritizes architecture improvements WITHOUT changing visual identity.

---

# Architecture Rules

## 2. Use Feature-Based Architecture



Frontend architecture must follow feature/domain separation.

Each feature must be autonomous.

Example:

features/
clients/
dossiers/
finances/
documents/

Each feature should contain:

* pages/
* components/
* services/
* store/
* hooks/
* utils/

Avoid global business logic whenever possible.

---

## 3. Shared Components Rules

Global reusable UI components belong only in:

components/ui/

Examples:

* Button
* Input
* Select
* Modal
* Card
* Badge
* Table

Business-specific components MUST stay inside their feature.

GOOD:
features/clients/components/ClientCard.jsx

BAD:
components/ClientCard.jsx

---

## 4. Layout Separation

Application layouts must stay isolated.

Use:

* layouts/DashboardLayout.jsx
* layouts/AuthLayout.jsx

Do not duplicate sidebar/topbar structures across pages.

---

## 5. Routing Rules

Routing must remain centralized.

Use:
app/routes.jsx

Protected routes must use route guards.

Examples:

* ProtectedRoute
* RoleGuard

Avoid route definitions inside feature pages.

---

# State Management Rules

## 6. Zustand First

Use Zustand for scalable global state management.

Avoid unnecessary Context API usage.

Context API is allowed only for:

* theme
* language
* lightweight app providers

Authentication state should preferably use Zustand.

---

## 7. Store Organization

Each feature may contain its own store.

Example:
features/clients/store/clientsStore.js

Avoid giant global stores.

Keep stores domain-oriented.

---

# API & Services Rules

## 8. API Layer Separation

Never place API calls directly inside pages/components.

Use:
services/api.js

for:

* axios instance
* interceptors
* token refresh
* shared API config

Business logic APIs belong inside features.

Example:
features/clients/services/clientsService.js

---

## 9. Backend Preparation

Frontend must remain compatible with future:

* NestJS backend
* PostgreSQL
* JWT authentication
* RBAC
* AI microservices

Avoid frontend patterns tightly coupled to mock data.

---

# Code Quality Rules

## 10. Avoid Duplication

Before creating:

* components
* hooks
* services
* stores
* utils

ALWAYS verify whether an equivalent already exists.

Prefer reuse over duplication.

---

## 11. Component Size

Avoid giant components.

If a component exceeds reasonable complexity:

* split sections
* extract hooks
* extract subcomponents

Pages should orchestrate, not contain all logic.

---

## 12. Business Logic Placement

Do not place heavy business logic inside:

* pages
* JSX rendering blocks

Move logic into:

* hooks
* services
* stores
* utils

---

## 13. Clean Imports

Prefer aliases instead of deep relative imports.

Use:
@/

Example:
import Button from '@/components/ui/Button'

Avoid:
../../../components/ui/Button

---

## 14. Naming Conventions

### Components

PascalCase

Examples:

* ClientCard.jsx
* DashboardLayout.jsx

### Hooks

camelCase starting with use

Examples:

* useAuth.js
* useClientFilters.js

### Services

camelCase ending with Service

Examples:

* authService.js
* dossiersService.js

### Stores

camelCase ending with Store

Examples:

* authStore.js
* clientsStore.js

### Folders

kebab-case

Examples:

* ai-assistant/
* shared-utils/

---

# Styling Rules

## 15. Tailwind Rules

Tailwind CSS is the official styling system.

Do not:

* mix multiple styling systems
* introduce inline chaos
* duplicate utility patterns excessively

Extract repeated patterns into reusable UI components.

---

## 16. Responsive Design

Existing responsive behavior must remain preserved.

Always test:

* mobile
* tablet
* desktop

before validating layout changes.

---

# File Organization Rules

## 17. Keep Features Isolated

Feature modules should not tightly depend on each other.

Shared logic belongs in:

* shared utils
* shared types
* common hooks

Avoid circular dependencies.

---

## 18. Shared Packages

Cross-application reusable code belongs in:

packages/
shared-types/
shared-utils/

Do not duplicate shared utilities between frontend/backend.

---

# AI Integration Rules

## 19. AI Services Preparation

The architecture must remain compatible with future:

* RAG systems
* vector databases
* AI assistants
* document embeddings
* OpenAI integrations

Avoid tightly coupling AI logic to frontend pages.

AI features must remain modular.

---

# Security Rules

## 20. RBAC Enforcement

Role-based access control is mandatory.

Roles include:

* Admin
* Lawyer
* Assistant
* Client

Never rely only on frontend protection.

Frontend guards are UX helpers only.

---

## 21. Sensitive Data

Never expose:

* tokens
* secrets
* API keys
* internal configs

Environment variables must use:
.env

Never hardcode secrets.

---

# Performance Rules

## 22. Lazy Loading

Large pages/features should support lazy loading when possible.

Examples:

* dashboard
* reports
* analytics
* documents

---

## 23. Avoid Unnecessary Re-renders

Optimize:

* state usage
* props passing
* expensive calculations

Prefer memoization only when necessary.

Avoid premature optimization.

---

# Development Workflow

## 24. Refactoring Strategy

When restructuring:

1. analyze existing code first
2. preserve behavior
3. move incrementally
4. verify imports
5. verify routing
6. verify UI
7. remove dead files last

Never rewrite large areas unnecessarily.

---

## 25. Git Workflow

Recommended commits:

* small
* isolated
* descriptive

Examples:

* refactor(auth): extract auth services
* feat(clients): modularize clients pages
* fix(routing): preserve protected routes

Avoid massive unstructured commits.

---

# Documentation Rules

## 26. Keep Docs Updated

Important architecture decisions must be documented.

Update:

* docs/api
* docs/uml
* docs/architecture

when major changes occur.

---

# Forbidden Practices

## 27. Do NOT

* redesign the UI unnecessarily
* create duplicate abstractions
* place axios calls directly inside JSX
* create giant global stores
* mix unrelated business logic
* hardcode sensitive values
* introduce random dependencies
* create dead code
* keep unused legacy files
* bypass architecture conventions

---

# Legacy Cleanup Rules

## 28. Safe Removal Only

Before deleting files:

* verify imports
* verify references
* verify routing
* verify feature usage

Typical removable legacy files:

* App.test.js
* setupTests.js
* reportWebVitals.js

ONLY if unused.

---

# Final Goal

The target architecture must become:

* scalable
* modular
* maintainable
* team-friendly
* production-grade
* backend-ready
* AI-ready
* easy to extend

while preserving the current user experience and visual identity of GesAvo.
