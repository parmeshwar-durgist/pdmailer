# HR Bulk Email Sender Portal (Multi-User SaaS Edition)

A complete, professional, production-ready full-stack Multi-User SaaS web application designed for software engineers and professionals to manage IT company HR contacts, import contact spreadsheets (Excel/CSV), customize personalized application emails with dynamic placeholders, attach PDF resumes, and send individual personalized emails safely through their own Gmail SMTP accounts.

---

## 🌟 Key Features

1. **Multi-Tenant SaaS Architecture**:
   - **User Self-Registration (`/register`)**: Anyone can create an account and access an isolated workspace.
   - **Tenant Isolation**: Contacts, uploaded resumes, email templates, campaigns, and suppression lists are strictly scoped by `user_id`. One user can never see or modify another user's contacts.
   - **Per-User Gmail SMTP**: Each user configures their own Gmail address and Google App Password securely in Settings.
   - **Auto-Seeded Starters**: New accounts automatically receive a professional starter email template and baseline configuration.

2. **Executive Email Formatting (Gmail & Outlook Optimized)**:
   - Clean, executive typography rendering cleanly in Gmail and Outlook mobile/desktop apps.
   - Preserves double line breaks as clean paragraphs (`<p>`).
   - Converts Markdown bold (`**bold**` or `*bold*`) to HTML `<strong>`.
   - Converts bullet points (`- ` or `* `) into styled unordered lists (`<ul><li>`).
   - Formats signature blocks with hyperlinked email, portfolio, and GitHub links.

3. **Responsive Desktop & Mobile UI**:
   - **Desktop**: Collapsible sidebar, stats cards, split-pane authentication layout, rich data tables with pagination.
   - **Mobile**: Quick thumb bottom navigation bar, off-canvas navigation drawer, horizontal swipe-scroll tables, and touch-optimized form inputs (minimum 16px font-size to prevent mobile browser auto-zoom).
   - **Masked Password Field**: Eye toggle icon on login and registration pages.

4. **Dashboard Overview**: Real-time KPI statistics sourced directly from MySQL (Total HR Contacts, Valid Email Addresses, Emails Sent, Emails Failed, Emails Pending, Recent Activity, and Live SMTP Health status).

5. **HR Contact Management**:
   - Add contacts manually or bulk import via spreadsheets.
   - Search by name, email, job title, or company.
   - Company and Title filters, sorting, and pagination.
   - RFC 5322 email normalization and deduplication safeguards.
   - CSV export protected against spreadsheet formula injection.

6. **Excel & CSV Import**:
   - Supports `.xlsx`, `.xls`, and `.csv`.
   - Expected headers: `Name`, `Emails`, `Title`, `Company` (with auto-normalization for header variations like `Email` or `Job Title`).
   - Downloadable sample Excel template.
   - Pre-import validation preview showing Total Rows, Valid New, In Database, and Duplicate/Error rows with row-level diagnostics.
   - Choice to skip duplicates or update existing contacts.

7. **Resume Management**:
   - Secure PDF upload (max 5 MB) stored outside the web root.
   - Active resume toggle: automatically attached to all campaign emails.
   - Preview original file name, size, upload date, and download copy.

8. **Email Template Editor**:
   - Subject and Body editor with HTML support and placeholder chips (`{{Name}}`, `{{Title}}`, `{{Company}}`).
   - Interactive live personalization preview.
   - One-click "Load Executive Template" button for an instant software engineer outreach pitch.
   - Test email dispatch to your own inbox before campaign launch.

9. **Gmail SMTP & Throttled Queue Engine**:
   - Individual 1:1 message dispatch (never exposes recipient emails via CC/BCC).
   - Configurable delay (e.g. 2–5 seconds) between emails to prevent spam classification.
   - Pause, Resume, and Cancel campaign controls.
   - Safe server restart recovery: stale jobs automatically recover to pending state.
   - Retry failed recipients without re-sending to successful ones.

