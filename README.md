# Inisio Admin Portal

> Internal operations and administrative underwriting console for Inisio Capital Advisory Services. Role-gated SPA for Admin, CA Auditor, DPR Consultant, and Prosync Syndication teams.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Setup](#4-environment-setup)
5. [Running Locally](#5-running-locally)
6. [Role-Based Access Map](#6-role-based-access-map)
7. [Authentication Flow](#7-authentication-flow)
8. [Admin API Calls — Complete Reference](#8-admin-api-calls--complete-reference)
   - [Auth](#81-auth)
   - [Users](#82-users)
   - [Leads](#83-leads)
   - [Projects](#84-projects)
   - [Consultations](#85-consultations)
   - [Payments](#86-payments)
   - [Documents](#87-documents)
   - [Notifications](#88-notifications)
   - [Industries](#89-industries)
   - [Contact Enquiries](#810-contact-enquiries)
9. [Component Reference](#9-component-reference)
10. [Deployment](#10-deployment)

---

## 1. Project Overview

The **Inisio Admin Portal** is an internal-only Vite + React + TypeScript SPA. It is **not linked from the public website** and is hosted on a separate domain (`admin.inisio.in`). It provides:

- **Admin Console** (`admin` / `superadmin`) — Full lead pipeline management, user management, industry catalog, CSV exports
- **CA Auditor Desk** (`ca`) — Bankability and feasibility audit workflow for submitted projects; CMA audit status updates
- **DPR Consultant Desk** (`dpr`) — Detailed Project Report preparation tracking and document management
- **Prosync Syndication** (`prosync`) — Debt syndication consultation workflow management

All data is served from the shared backend (`inisio26.1/inisio-website/Backend`). The admin portal makes no direct database calls — it communicates exclusively via the REST API using JWT Bearer tokens.

---

## 2. Tech Stack

| Package | Version |
|:--------|:--------|
| react | ^19.3.1 |
| react-dom | ^19.3.1 |
| react-router-dom | ^7.18.5 |
| axios | ^1.21.0 |
| tailwindcss | ^4.3.4 |
| @tailwindcss/vite | ^4.3.4 |
| lucide-react | ^1.67.0 |
| vite | ^8.3.5 |
| typescript | via @types/react ^19.3.0 |

---

## 3. Folder Structure

```
Inisio-Admin/
├── src/
│   ├── main.jsx                          # React root render
│   ├── App.tsx                           # Top-level router + ErrorBoundary + nav bar
│   ├── App.css                           # Global styles
│   ├── index.css
│   ├── types.ts                          # Shared TypeScript types (UserRole, LeadRecord, etc.)
│   ├── assets/
│   │   └── hero.png
│   ├── context/
│   │   └── AuthContext.tsx               # JWT auth state, login(), logout(), getAuthHeaders()
│   └── components/
│       ├── InternalPortalLogin.tsx       # Email + password login form → POST /api/auth/admin-login
│       ├── AdminDashboardView.tsx        # Admin / Superadmin dashboard (leads + users)
│       ├── AdminLeadsModal.tsx           # Lead detail / full enquiry modal
│       ├── LeadEditModal.tsx             # Lead edit form modal
│       ├── CADashboard.tsx               # CA Auditor desk (project audit workflow)
│       ├── DPRConsultantDashboard.tsx    # DPR Consultant project tracking
│       ├── ProsyncDashboard.tsx          # Prosync debt syndication workflow
│       ├── UserProfileDetailModal.tsx    # User detail modal used in Admin dashboard
│       └── ForbiddenPage.tsx             # Shown when role does not match the active tab
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 4. Environment Setup

> [!IMPORTANT]
> Copy `.env.example` to `.env`. Only `VITE_*` variables are exposed to the browser bundle. Never put secrets here.

| Variable | Required | Purpose | Example |
|:---------|:--------:|:--------|:--------|
| `VITE_API_BASE_URL` | Yes | Backend REST API base URL (without trailing `/`) | `https://api.inisio.in` |

> [!NOTE]
> Axios is called with relative paths like `/api/leads` by default. For production, configure a reverse-proxy rewrite rule or Vercel rewrite (see [Deployment](#10-deployment)) to forward `/api/*` to the backend.

---

## 5. Running Locally

```bash
cd Inisio-Admin
cp .env.example .env        # Set VITE_API_BASE_URL=http://localhost:5000
npm install
npm run dev                 # Vite dev server → http://localhost:5174
```

**Production build:**

```bash
npm run build               # outputs to dist/
npm run preview             # local preview of production build
```

---

## 6. Role-Based Access Map

The admin portal uses **tab-based navigation** (not URL routing). `canAccessTab()` in `App.tsx` enforces role-to-tab access; every API call enforces the same constraints server-side.

| Role | Admin Console | CA Auditor Desk | DPR Consultant Desk | Prosync Tab | Notes |
|:-----|:-------------:|:---------------:|:-------------------:|:-----------:|:------|
| `admin` | Full CRUD | Full | Full | Full | Accesses all tabs |
| `superadmin` | Read-Only | Read-Only | Read-Only | Read-Only | Backend blocks all mutations via `restrictSuperAdminViewer` |
| `ca` | Forbidden | Full | View only | Forbidden | CA audit workflow |
| `dpr` | Forbidden | View only | Full | Forbidden | DPR consultant |
| `prosync` | Forbidden | Forbidden | Forbidden | Full | Syndication only |
| `prosync_admin` | Forbidden | Forbidden | Forbidden | Full | Alias for prosync |

**Tab-to-role guard (`canAccessTab` in `App.tsx`):**

```typescript
const canAccessTab = (tab: NavigationTab): boolean => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  if (tab === 'ca' && user.role === 'ca') return true;
  if (tab === 'dpr' && (user.role === 'dpr' || user.role === 'ca')) return true;
  if (tab === 'prosync' && user.role === 'prosync') return true;
  return false;
};
```

If a role attempts to access a tab they're not authorized for, `ForbiddenPage` renders showing required roles and offering a "Switch Account" button.

---

## 7. Authentication Flow

### Login

1. User enters **email + password** in `InternalPortalLogin.tsx`
2. `AuthContext.login(email, password)` calls:
   ```
   POST /api/auth/admin-login
   Body: { "email": "admin@inisio.in", "password": "••••••••" }
   ```
3. On success: response `{ token, user }` is stored:
   - `localStorage.setItem('inisio_admin_token', token)`
   - `localStorage.setItem('inisio_admin_user', JSON.stringify(user))`
4. `AuthContext` state updates → `App.tsx` re-renders → redirects to `admin` tab

### Session Persistence

- On page load, `AuthProvider` reads `inisio_admin_token` and `inisio_admin_user` from `localStorage` to restore state
- No automatic token refresh. Expired tokens result in `401` on the next API call; user must log in again

### Token Attachment

`AuthContext.getAuthHeaders()` returns:
```typescript
token ? { headers: { Authorization: `Bearer ${token}` } } : {}
```
Spread into every axios call: `axios.get('/api/leads', getAuthHeaders())`

### Logout

```typescript
const logout = () => {
  setUser(null);
  setToken(null);
  localStorage.removeItem('inisio_admin_token');
  localStorage.removeItem('inisio_admin_user');
};
```
Called from the top-nav **Logout** button. Renders `InternalPortalLogin` since `user` becomes null.

### Superadmin Write Block

`checkSuperAdminRestriction(actionDescription)` returns `true` (and shows a warning toast) if `user.role === 'superadmin'`. Every mutation action calls this before dispatching:

```typescript
if (checkSuperAdminRestriction('Deleting a lead')) return;
// proceed with DELETE /api/leads/:id
```

Backend enforces the same restriction independently via `restrictSuperAdminViewer` middleware.

### Error Boundary

`App.tsx` wraps the entire app in a class-based `ErrorBoundary`. On uncaught render errors it shows:
- **Reload Console** — `window.location.reload()`
- **Reset Session** — clears `inisio_admin_token` + `inisio_admin_user`, then reloads

---

## 8. Admin API Calls — Complete Reference

> All calls use `axios` with headers from `getAuthHeaders()` → `{ headers: { Authorization: 'Bearer <token>' } }`.
> Rows marked <!-- inferred --> indicate the call was inferred from component props and state; the endpoint itself is verified from the backend routes.

### 8.1 Auth

| Component / Context | Method | Endpoint | Auth Header | Request Body | What It Does |
|:--------------------|:-------|:---------|:-----------:|:-------------|:-------------|
| `AuthContext.login()` ← `InternalPortalLogin.tsx` | `POST` | `/api/auth/admin-login` | None | `{ email, password }` | Authenticates admin/staff. Returns `{ token, user }`. Rate-limited: 20 req/15 min per IP. |

---

### 8.2 Users

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `AdminDashboardView.tsx` | `GET` | `/api/users` | Bearer | — | Loads all registered users for the user-management table |
| `AdminDashboardView.tsx` → `UserProfileDetailModal` <!-- inferred --> | `GET` | `/api/users/profile/:email` | Bearer | `:email` path param | Fetches user detail by email address for profile modal |
| `AdminDashboardView.tsx` <!-- inferred --> | `GET` | `/api/users/:id` | Bearer | `:id` path param | Loads single user by MongoDB ObjectId |
| `AdminDashboardView.tsx` <!-- inferred --> | `PUT` | `/api/users/:id/role` | Bearer | `{ role }` | Updates user's role. Superadmin blocked. |
| `AdminDashboardView.tsx` <!-- inferred --> | `PUT` | `/api/users/:id/status` | Bearer | `{ status }` | Activates or suspends user account. Superadmin blocked. |
| `AdminDashboardView.tsx` <!-- inferred --> | `DELETE` | `/api/users/:id` | Bearer | — | Hard deletes user. Admin only. Superadmin blocked. |

---

### 8.3 Leads

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `AdminDashboardView.tsx` (fetchLeads) | `GET` | `/api/leads` | Bearer | — | Loads full lead pipeline. Admin/superadmin see all leads. |
| `LeadEditModal.tsx` (save) | `PUT` | `/api/leads/:id` | Bearer | Full lead fields object | Updates a complete lead record |
| `AdminDashboardView.tsx` or `LeadEditModal.tsx` | `PUT` | `/api/leads/:id/assignment` | Bearer | `{ dprAssignedTo?, consultationAssignedTo? }` | Assigns lead to DPR/Prosync staff |
| `AdminDashboardView.tsx` or `LeadEditModal.tsx` | `PUT` | `/api/leads/:id/progress` | Bearer | `{ assessmentCompleted?, documentsUploaded?, dprCompleted?, bankApplicationSubmitted? }` | Updates pipeline milestone booleans |
| `AdminDashboardView.tsx` (delete single) | `DELETE` | `/api/leads/:id` | Bearer | — | Deletes a single lead record. Admin only. |
| `AdminDashboardView.tsx` (clear all) | `DELETE` | `/api/leads/clear-all` | Bearer | — | **Wipes entire leads collection. Irreversible. Admin only.** |

---

### 8.4 Projects

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `CADashboard.tsx` (fetch list) | `GET` | `/api/projects` | Bearer | `page`, `limit`, `status` query params | Lists all submitted projects for CA review |
| `CADashboard.tsx` (fetch single) | `GET` | `/api/projects/:id` | Bearer | `:id` path param | Loads full project detail for the audit form |
| `CADashboard.tsx` (submit audit) | `PUT` | `/api/projects/:id/audit` | Bearer | `{ status, caReviewNotes, assignedCA, cmaAuditStatus, bankabilityStatus, dscr, debtEquityRatio }` | CA/Admin updates audit fields and project status |
| `AdminDashboardView.tsx` <!-- inferred --> | `DELETE` | `/api/projects/:id` | Bearer | — | Deletes project record. Admin only. |

**Project `status` enum used in audit:**
`Draft` · `Pending Audit` · `CA Approved` · `Bank Submitted` · `Sanctioned` · `Clarification Needed`

---

### 8.5 Consultations

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `ProsyncDashboard.tsx` (fetch list) | `GET` | `/api/consultations` | Bearer | `page`, `limit` query params | Lists all consultation bookings |
| `ProsyncDashboard.tsx` (fetch single) | `GET` | `/api/consultations/:id` | Bearer | `:id` path param | Single consultation detail |
| `ProsyncDashboard.tsx` (update status) | `PUT` | `/api/consultations/:id/status` | Bearer | `{ status, feedback?, assignedAdvisor? }` | Updates consultation status and assigns advisor |

**Consultation `status` values:** `pending` · `confirmed` · `completed` · `cancelled`

---

### 8.6 Payments

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `AdminDashboardView.tsx` <!-- inferred --> | `GET` | `/api/payments/history` | Bearer | — | Lists payment records (admin sees all via admin token) |
| `AdminDashboardView.tsx` <!-- inferred --> | `GET` | `/api/payments/:id` | Bearer | `:id` path param | Single payment transaction detail |

---

### 8.7 Documents

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `DPRConsultantDashboard.tsx` (list) | `GET` | `/api/documents/project/:leadId` | Bearer | `:leadId` path param | Lists all documents for a lead |
| `DPRConsultantDashboard.tsx` (upload) | `POST` | `/api/documents/upload` | Bearer | `multipart/form-data`: `file`, `leadId`, `category` | Uploads document linked to lead. Max 10 MB. PDF/DOCX/XLSX/PPTX/PNG/JPEG/WebP only. UUID filename. Superadmin blocked. |
| `DPRConsultantDashboard.tsx` (download) | `GET` | `/api/documents/:id/download` | Bearer | `:id` path param | Streams authenticated document download |

---

### 8.8 Notifications

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `AdminDashboardView.tsx` <!-- inferred --> | `GET` | `/api/notifications` | Bearer | — | Loads notification feed for the authenticated admin |
| `AdminDashboardView.tsx` <!-- inferred --> | `POST` | `/api/notifications` | Bearer | `{ title, message, type?, targetUserId? }` | Creates notification for a user. Admin/CA/staff only. |
| `AdminDashboardView.tsx` <!-- inferred --> | `PATCH` | `/api/notifications/:id/read` | Bearer | — | Marks single notification as read |
| `AdminDashboardView.tsx` <!-- inferred --> | `PATCH` | `/api/notifications/read-all` | Bearer | — | Marks all notifications as read |
| `AdminDashboardView.tsx` <!-- inferred --> | `DELETE` | `/api/notifications/clear-all` | Bearer | — | Deletes all notification records. Admin only. |

---

### 8.9 Industries

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `AdminDashboardView.tsx` (industry catalog form) | `POST` | `/api/industries` | Bearer | `{ name, sector, description, ... }` | Creates new industry category. Admin only. |

---

### 8.10 Contact Enquiries

| Component / File | Method | Endpoint | Auth Header | Request Body / Params | What It Does |
|:-----------------|:-------|:---------|:-----------:|:----------------------|:-------------|
| `AdminLeadsModal.tsx` or `AdminDashboardView.tsx` <!-- inferred --> | `GET` | `/api/contact` | Bearer | `page`, `limit`, `status`, `search` | Lists all contact form submissions |
| <!-- inferred --> | `GET` | `/api/contact/:id` | Bearer | `:id` path param | Single enquiry detail |
| <!-- inferred --> | `PUT` | `/api/contact/:id` | Bearer | `{ status?, notes?, assignedTo?, isArchived? }` | Updates enquiry fields |
| <!-- inferred --> | `PUT` | `/api/contact/:id/status` | Bearer | `{ status }` | Updates enquiry status only |
| <!-- inferred --> | `DELETE` | `/api/contact/:id` | Bearer | `?permanent=true` | Soft or permanently deletes enquiry |

---

## 9. Component Reference

### `InternalPortalLogin.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Centered login card with Inisio branding, email input, password input, submit button with loading state |
| **API Calls** | `POST /api/auth/admin-login` |
| **Visible to** | All unauthenticated visitors |
| **On Success** | Calls `onLoginSuccess()` prop → parent sets `activeTab = 'admin'` |
| **On Error** | Displays error string from API response `err.response.data.message` |
| **Token Storage** | `localStorage`: `inisio_admin_token`, `inisio_admin_user` |

---

### `AdminDashboardView.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | 4 KPI cards · Lead pipeline table (filterable by status + feasibility rating + search) · User table · Industry catalog form · CSV export button |
| **API Calls** | `GET /api/leads`, `GET /api/users` (parallel), `PUT /api/leads/:id`, `PUT /api/leads/:id/assignment`, `PUT /api/leads/:id/progress`, `DELETE /api/leads/:id`, `DELETE /api/leads/clear-all`, `POST /api/industries` |
| **Roles** | `admin`, `superadmin` |
| **Sub-modals** | `AdminLeadsModal` (full enquiry), `LeadEditModal` (edit), `UserProfileDetailModal` (user detail) |
| **CSV Export** | Client-side only. No API call. Generates CSV blob from in-memory `filteredLeads` array |
| **KPIs** | `totalPipelineValue` (sum of `projectCost` Cr), `totalRequiredDebt` (sum of `requiredBankDebt` Cr), `feasibilityRate` (% of High/Moderate leads), `avgBankabilityScore` |

---

### `AdminLeadsModal.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Full-screen slide-over with complete lead record — all fields, timeline, assignment info, document list |
| **API Calls** | May call `GET /api/contact` for enquiry cross-reference <!-- inferred --> |
| **Roles** | `admin`, `superadmin` |

---

### `LeadEditModal.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Edit form modal — all editable fields of a lead |
| **API Calls** | `PUT /api/leads/:id` |
| **Roles** | `admin` (superadmin sees modal but save is blocked client-side by `checkSuperAdminRestriction`) |

---

### `CADashboard.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Project list filtered to `Pending Audit` status; audit form with CMA status, bankability rating, DSCR, debt-equity ratio, CA review notes, and status selector |
| **API Calls** | `GET /api/projects`, `GET /api/projects/:id`, `PUT /api/projects/:id/audit` |
| **Roles** | `admin`, `superadmin`, `ca` |
| **Audit body** | `{ status, caReviewNotes, assignedCA, cmaAuditStatus, bankabilityStatus, dscr, debtEquityRatio }` |

---

### `DPRConsultantDashboard.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Leads/projects with DPR assignment; document upload panel; authenticated download links |
| **API Calls** | `GET /api/leads`, `GET /api/documents/project/:leadId`, `POST /api/documents/upload`, `GET /api/documents/:id/download`, `PUT /api/leads/:id/progress` |
| **Roles** | `admin`, `superadmin`, `dpr`, `ca` |
| **Upload** | `multipart/form-data` — fields: `file`, `leadId`, `category` |

---

### `ProsyncDashboard.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Consultation booking list with status management, advisor assignment, feedback field |
| **API Calls** | `GET /api/consultations`, `GET /api/consultations/:id`, `PUT /api/consultations/:id/status` |
| **Roles** | `admin`, `superadmin`, `prosync`, `prosync_admin` |
| **Status update body** | `{ status, feedback, assignedAdvisor }` |

---

### `UserProfileDetailModal.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Slide-over modal: name, email, role, company, phone, login count, last login metadata (IP, city, browser), project/consultation counts |
| **API Calls** | `GET /api/users/profile/:email` <!-- inferred --> |
| **Roles** | `admin`, `superadmin` |

---

### `ForbiddenPage.tsx`

| Item | Detail |
|:-----|:-------|
| **Renders** | Access-denied page — shows required roles for the active tab |
| **API Calls** | None |
| **Visible to** | Any authenticated user accessing a tab their role doesn't allow |
| **Actions** | "Go to Home" → `setActiveTab('admin')`, "Switch Account" → `setActiveTab('login')` |

---

## 10. Deployment

### Vercel (Recommended)

```bash
# Build command
npm run build

# Output directory
dist/
```

**Environment variables on Vercel dashboard:**

```ini
VITE_API_BASE_URL=https://api.inisio.in
```

**Reverse-proxy rewrite — add `vercel.json` at project root:**

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.inisio.in/api/:path*" }
  ]
}
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://api.inisio.in/api/:splat"
  status = 200
  force = true
```

### Pointing to a Different Backend

1. Update `VITE_API_BASE_URL` to the new backend URL in your hosting dashboard
2. Add the new admin portal origin to `ALLOWED_ORIGINS` in the backend's environment variables

### Post-Deployment Checklist

- [ ] `https://admin.inisio.in` loads `InternalPortalLogin` (not a blank page or 404)
- [ ] Login with admin email → redirects to Admin Console tab; KPIs and leads table load
- [ ] Login with CA email → Admin Console tab shows `ForbiddenPage`; CA Auditor tab shows project list
- [ ] Login with superadmin → all tabs accessible; all save/delete actions show "Read-Only" toast and do not call the API
- [ ] Login with prosync email → only Prosync tab accessible; consultation list loads
- [ ] Confirm `https://inisio.in` (public site) has **no link** pointing to `admin.inisio.in`
- [ ] Attempt to call `GET /api/users` with a public-user JWT → backend returns 403
- [ ] Submit 21 login attempts in 15 minutes → backend returns 429 Too Many Requests
