# CyberGuardiansSociety (CGS) Online Attendance & Admin Platform

![CGS Platform](https://img.shields.io/badge/Platform-Production--Ready-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)

A production-grade, secure full-stack web platform built for **CyberGuardiansSociety (CGS)** to manage online cybersecurity sessions, synchronize participant registrations from Google Sheets into PostgreSQL, enable fast eligibility-verified attendance recording for live Google Meet sessions, and provide a dedicated, role-protected administrator ecosystem with complete audit logging.

---

## 🚀 Key Features

### 🌐 Participant Portal (`/`)
* **Live Session Banner**: Instant detection of ongoing Google Meet workshops with direct attendance actions.
* **Attendance Flow (`/attendance`)**: Simple, account-less attendance marking. Performs server-side eligibility lookup, email normalization, rate limiting, and session verification.
* **Session Directory (`/sessions` & `/session/[slug]`)**: Browse active, upcoming, and past technical sessions with detailed agendas, speaker profiles, and Google Meet links.
* **Platform Status (`/status`)**: Public operational health indicators for system availability.

### 🛡️ Administrator Ecosystem (`/admin`)
* **Secure Cookie Sessions**: Server-side enforced authentication with session expiration and password hashing using bcrypt.
* **Role-Based Access Control**: `SUPER_ADMIN` and `ADMIN` privilege separation.
* **Session Management (`/admin/sessions`)**: Full CRUD operations for session titles, slugs, descriptions, Google Meet links, registration/attendance window toggles, and speaker assignments.
* **Speaker Directory (`/admin/speakers`)**: Speaker profile management including job title, organization, bio, and social links.
* **Registrant Management (`/admin/registrants`)**: View all registered users across sessions with real-time search, session filters, and **CSV Data Export**.
* **Attendance Dashboard (`/admin/attendance`)**: Complete visibility over attendance records with manual administrative override capabilities and audit reason tracking.
* **Google Sync Engine (`/admin/google-sync`)**: Synchronization of Google Forms responses via official Google Sheets API v4 into PostgreSQL.
* **Admin Account Control (`/admin/admins`)**: Super Admin interface to invite, grant privileges, or deactivate administrator accounts.
* **Security Audit Logs (`/admin/audit-logs`)**: Complete event stream tracing logins, manual overrides, session changes, and settings modifications.
* **Global Portal Settings (`/admin/settings`)**: Master kill-switches for portal availability, registration windows, maintenance mode, and default timezone (`Asia/Karachi`).

---

## 🛠️ Technology Architecture

* **Framework**: Next.js (App Router, Server Actions, API Routes)
* **Language**: TypeScript (Strict Mode)
* **Styling**: Tailwind CSS v4 + Vanilla CSS Design System with CGS Blue-to-Red visual identity
* **Database**: PostgreSQL hosted on **Neon PostgreSQL** via **Prisma ORM**
* **UI Controls**: Radix UI, Lucide Icons, Sonner Notifications
* **Validation**: Zod schema validation
* **Google Integration**: `googleapis` (Sheets API v4 Service Account)

---

## 📋 Environment Variables Setup

Copy `.env.example` to create your `.env` file:

```bash
cp .env.example .env
```

Define the required variables:

```env
# ─── Database (Neon PostgreSQL) ─────────────────────────────────────────
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/cgs?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/cgs?sslmode=require"

# ─── Google Sheets Integration ─────────────────────────────────────────
GOOGLE_SERVICE_ACCOUNT_EMAIL="cgs-sync@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ─── Auth & Cron Secrets ───────────────────────────────────────────────
AUTH_SECRET="your-random-32-byte-hex-string"
CRON_SECRET="your-cron-secret-token"

# ─── Initial Admin Seed ────────────────────────────────────────────────
SEED_ADMIN_EMAIL="admin@cgs.local"
SEED_ADMIN_PASSWORD="change-me-please"
```

---

## 🔑 Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Sheets API**.
3. Create a **Service Account** and generate a JSON Private Key.
4. Copy `client_email` to `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `private_key` to `GOOGLE_PRIVATE_KEY` in `.env`.
5. Share your Google Registration Response Sheet with the Service Account email (`Viewer` permission).

---

## 📦 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Database Migrations**:
   ```bash
   npx prisma db push
   ```

3. **Seed Initial Database**:
   ```bash
   npm run seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the public portal or [http://localhost:3000/admin](http://localhost:3000/admin) to log in as admin (`admin@cgs.local` / `change-me-please`).

---

## 🚀 Deploying to Vercel

1. Push your repository to GitHub.
2. Import your repository into **Vercel**.
3. Add all environment variables (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) under Vercel Project Settings.
4. Set Build Command: `npx prisma generate && next build`.
5. Deploy! Vercel Cron will automatically trigger `/api/cron/sync` every 2 hours to keep registrations synchronized.

---

## 🔒 Security Principles

* **Server Authorization**: Every protected admin route and action checks session cookies server-side.
* **Rate Limiting**: Attendance submission endpoints and login forms enforce database-backed IP rate limiting to mitigate brute-force and spam attempts.
* **Email Normalization**: Standardized lowercased, trimmed email matching across Google Sheets and attendance verification.
* **Auditability**: Every administrative write operation is recorded in the `AuditLog` table with IP, actor ID, timestamp, and details.