10. **Direct WhatsApp Outreach (1-Click QR Linked)**:
    - **WhatsApp Web Device Linking (`/settings`)**: Scan a QR code using your personal WhatsApp on your smartphone (`Linked Devices` -> `Link a Device`). No expensive Meta Cloud API or business account approval needed!
    - **Direct Send from Contacts Table (`/contacts`)**: Click the green WhatsApp button on any HR contact row to open the instant dispatch modal.
    - **Dynamic Personalization**: Automatically fills in the HR contact's name, company, and title via placeholders (`{{Name}}`, `{{Company}}`, `{{Title}}`).
    - **PDF Resume Attachment**: Send your active PDF resume straight to the recruiter's WhatsApp chat alongside your message.
    - **Number Verification**: Validates whether the recipient's phone number is registered on WhatsApp before dispatch.
    - **Phone Support in Excel/CSV Import**: Seamlessly bulk import WhatsApp phone numbers using the `Phone` / `WhatsApp` column in Excel spreadsheets.

11. **Email Suppression & Consent Protection**:
    - Dedicated opt-out and suppression list to prevent emailing contacts who unsubscribed or should not be contacted.

12. **Authentication & Security**:
    - Bcrypt password hashing.
    - JSON Web Tokens (JWT) with HTTP-only cookies and Authorization header support.
    - Rate limiting on login and API endpoints.
    - Helmet security headers and CORS protection.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Bootstrap 5, React Router v6, Axios, Lucide React icons, React Hot Toast.
- **Backend**: Node.js, Express.js, `whatsapp-web.js` (headless browser WhatsApp engine), `qrcode`, Nodemailer, `mysql2` with connection pooling, Multer, SheetJS (`xlsx`), Zod validation, `bcryptjs`, `jsonwebtoken`, Helmet, `express-rate-limit`, `sanitize-html`.
- **Database**: MySQL (compatible with XAMPP / phpMyAdmin / Cloud MySQL).

---

## 📋 Prerequisites

- **Node.js** v18+ or v20+ (`node -v`)
- **npm** v9+ or v10+ (`npm -v`)
- **MySQL Server** (e.g., via XAMPP on port 3306)
- **phpMyAdmin** (optional for GUI management)
- **Gmail Account** with **2-Step Verification** enabled (to generate an App Password)

---

## 🗄️ Database Setup (phpMyAdmin or MySQL CLI)

### Option A: Using phpMyAdmin (Recommended for GUI)
1. Open XAMPP Control Panel and start **Apache** and **MySQL**.
2. Open your browser and navigate to: `http://localhost/phpmyadmin`
3. Click on **New** in the left sidebar to create a database.
4. Enter database name: `hr_mailer_db` and select collation `utf8mb4_unicode_ci`, then click **Create**.
5. Select `hr_mailer_db` in the left sidebar, click the **Import** tab at the top.
6. Choose the file located at: `database/database.sql`
7. Click **Import** at the bottom of the page.

### Option B: Using Command Line
```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS hr_mailer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content database\database.sql | C:\xampp\mysql\bin\mysql.exe -u root hr_mailer_db
```

### Default Administrator Credentials
- **Email**: `admin@hrmailer.com`
- **Password**: `Admin@12345`

---

## 📧 Gmail SMTP & Google App Password Configuration

Because Google disallows raw account passwords for third-party SMTP access, you must generate a 16-character **App Password**:

1. Go to your [Google Account Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. In the search box at the top, type `App passwords` (or look under 2-Step Verification).
4. Enter an app name (e.g., `HR Bulk Mailer`) and click **Create**.
5. Google will display a 16-character code (e.g., `abcd efgh ijkl mnop`).
6. You can configure this password either in `server/.env` or in the portal's **Settings** page:
   ```env
   GMAIL_USER=parmeshwardurgist@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```
7. Click **Test SMTP Connection** on the Settings page to confirm connectivity!

---

## 🚀 Installation & Running the Application

### 1. Backend Setup & Startup
```powershell
# Navigate to the server folder
cd server

# Install dependencies (already prepared)
npm install

# Start the server (runs on http://localhost:5000)
npm start

# Or start in development mode with nodemon
npm run dev
```

### 2. Frontend Setup & Startup
In a separate terminal:
```powershell
# Navigate to client folder
cd client

# Install dependencies (already prepared)
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

Log in using:
- **Email**: `admin@hrmailer.com`
- **Password**: `Admin@12345`

---

## 🧪 Automated Testing

The project includes an end-to-end automated API verification suite covering authentication, duplicate detection, template rendering, Excel sample downloads, contact management, suppressions, and campaign lifecycles.

To run the test suite:
```powershell
cd server
npm test
```

Expected output:
```text
🧪 Starting HR Bulk Email Sender Portal Automated Test Suite...
  ✅ PASS: Health check endpoint returns ok
  ✅ PASS: Login fails with invalid credentials
  ✅ PASS: Login succeeds with default admin credentials
  ✅ PASS: Protected route rejects request without token
  ✅ PASS: Dashboard returns live MySQL statistics
  ✅ PASS: Create new HR contact
  ✅ PASS: Prevent duplicate email contact creation
  ✅ PASS: Contact list search filters correctly
  ✅ PASS: Delete contact
  ✅ PASS: Template placeholder interpolation works accurately
  ✅ PASS: Excel sample template endpoint responds with valid file
  ✅ PASS: Campaign creation and recipient queuing
  ✅ PASS: Add email to suppression list
  ✅ PASS: Remove email from suppression list
----------------------------------------------------
Results: 14 passed, 0 failed.
----------------------------------------------------
```

---

## 📁 Project Structure

```text
hr-bulk-email-sender/
├── client/                     # Vite + React 18 Frontend
│   ├── src/
│   │   ├── components/common/  # Badges, Modals, StatCards, EmptyState
│   │   ├── context/            # AuthContext (JWT & User state)
│   │   ├── layouts/            # DashboardLayout (Sidebar, TopNav)
│   │   ├── pages/              # Dashboard, Contacts, Import, Resumes, Templates, Campaign, Logs, Settings
│   │   ├── services/           # Axios API Client
│   │   ├── App.jsx             # React Router routing
│   │   ├── index.css           # Modern SaaS CSS design system
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # MySQL connection pool, Nodemailer transporter, Multer file filters
│   │   ├── controllers/        # Auth, Contacts, Resumes, Templates, Campaigns, Settings
│   │   ├── middleware/         # Auth (JWT), Rate Limiters, Error Handling
│   │   ├── repositories/       # Parameterized SQL Database Access Layer
│   │   ├── routes/             # Modular REST API routes
│   │   ├── services/           # Import, Queue, Email, Resume, Campaign business logic
│   │   ├── utils/              # Email & HTML sanitizers, CSV injection prevention
│   │   ├── validators/         # Zod validation schemas
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Server bootstrap & queue crash recovery
│   ├── uploads/resumes/        # Protected local disk storage for PDF resumes
│   ├── test/                   # Automated API integration tests
│   ├── .env.example
│   └── package.json
├── database/
│   └── database.sql            # Complete MySQL schema & seed data
├── .gitignore
├── package.json
└── README.md
```

---

## 🔒 Security & Reliability Guarantees

- **No Public Resume Exposure**: Resumes are placed in a secure server directory outside public web assets and streamed with authenticated download endpoints.
- **CSV Injection Prevention**: Cells in exported CSV files that start with `=`, `+`, `-`, `@`, `\t` are escaped with a leading single quote `'`.
- **Duplicate Prevention**: Email addresses are normalized to lowercase, trimmed, and protected with `UNIQUE` MySQL database constraints.
- **Idempotent Queue Execution**: Recipient records have unique job states (`pending`, `processing`, `sent`, `failed`, `skipped`). If the server restarts midway through a campaign, stale `processing` jobs are safely reset to `pending` without duplicate sends.
- **Rate Throttling**: Emails are sent sequentially with configurable delays (default: 2 seconds) so Gmail's sending limits and spam policies are strictly respected.

---

## 📄 License
MIT License. Created for Parmeshwar Durgist.

