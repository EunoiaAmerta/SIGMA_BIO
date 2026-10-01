# 📋 SIGMA - Product Backlog & Sprint Planning

> **Project**: SIGMA (Sistem Informasi Goldenstar dan Monitoring Akademik)  
> **Version**: 2.0 - Enhanced with Admin Input Features  
> **Created**: 2026-10-01  
> **Team**: Development Team  
> **Product Owner**: Guru/Admin Sekolah  
> **Sprint Duration**: 2 weeks  
> **Story Point Scale**: Fibonacci (1, 2, 3, 5, 8, 13)

---

## 🎯 Product Vision

Mengembangkan SIGMA dari sistem read-only menjadi **full-featured academic management system** dengan kemampuan input data via web, sambil tetap menggunakan Google Sheets sebagai database untuk memastikan **always-online availability** dan **kemudahan akses** bagi guru.

---

## 📊 Product Backlog Overview

| Epic ID | Epic Name | Priority | Story Points | Status | Sprint |
|---------|-----------|----------|--------------|--------|--------|
| EPIC-1 | Authentication & Authorization System | Critical | 21 | 🔴 To Do | Sprint 1 |
| EPIC-2 | Admin Dashboard Foundation | Critical | 13 | 🔴 To Do | Sprint 1 |
| EPIC-3 | Student Management (CRUD) | High | 21 | 🔴 To Do | Sprint 2 |
| EPIC-4 | Grade Input System | High | 34 | 🔴 To Do | Sprint 2-3 |
| EPIC-5 | Golden Star Management | High | 21 | 🔴 To Do | Sprint 3 |
| EPIC-6 | Student Dashboard Enhancement | Medium | 21 | 🔴 To Do | Sprint 4 |
| EPIC-7 | Real-time Data & Performance | Medium | 13 | 🔴 To Do | Sprint 5 |
| EPIC-8 | Testing & Quality Assurance | Critical | 21 | 🔴 To Do | Sprint 6 |
| EPIC-9 | Documentation & Deployment | Critical | 13 | 🔴 To Do | Sprint 6 |

**Total Story Points**: 178 points  
**Estimated Duration**: 6 sprints (12 weeks)  
**Team Velocity**: ~30 points/sprint (estimated)

---

# 🔥 EPIC-1: Authentication & Authorization System

**Priority**: Critical  
**Business Value**: Secure access control untuk admin dan murid  
**Story Points**: 21  
**Sprint**: Sprint 1

## User Stories

### SIGMA-001: Setup JWT Authentication Infrastructure

**User Story**:  
Sebagai **developer**, saya ingin **mengimplementasikan JWT authentication system** agar **admin dan murid dapat login dengan aman menggunakan token-based authentication**.

**Acceptance Criteria**:
- [ ] JWT library (jose) terinstall dan dikonfigurasi
- [ ] Function `generateToken(payload)` membuat JWT dengan expire 7 hari
- [ ] Function `verifyToken(token)` memvalidasi JWT dan return payload
- [ ] Token disimpan di httpOnly cookie (bukan localStorage)
- [ ] Token payload berisi: `{ email, role, nisn?, exp }`
- [ ] Secret key disimpan di environment variable

**Technical Details**:
```typescript
// lib/auth.ts
import * as jose from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

export async function generateToken(payload: {
  email: string;
  role: 'student' | 'admin';
  nisn?: string;
}) {
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
  
  return token;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as {
      email: string;
      role: 'student' | 'admin';
      nisn?: string;
      exp: number;
    };
  } catch (error) {
    return null;
  }
}
```

**Task Breakdown**:
1. Install jose package
2. Create `lib/auth.ts` dengan generateToken & verifyToken
3. Setup JWT_SECRET di .env.local
4. Write unit tests untuk auth functions
5. Document usage di README

**Technical Domain**: Backend  
**Estimasi Pengerjaan**: 1 hari  
**Dependencies**: None

---

### SIGMA-002: Create Admin Login API Endpoint

**User Story**:  
Sebagai **admin/guru**, saya ingin **login menggunakan email dan password** agar **saya dapat akses admin dashboard**.

**Acceptance Criteria**:
- [ ] POST `/api/auth/admin/login` endpoint tersedia
- [ ] Validasi email format dan password minimal 8 karakter
- [ ] Password di-hash dengan bcryptjs
- [ ] Credentials divalidasi terhadap ADMIN_USERS tab di Google Sheets
- [ ] Return JWT token jika berhasil
- [ ] Set httpOnly cookie dengan token
- [ ] Return error message jika gagal (credentials salah)
- [ ] Rate limiting: max 5 failed attempts per 15 menit per IP

**Technical Details**:
```typescript
// app/api/auth/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);
    
    // Fetch admin from Google Sheets ADMIN_USERS tab
    const response = await fetch(
      `${process.env.GOOGLE_SCRIPT_URL}?action=getAdmin&email=${email}`
    );
    const data = await response.json();
    
    if (!data.success || !data.admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, data.admin.passwordHash);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = await generateToken({
      email: data.admin.email,
      role: 'admin'
    });
    
    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        email: data.admin.email,
        name: data.admin.name,
        role: 'admin'
      }
    });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Task Breakdown**:
1. Install bcryptjs package
2. Create `/api/auth/admin/login/route.ts`
3. Implement validation dengan Zod
4. Implement Google Sheets fetch untuk admin data
5. Implement password comparison
6. Set httpOnly cookie
7. Add rate limiting
8. Write integration tests
9. Test dengan Postman/Thunder Client

**Technical Domain**: Backend, Security  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-001

---

### SIGMA-003: Enhance Student Login with JWT

**User Story**:  
Sebagai **murid**, saya ingin **login menggunakan email dan NISN dengan JWT token** agar **session saya lebih aman dan tidak mudah di-manipulasi**.

**Acceptance Criteria**:
- [ ] POST `/api/auth/student/login` endpoint tersedia
- [ ] Validasi email dan NISN (10 digit)
- [ ] NISN divalidasi terhadap DATABASE_MASTER tab
- [ ] Return JWT token jika berhasil
- [ ] Set httpOnly cookie dengan token
- [ ] Response include student profile (nama, kelas)
- [ ] Replace localStorage dengan JWT cookie di auth-provider.tsx
- [ ] Error handling untuk student not found

**Task Breakdown**:
1. Create `/api/auth/student/login/route.ts`
2. Implement validation dengan Zod
3. Fetch student dari Google Sheets
4. Generate JWT dengan role: 'student'
5. Update `auth-provider.tsx` untuk use cookie instead localStorage
6. Remove localStorage "bioexplorer_user"
7. Test login flow end-to-end

**Technical Domain**: Backend, Frontend Web  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-001

---

### SIGMA-004: Create Route Protection Middleware

**User Story**:  
Sebagai **system**, saya ingin **melindungi route /admin/** agar **hanya admin yang dapat akses admin dashboard**.

**Acceptance Criteria**:
- [ ] middleware.ts dibuat di root project
- [ ] Middleware intercept requests ke /admin/*
- [ ] Middleware verify JWT token dari cookie
- [ ] Redirect ke /login jika token invalid/missing
- [ ] Redirect ke /unauthorized jika role bukan 'admin'
- [ ] Middleware juga protect /dashboard untuk student
- [ ] Middleware tidak block public routes (/login, /api/auth/*)
- [ ] Add req.user payload untuk downstream handlers

**Technical Details**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths - skip auth
  if (
    path.startsWith('/login') ||
    path.startsWith('/api/auth/') ||
    path === '/'
  ) {
    return NextResponse.next();
  }
  
  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify token
  const payload = await verifyToken(token);
  
  if (!payload) {
    // Invalid token - clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
  
  // Check role for protected routes
  if (path.startsWith('/admin')) {
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  if (path.startsWith('/dashboard')) {
    if (payload.role !== 'student') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Add user to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  if (payload.nisn) {
    requestHeaders.set('x-user-nisn', payload.nisn);
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*'
  ]
};
```

**Task Breakdown**:
1. Create `middleware.ts` di root
2. Implement token verification logic
3. Implement role-based redirects
4. Add user info to request headers
5. Test semua protected routes
6. Test unauthorized access scenarios
7. Create `/unauthorized` page

**Technical Domain**: Backend, Security  
**Estimasi Pengerjaan**: 1 hari  
**Dependencies**: SIGMA-001

---

### SIGMA-005: Setup ADMIN_USERS Tab di Google Sheets

**User Story**:  
Sebagai **admin**, saya ingin **credentials saya disimpan dengan aman di Google Sheets** agar **saya dapat login ke admin dashboard**.

**Acceptance Criteria**:
- [ ] Tab baru "ADMIN_USERS" dibuat di Google Sheets
- [ ] Struktur kolom: Email | Name | PasswordHash | Role | CreatedAt | LastLogin
- [ ] Minimal 1 admin account dibuat untuk testing
- [ ] Password di-hash menggunakan bcryptjs (12 rounds)
- [ ] Google Apps Script function `getAdmin(email)` tersedia
- [ ] Protected range: hanya script yang bisa read/write

**Sheet Structure**:
```
Row 1 (Header):
A: Email
B: Name
C: PasswordHash
D: Role (admin)
E: CreatedAt
F: LastLogin

Row 2 (Sample Data):
A: admin@school.com
B: Admin Biologi
C: $2a$12$... (hashed password)
D: admin
E: 2026-10-01
F: 2026-10-01

Protected Range: A1:F1000 (read/write only via script)
```

**Google Apps Script**:
```javascript
function getAdmin(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('ADMIN_USERS');
  
  const data = sheet.getDataRange().getValues();
  const emailCol = 0; // Column A
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      return {
        success: true,
        admin: {
          email: data[i][0],
          name: data[i][1],
          passwordHash: data[i][2],
          role: data[i][3],
          createdAt: data[i][4],
          lastLogin: data[i][5]
        }
      };
    }
  }
  
  return {
    success: false,
    error: 'Admin not found'
  };
}
```

**Task Breakdown**:
1. Create ADMIN_USERS tab di Google Sheets
2. Add header row
3. Generate hashed password untuk admin pertama
4. Add sample admin data
5. Update Google Apps Script dengan getAdmin function
6. Test function via Apps Script editor
7. Set protected range
8. Document credential management procedure

**Technical Domain**: Backend (Google Sheets)  
**Estimasi Pengerjaan**: 0.5 hari  
**Dependencies**: None

---

### SIGMA-006: Create Admin Login Page UI

**User Story**:  
Sebagai **admin**, saya ingin **halaman login khusus admin** agar **saya dapat login dengan tampilan yang sesuai role saya**.

**Acceptance Criteria**:
- [ ] Page `/admin/login` tersedia
- [ ] Form fields: Email, Password
- [ ] Show/hide password toggle
- [ ] Remember me checkbox
- [ ] Loading state saat submit
- [ ] Error message display
- [ ] Success redirect ke `/admin/dashboard`
- [ ] Responsive design
- [ ] Accessible (keyboard navigation, ARIA labels)

**Design Mockup**:
```
┌────────────────────────────────────┐
│     [Logo Sekolah]                 │
│                                    │
│   SIGMA - Admin Portal             │
│   ───────────────────────          │
│                                    │
│   Email                            │
│   [____________________]           │
│                                    │
│   Password                         │
│   [____________________] [👁]      │
│                                    │
│   □ Ingat saya                     │
│                                    │
│   [    Login sebagai Admin    ]    │
│                                    │
│   Login sebagai murid →            │
└────────────────────────────────────┘
```

**Task Breakdown**:
1. Create `/app/admin/login/page.tsx`
2. Implement form dengan react-hook-form + Zod
3. Add show/hide password toggle
4. Implement submit handler dengan API call
5. Add loading spinner
6. Add error alert
7. Add remember me functionality
8. Test responsive layout
9. Test accessibility dengan keyboard

**Technical Domain**: UI/UX Web, Frontend Web  
**Estimasi Pengerjaan**: 1.5 hari  
**Dependencies**: SIGMA-002

---

## Definition of Done - EPIC-1

**Critical Requirements**:
- [x] Semua user stories completed dan tested
- [x] JWT authentication berfungsi untuk admin dan murid
- [x] Middleware melindungi protected routes
- [x] Admin dapat login via `/admin/login`
- [x] Student dapat login via `/login` dengan JWT
- [x] Token tersimpan di httpOnly cookie
- [x] ADMIN_USERS tab setup dengan minimal 1 admin
- [x] All tests passing (unit + integration)
- [x] Code review completed
- [x] Documentation updated

**Security Checklist**:
- [x] Password hashing dengan bcryptjs (12 rounds)
- [x] JWT secret di environment variable
- [x] httpOnly cookies (not accessible via JS)
- [x] HTTPS only in production
- [x] Rate limiting pada login endpoints
- [x] CSRF protection
- [x] Input validation dengan Zod

---

# 🏗️ EPIC-2: Admin Dashboard Foundation

**Priority**: Critical  
**Business Value**: Foundation untuk semua admin features  
**Story Points**: 13  
**Sprint**: Sprint 1

## User Stories

### SIGMA-007: Create Admin Dashboard Layout

**User Story**:  
Sebagai **admin**, saya ingin **layout dashboard dengan sidebar navigation** agar **saya dapat navigasi ke berbagai fitur admin dengan mudah**.

**Acceptance Criteria**:
- [ ] `/app/admin/dashboard/layout.tsx` tersedia
- [ ] Sidebar navigation dengan menu items
- [ ] Header dengan logo, admin name, logout button
- [ ] Main content area
- [ ] Responsive: sidebar collapse di mobile
- [ ] Active menu item highlighting
- [ ] Smooth transitions
- [ ] Dark/Light mode toggle (optional)

**Menu Structure**:
```
SIGMA Admin
├── 📊 Dashboard (Overview)
├── 👥 Manajemen Murid
│   ├── Daftar Murid
│   ├── Tambah Murid
│   └── Import CSV
├── 📝 Input Nilai
│   ├── Input Per Murid
│   ├── Input Bulk
│   └── Import CSV
├── ⭐ Golden Star
│   ├── Tambah GS
│   ├── History Transaksi
│   └── Adjustment Bulk
├── 📈 Laporan
│   ├── Nilai Per Kelas
│   ├── Statistik GS
│   └── Export Data
└── ⚙️ Settings
```

**Technical Details**:
```typescript
// app/admin/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Star,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { 
    title: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard 
  },
  { 
    title: 'Manajemen Murid', 
    href: '/admin/dashboard/students', 
    icon: Users 
  },
  { 
    title: 'Input Nilai', 
    href: '/admin/dashboard/grades', 
    icon: FileText 
  },
  { 
    title: 'Golden Star', 
    href: '/admin/dashboard/golden-stars', 
    icon: Star 
  },
  { 
    title: 'Laporan', 
    href: '/admin/dashboard/reports', 
    icon: BarChart3 
  },
  { 
    title: 'Settings', 
    href: '/admin/dashboard/settings', 
    icon: Settings 
  }
];

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-40 h-screen transition-transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 w-64 bg-card border-r
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">SIGMA Admin</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`
        transition-all
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
      `}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-4 ml-auto">
              <span className="text-sm">Admin Name</span>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
```

**Task Breakdown**:
1. Create layout structure dengan sidebar
2. Implement responsive sidebar (collapsible)
3. Add navigation menu items
4. Add active state highlighting
5. Implement mobile overlay
6. Add header dengan user info
7. Test responsive behavior
8. Test keyboard navigation

**Technical Domain**: UI/UX Web, Frontend Web  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-006

---

### SIGMA-008: Create Admin Dashboard Home Page

**User Story**:  
Sebagai **admin**, saya ingin **melihat overview statistik** di dashboard home agar **saya dapat memantau kondisi sistem dengan cepat**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard` menampilkan cards statistik
- [ ] Stat cards: Total Murid, Total Nilai Terinput, Total GS Beredar
- [ ] Chart: Distribusi nilai per kelas
- [ ] Recent activity log (latest 10 actions)
- [ ] Quick actions buttons
- [ ] Loading states untuk semua data
- [ ] Error handling dengan retry button
- [ ] Auto-refresh setiap 5 menit

**Design Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Dashboard Overview                                  │
├──────────────┬──────────────┬──────────────────────┤
│ Total Murid  │ Nilai Input  │ GS Beredar           │
│    36        │    450       │    120               │
└──────────────┴──────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Distribusi Nilai per Kelas                          │
│  [Bar Chart]                                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Recent Activity                                     │
│  • Admin menambahkan nilai Tugas 1 untuk...         │
│  • Admin memberikan 2 GS kepada...                  │
│  • Admin mengedit data murid...                     │
└─────────────────────────────────────────────────────┘
```

**Task Breakdown**:
1. Create page.tsx dengan stat cards
2. Fetch statistics dari Google Sheets
3. Implement chart dengan Recharts
4. Add recent activity component
5. Add loading skeletons
6. Add error boundaries
7. Implement auto-refresh
8. Test with real data

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-007

---


### SIGMA-009: Setup Google Apps Script Enhanced Backend

**User Story**:  
Sebagai **developer**, saya ingin **enhance Google Apps Script dengan write operations** agar **admin dapat melakukan CRUD operations via API**.

**Acceptance Criteria**:
- [ ] Google Apps Script support doPost untuk write operations
- [ ] Function updateGrade(payload) tersedia
- [ ] Function addGoldenStar(payload) tersedia
- [ ] Function createStudent(payload) tersedia
- [ ] Function updateStudent(payload) tersedia
- [ ] Function deleteStudent(payload) tersedia
- [ ] API key validation untuk semua requests
- [ ] Error handling dengan structured responses
- [ ] Logging semua actions ke API_LOGS tab
- [ ] Response format konsisten: { success, data?, error? }

**Google Apps Script Structure**:
```javascript
// Code.gs - Main entry points
function doGet(e) {
  try {
    const action = e.parameter.action;
    const apiKey = e.parameter.apiKey;
    
    if (!validateApiKey(apiKey)) {
      return unauthorized();
    }
    
    switch(action) {
      case 'getStudentData':
        return getStudentData(e.parameter);
      case 'getLeaderboard':
        return getLeaderboard(e.parameter);
      case 'getAllStudents':
        return getAllStudents(e.parameter);
      case 'getAdmin':
        return getAdmin(e.parameter);
      default:
        return errorResponse('Invalid action');
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { action, apiKey } = payload;
    
    if (!validateApiKey(apiKey)) {
      return unauthorized();
    }
    
    switch(action) {
      case 'updateGrade':
        return updateGrade(payload);
      case 'addGoldenStar':
        return addGoldenStar(payload);
      case 'createStudent':
        return createStudent(payload);
      case 'updateStudent':
        return updateStudent(payload);
      case 'deleteStudent':
        return deleteStudent(payload);
      case 'bulkUpdateGrades':
        return bulkUpdateGrades(payload);
      default:
        return errorResponse('Invalid action');
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

// Validation
function validateApiKey(apiKey) {
  const validKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
  return apiKey === validKey;
}

// Response helpers
function successResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function unauthorized() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Logging
function logAction(action, details) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API_LOGS');
    if (!sheet) return;
    
    sheet.appendRow([
      new Date(),
      action,
      JSON.stringify(details),
      Session.getActiveUser().getEmail()
    ]);
  } catch (e) {
    console.error('Logging failed:', e);
  }
}
```

**Task Breakdown**:
1. Backup existing Google Apps Script
2. Add doPost handler
3. Implement validateApiKey function
4. Create response helper functions
5. Setup API_KEY in Script Properties
6. Create API_LOGS tab di Sheets
7. Implement logAction function
8. Test doGet dan doPost via Postman
9. Document API endpoints

**Technical Domain**: Backend (Google Apps Script)  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: None

---

### SIGMA-010: Create API_LOGS Tab for Audit Trail

**User Story**:  
Sebagai **admin**, saya ingin **semua API actions ter-log** agar **saya dapat audit history perubahan data**.

**Acceptance Criteria**:
- [ ] Tab "API_LOGS" tersedia di Google Sheets
- [ ] Struktur kolom: Timestamp | Action | Details | User
- [ ] Semua write operations ter-log
- [ ] Log retention: 90 hari (auto-delete older logs)
- [ ] Web UI untuk view logs (admin only)
- [ ] Filter logs by date, action, user
- [ ] Export logs to CSV

**Sheet Structure**:
```
Row 1 (Header):
A: Timestamp
B: Action
C: Details (JSON)
D: User Email

Row 2+ (Sample Data):
A: 2026-10-01 10:30:45
B: updateGrade
C: {"nisn":"0087595483","subject":"Tugas 1 Bab 1 S2","value":95}
D: admin@school.com
```

**Task Breakdown**:
1. Create API_LOGS tab
2. Add header row
3. Implement auto-cleanup script (delete >90 days)
4. Create `/admin/dashboard/logs` page
5. Implement log viewer dengan pagination
6. Add filters (date, action, user)
7. Add export to CSV button
8. Test logging from write operations

**Technical Domain**: Backend, Frontend Web  
**Estimasi Pengerjaan**: 1.5 hari  
**Dependencies**: SIGMA-009

---

## Definition of Done - EPIC-2

**Critical Requirements**:
- [x] Admin dashboard layout dengan sidebar navigation tersedia
- [x] Dashboard home page menampilkan overview statistics
- [x] Google Apps Script enhanced dengan write operations
- [x] API_LOGS tab setup dan berfungsi
- [x] All routes protected dengan middleware
- [x] Responsive design works di mobile/tablet/desktop
- [x] Tests passing untuk layout dan navigation
- [x] Code review completed

---

# 👥 EPIC-3: Student Management (CRUD)

**Priority**: High  
**Business Value**: Admin dapat manage data murid via web  
**Story Points**: 21  
**Sprint**: Sprint 2

## User Stories

### SIGMA-011: List All Students with Table View

**User Story**:  
Sebagai **admin**, saya ingin **melihat daftar semua murid dalam tabel** agar **saya dapat browse dan manage data murid dengan mudah**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/students` menampilkan table
- [ ] Kolom: NISN, Nama, Kelas, Email, Semester Aktif, Actions
- [ ] Pagination: 20 rows per page
- [ ] Search by nama atau NISN
- [ ] Filter by kelas
- [ ] Sort by any column
- [ ] Actions: View, Edit, Delete
- [ ] Loading skeleton saat fetch data
- [ ] Empty state jika tidak ada data

**Technical Details**:
```typescript
// app/admin/dashboard/students/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { columns } from './columns';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/students');
      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Murid</h1>
        <Button onClick={() => router.push('/admin/dashboard/students/new')}>
          Tambah Murid
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        loading={loading}
      />
    </div>
  );
}
```

**Task Breakdown**:
1. Install @tanstack/react-table
2. Create `/admin/dashboard/students/page.tsx`
3. Create DataTable component
4. Implement columns definition
5. Add search functionality
6. Add filter by kelas
7. Add sorting
8. Add pagination
9. Add action buttons (Edit, Delete)
10. Test with large dataset (100+ students)

**Technical Domain**: Frontend Web  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: SIGMA-007

---

### SIGMA-012: Create Student Form (Add New)

**User Story**:  
Sebagai **admin**, saya ingin **menambah murid baru via form** agar **saya tidak perlu manual edit Google Sheets**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/students/new` tersedia
- [ ] Form fields: NISN, Nama, Email, Kelas, Semester Aktif
- [ ] NISN validation (10 digit, unique)
- [ ] Email validation (format + unique)
- [ ] Kelas dropdown dengan options (11_P09, 11_P10, dst)
- [ ] Real-time validation feedback
- [ ] Submit button dengan loading state
- [ ] Success message + redirect ke list
- [ ] Error handling dengan clear messages
- [ ] Cancel button kembali ke list

**Form Layout**:
```
┌────────────────────────────────────────┐
│  Tambah Murid Baru                     │
├────────────────────────────────────────┤
│                                        │
│  NISN *                                │
│  [____________________]                │
│  10 digit angka                        │
│                                        │
│  Nama Lengkap *                        │
│  [____________________]                │
│                                        │
│  Email *                               │
│  [____________________]                │
│  Format: nama@school.com               │
│                                        │
│  Kelas *                               │
│  [Pilih Kelas ▼]                       │
│                                        │
│  Semester Aktif *                      │
│  ○ Semester 1    ○ Semester 2         │
│                                        │
│  [Batal]  [Simpan]                     │
└────────────────────────────────────────┘
```

**Validation Rules**:
- NISN: exactly 10 digits, numeric only, unique
- Nama: min 3 chars, max 100 chars, no special chars
- Email: valid format, unique, domain validation
- Kelas: must be from predefined list
- Semester: 1 or 2

**Task Breakdown**:
1. Create page `/admin/dashboard/students/new/page.tsx`
2. Setup react-hook-form dengan Zod schema
3. Implement all form fields
4. Add real-time validation
5. Create API endpoint POST `/api/admin/students`
6. Implement Google Apps Script createStudent function
7. Add success toast notification
8. Add error handling
9. Test validation edge cases
10. Test duplicate NISN/Email handling

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: SIGMA-009, SIGMA-011

---

### SIGMA-013: Edit Student Form

**User Story**:  
Sebagai **admin**, saya ingin **mengedit data murid** agar **saya dapat koreksi data yang salah input**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/students/[nisn]/edit` tersedia
- [ ] Form pre-filled dengan data existing
- [ ] NISN field disabled (tidak bisa diubah)
- [ ] Validasi sama dengan create form
- [ ] Show loading saat fetch student data
- [ ] Update button dengan loading state
- [ ] Success message + redirect ke detail/list
- [ ] Cancel button kembali tanpa save

**Task Breakdown**:
1. Create page `/admin/dashboard/students/[nisn]/edit/page.tsx`
2. Fetch student data by NISN
3. Pre-fill form dengan existing data
4. Disable NISN field
5. Create API endpoint PUT `/api/admin/students/[nisn]`
6. Implement Google Apps Script updateStudent function
7. Handle update success/error
8. Test update scenarios
9. Test concurrent edit (optimistic locking)

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-012

---

### SIGMA-014: Delete Student with Confirmation

**User Story**:  
Sebagai **admin**, saya ingin **menghapus data murid** agar **data yang tidak diperlukan bisa dibersihkan**.

**Acceptance Criteria**:
- [ ] Delete button di table row
- [ ] Confirmation dialog muncul sebelum delete
- [ ] Dialog menampilkan nama murid yang akan dihapus
- [ ] Warning: "Data nilai dan GS juga akan terhapus"
- [ ] Option: Soft delete (archive) atau Hard delete
- [ ] Loading state saat proses delete
- [ ] Success message setelah delete
- [ ] Table refresh otomatis setelah delete
- [ ] Error handling jika delete gagal

**Confirmation Dialog**:
```
┌─────────────────────────────────────────┐
│  ⚠️  Hapus Murid?                        │
├─────────────────────────────────────────┤
│                                         │
│  Anda yakin ingin menghapus:            │
│  Nama: AHMAD DARMAWAN                   │
│  NISN: 0087595483                       │
│                                         │
│  ⚠️ Data nilai dan Golden Star          │
│  murid ini juga akan terhapus!          │
│                                         │
│  Pilihan:                               │
│  ○ Soft Delete (Archive)                │
│  ○ Hard Delete (Permanen)               │
│                                         │
│  [Batal]  [Hapus]                       │
└─────────────────────────────────────────┘
```

**Task Breakdown**:
1. Add delete button di table
2. Create confirmation dialog component
3. Implement soft delete option
4. Create API endpoint DELETE `/api/admin/students/[nisn]`
5. Implement Google Apps Script deleteStudent function
6. Handle cascade delete (grades, GS logs)
7. Add loading state
8. Refresh table after delete
9. Test delete scenarios

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-011, SIGMA-009

---

### SIGMA-015: Import Students from CSV

**User Story**:  
Sebagai **admin**, saya ingin **import data murid dari file CSV** agar **saya dapat tambah banyak murid sekaligus dengan cepat**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/students/import` tersedia
- [ ] CSV file upload dengan drag & drop
- [ ] CSV template download button
- [ ] Preview data sebelum import
- [ ] Validation untuk setiap row
- [ ] Show errors untuk invalid rows
- [ ] Option: Skip invalid rows atau Cancel all
- [ ] Progress bar saat import
- [ ] Summary report: X success, Y failed
- [ ] Download error report as CSV

**CSV Template Format**:
```csv
NISN,Nama Lengkap,Email,Kelas,Semester Aktif
0087595483,AHMAD DARMAWAN,ahmad@school.com,11_P09,2
0087595484,BUDI SANTOSO,budi@school.com,11_P09,2
```

**Import Flow**:
```
1. Upload CSV
2. Parse & Validate
3. Preview Table (show valid/invalid)
4. Confirm Import
5. Process (with progress bar)
6. Show Summary Report
7. Download Error Report (if any)
```

**Task Breakdown**:
1. Install papaparse library
2. Create import page
3. Implement file upload dengan drag & drop
4. Parse CSV dengan papaparse
5. Validate each row
6. Create preview table
7. Implement bulk create API
8. Add progress tracking
9. Generate summary report
10. Generate error CSV for failed rows
11. Test with large file (1000+ rows)

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 3.5 hari  
**Dependencies**: SIGMA-012

---

### SIGMA-016: Student Detail View

**User Story**:  
Sebagai **admin**, saya ingin **melihat detail lengkap murid** agar **saya dapat review semua informasi murid di satu halaman**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/students/[nisn]` tersedia
- [ ] Menampilkan profile info (NISN, Nama, Email, Kelas)
- [ ] Menampilkan summary nilai (per semester)
- [ ] Menampilkan Golden Star balance
- [ ] Menampilkan history GS transactions
- [ ] Menampilkan nilai per bab (collapsible)
- [ ] Edit button → redirect ke edit page
- [ ] Delete button → trigger delete flow
- [ ] Print/Export button

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  [← Kembali]           [Edit] [Delete] [Export]     │
├─────────────────────────────────────────────────────┤
│  Profile                                            │
│  NISN: 0087595483                                   │
│  Nama: AHMAD DARMAWAN                               │
│  Email: ahmad@school.com                            │
│  Kelas: 11_P09                                      │
│  Semester Aktif: 2                                  │
├─────────────────────────────────────────────────────┤
│  Akademik Summary                                   │
│  Nilai Rapor S1: 85                                │
│  Nilai Rapor S2: 76.5                              │
├─────────────────────────────────────────────────────┤
│  Golden Star                                        │
│  Total Dapat: 6                                     │
│  Total Pakai: 2                                     │
│  Saldo: 4                                           │
├─────────────────────────────────────────────────────┤
│  History Nilai per Bab  [Expand All]                │
│  > Bab 1 - Semester 2                               │
│  > Bab 2 - Semester 2                               │
└─────────────────────────────────────────────────────┘
```

**Task Breakdown**:
1. Create detail page
2. Fetch student data dengan semua related info
3. Design profile card
4. Create akademik summary section
5. Create GS balance section
6. Create collapsible history per bab
7. Add action buttons (Edit, Delete, Export)
8. Implement PDF export
9. Test with various data scenarios

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: SIGMA-011

---

## Definition of Done - EPIC-3

**Critical Requirements**:
- [x] Admin dapat view all students dalam table
- [x] Admin dapat add new student via form
- [x] Admin dapat edit student data
- [x] Admin dapat delete student dengan confirmation
- [x] Admin dapat import students dari CSV
- [x] Admin dapat view student detail lengkap
- [x] All CRUD operations ter-log di API_LOGS
- [x] Form validation berfungsi dengan baik
- [x] Error handling clear dan informative
- [x] Tests passing untuk CRUD operations
- [x] Google Sheets terupdate setiap ada changes
- [x] Code review completed

---

# 📝 EPIC-4: Grade Input System

**Priority**: High  
**Business Value**: Admin dapat input nilai via web  
**Story Points**: 34  
**Sprint**: Sprint 2-3

## User Stories

### SIGMA-017: Individual Grade Input Form

**User Story**:  
Sebagai **admin**, saya ingin **input nilai untuk satu murid** agar **saya dapat update nilai murid secara targeted**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/grades/student/[nisn]` tersedia
- [ ] Menampilkan nama murid dan info kelas
- [ ] Form organize by Bab (collapsible sections)
- [ ] Input fields: Tugas 1-N, UH, UAS per bab
- [ ] Semester selector (S1/S2)
- [ ] Auto-calculate nilai rata-rata saat input
- [ ] Save button (save all changes)
- [ ] Save & Next button (save + next student)
- [ ] Validation: nilai 0-100
- [ ] Show unsaved changes warning

**Form Layout**:
```
┌──────────────────────────────────────────────┐
│  Input Nilai: AHMAD DARMAWAN (11_P09)        │
│  Semester: [Semester 2 ▼]                    │
├──────────────────────────────────────────────┤
│  ▼ Bab 1: Sel                                │
│    Tugas 1: [___] Tugas 2: [___]            │
│    Tugas 3: [___] Tugas 4: [___]            │
│    UH Bab 1: [___]                           │
│    Rata-rata: 87.5 (auto-calculated)         │
│                                              │
│  ▼ Bab 2: Jaringan Tumbuhan                  │
│    Tugas 1: [___] Tugas 2: [___]            │
│    ...                                       │
│                                              │
│  [Batal] [Simpan] [Simpan & Selanjutnya]    │
└──────────────────────────────────────────────┘
```

**Task Breakdown**:
1. Create grade input page
2. Fetch student data
3. Implement semester selector
4. Create collapsible bab sections
5. Implement input fields dengan validation
6. Add auto-calculation for rata-rata
7. Create API endpoint PUT `/api/admin/grades/[nisn]`
8. Implement Google Apps Script updateGrade
9. Add unsaved changes warning
10. Test calculation accuracy

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: SIGMA-009

---

### SIGMA-018: Bulk Grade Input Table View

**User Story**:  
Sebagai **admin**, saya ingin **input nilai untuk satu topik ke banyak murid sekaligus** agar **saya dapat input nilai satu batch tugas dengan cepat**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/grades/bulk` tersedia
- [ ] Filter: Kelas, Semester, Bab, Tugas
- [ ] Table: Nama Murid (rows) x Nilai (column)
- [ ] Inline editing: click cell to edit
- [ ] Auto-save on blur atau manual save
- [ ] Validation: 0-100 per cell
- [ ] Highlight unsaved cells
- [ ] Keyboard navigation (Tab, Enter)
- [ ] Copy-paste support from Excel
- [ ] Undo/Redo functionality

**Table View**:
```
Filter: Kelas [11_P09 ▼] Semester [2 ▼] Bab [1 ▼] Tugas [1 ▼]

┌────────┬────────────────────┬───────┬────────┐
│ NISN   │ Nama               │ Nilai │ Status │
├────────┼────────────────────┼───────┼────────┤
│ 008759 │ AHMAD DARMAWAN     │ [95]  │ ✓      │
│ 008760 │ BUDI SANTOSO       │ [87]  │ •      │ (unsaved)
│ 008761 │ CITRA DEWI         │ [__]  │        │
└────────┴────────────────────┴───────┴────────┘

[Simpan Semua] [Undo] [Redo]
```

**Task Breakdown**:
1. Create bulk input page
2. Implement filters (kelas, semester, bab, tugas)
3. Create editable table component
4. Implement inline editing
5. Add keyboard navigation
6. Implement copy-paste from Excel
7. Add undo/redo with state management
8. Create bulk update API
9. Highlight unsaved changes
10. Test with 50+ students

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 4 hari  
**Dependencies**: SIGMA-009

---

### SIGMA-019: Import Grades from CSV

**User Story**:  
Sebagai **admin**, saya ingin **import nilai dari CSV** agar **saya dapat batch input nilai dari external source**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/grades/import` tersedia
- [ ] CSV template download (with sample data)
- [ ] File upload dengan validation
- [ ] Preview table sebelum import
- [ ] Validation: NISN exist, nilai valid range
- [ ] Show errors dengan highlight
- [ ] Option to skip invalid rows
- [ ] Progress bar untuk import
- [ ] Summary: success/failed counts
- [ ] Download error report

**CSV Template**:
```csv
NISN,Nama,Tugas 1 Bab 1 S2,Tugas 2 Bab 1 S2,UH Bab 1 S2
0087595483,AHMAD DARMAWAN,95,90,88
0087595484,BUDI SANTOSO,87,92,85
```

**Task Breakdown**:
1. Create import page
2. Generate CSV template
3. Implement file upload
4. Parse CSV dengan papaparse
5. Validate data (NISN, nilai range)
6. Create preview table dengan error highlighting
7. Implement bulk grade update API
8. Add progress tracking
9. Generate summary report
10. Generate error CSV
11. Test with large dataset

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: SIGMA-017

---

### SIGMA-020: Grade History & Audit Log

**User Story**:  
Sebagai **admin**, saya ingin **melihat history perubahan nilai** agar **saya dapat track siapa mengubah nilai dan kapan**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/grades/history` tersedia
- [ ] Table: Timestamp, Admin, Student, Subject, Old Value, New Value
- [ ] Filter by student, admin, date range
- [ ] Search by NISN atau nama
- [ ] Pagination
- [ ] Export history to CSV
- [ ] Restore previous value button (optional)

**Task Breakdown**:
1. Enhance API_LOGS untuk capture old/new value
2. Create history page
3. Fetch history dari API_LOGS
4. Implement filters
5. Add search functionality
6. Create history table
7. Add export to CSV
8. Test history logging

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-010

---

### SIGMA-021: Grade Statistics Dashboard

**User Story**:  
Sebagai **admin**, saya ingin **melihat statistik nilai per kelas** agar **saya dapat analisis performa kelas**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/grades/stats` tersedia
- [ ] Filter: Kelas, Semester, Bab
- [ ] Chart: Distribusi nilai (0-59, 60-69, 70-79, 80-89, 90-100)
- [ ] Chart: Rata-rata per bab
- [ ] Table: Top 10 students
- [ ] Table: Bottom 10 students (struggling)
- [ ] Summary cards: Rata-rata kelas, Nilai tertinggi, Terendah
- [ ] Export stats to PDF

**Task Breakdown**:
1. Create stats page
2. Implement filters
3. Fetch aggregated data
4. Create distribution chart
5. Create rata-rata per bab chart
6. Create top/bottom 10 tables
7. Add summary cards
8. Implement PDF export
9. Test calculations

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: SIGMA-017

---

### SIGMA-022: Auto-Calculate Nilai Rapor

**User Story**:  
Sebagai **system**, saya ingin **auto-calculate nilai rapor** agar **nilai rapor selalu terupdate sesuai formula saat ada perubahan**.

**Acceptance Criteria**:
- [ ] Trigger calculation setiap ada update nilai
- [ ] Formula: Rata Harian (90%) + UAS Final (10%)
- [ ] Update NILAI RAPOR di TOPIC_GRADES tab
- [ ] Log calculation di API_LOGS
- [ ] Handle edge cases (nilai kosong, null)
- [ ] Validation: result 0-100

**Formula**:
```
Rata Harian = (Σ Tugas + 2 × UH) / (N Tugas + 2)
Nilai Rapor = (Rata Harian × 0.9) + (UAS Final × 0.1)
```

**Task Breakdown**:
1. Implement calculation function di Google Apps Script
2. Trigger calculation on grade update
3. Update NILAI RAPOR column
4. Add validation for edge cases
5. Log calculations
6. Test various scenarios
7. Test with null/empty values

**Technical Domain**: Backend  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-017, SIGMA-009

---

## Definition of Done - EPIC-4

**Critical Requirements**:
- [x] Admin dapat input nilai individual per murid
- [x] Admin dapat bulk input nilai per topik
- [x] Admin dapat import nilai dari CSV
- [x] Admin dapat view history perubahan nilai
- [x] Admin dapat view statistik nilai per kelas
- [x] Nilai rapor auto-calculated sesuai formula
- [x] All grade changes ter-log di API_LOGS
- [x] Validation berfungsi (0-100 range)
- [x] Google Sheets terupdate real-time
- [x] Tests passing untuk calculation accuracy
- [x] Code review completed

---

# ⭐ EPIC-5: Golden Star Management

**Priority**: High  
**Business Value**: Admin dapat manage Golden Star reward  
**Story Points**: 21  
**Sprint**: Sprint 3

## User Stories

### SIGMA-023: Add Golden Star Form

**User Story**:  
Sebagai **admin**, saya ingin **memberikan Golden Star ke murid** agar **saya dapat reward murid yang berprestasi**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/golden-stars/add` tersedia
- [ ] Select student (autocomplete search)
- [ ] Input: Points (1-10)
- [ ] Input: Reason (required, min 10 chars)
- [ ] Semester selector
- [ ] Preview current GS balance
- [ ] Submit button dengan loading
- [ ] Success message dengan updated balance
- [ ] Option: Add to multiple students at once

**Form Layout**:
```
┌──────────────────────────────────────────┐
│  Tambah Golden Star                       │
├──────────────────────────────────────────┤
│  Murid *                                 │
│  [Search nama atau NISN...]              │
│  → AHMAD DARMAWAN (11_P09)               │
│    Saldo saat ini: 4 GS                  │
│                                          │
│  Jumlah GS *                             │
│  [___] (1-10)                            │
│                                          │
│  Alasan *                                │
│  [________________________]              │
│  Min. 10 karakter                        │
│                                          │
│  Semester *                              │
│  ○ Semester 1    ○ Semester 2           │
│                                          │
│  Preview:                                │
│  Saldo setelah: 4 + 2 = 6 GS            │
│                                          │
│  □ Tambahkan ke beberapa murid          │
│                                          │
│  [Batal]  [Tambah GS]                   │
└──────────────────────────────────────────┘
```

**Task Breakdown**:
1. Create add GS page
2. Implement student autocomplete search
3. Fetch current GS balance
4. Implement form validation
5. Create API endpoint POST `/api/admin/golden-stars`
6. Implement Google Apps Script addGoldenStar
7. Update GOLDEN_STAR_LOG tab
8. Add success notification
9. Implement multi-student option
10. Test GS addition

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: SIGMA-009

---

### SIGMA-024: Golden Star History & Transactions

**User Story**:  
Sebagai **admin**, saya ingin **melihat history Golden Star** agar **saya dapat track semua transaksi GS**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/golden-stars/history` tersedia
- [ ] Table: Timestamp, Student, Type (Earn/Use), Points, Reason, Balance
- [ ] Filter: Student, Type, Date range, Semester
- [ ] Search by NISN atau nama
- [ ] Pagination: 50 rows per page
- [ ] Export to CSV
- [ ] Color coding: Green (earn), Red (use)
- [ ] Show running balance

**Table View**:
```
┌─────────┬────────────┬──────┬────────┬────────────┬────────┐
│ Date    │ Student    │ Type │ Points │ Reason     │Balance │
├─────────┼────────────┼──────┼────────┼────────────┼────────┤
│ 10/01   │ AHMAD D.   │ Earn │ +2     │ Tugas 1 OK │ 6      │
│ 09/28   │ AHMAD D.   │ Use  │ -2     │ Skip UH B1 │ 4      │
│ 09/25   │ AHMAD D.   │ Earn │ +1     │ Tugas 4    │ 6      │
└─────────┴────────────┴──────┴────────┴────────────┴────────┘
```

**Task Breakdown**:
1. Create history page
2. Fetch GS transactions dari API_LOGS + GOLDEN_STAR_LOG
3. Implement filters
4. Create transaction table
5. Add color coding
6. Calculate running balance
7. Add export to CSV
8. Test with large dataset

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: SIGMA-023, SIGMA-010

---

### SIGMA-025: Bulk Golden Star Adjustment

**User Story**:  
Sebagai **admin**, saya ingin **adjust GS untuk banyak murid sekaligus** agar **saya dapat koreksi atau bonus GS secara batch**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/golden-stars/bulk-adjust` tersedia
- [ ] Filter students: by kelas atau select all
- [ ] Table: show current GS balance per student
- [ ] Adjustment type: Add (+) or Deduct (-)
- [ ] Input: Points dan Reason (apply to all selected)
- [ ] Preview changes before confirm
- [ ] Confirmation dialog
- [ ] Progress bar untuk bulk operation
- [ ] Summary: X students updated

**UI Flow**:
```
1. Select Students
   ┌─────────────────────────────────┐
   │ Filter: [11_P09 ▼]              │
   │ □ Select All                    │
   │ ☑ AHMAD DARMAWAN (Saldo: 4)    │
   │ ☑ BUDI SANTOSO (Saldo: 7)      │
   │ ...                             │
   └─────────────────────────────────┘

2. Adjustment Details
   Type: ○ Add  ○ Deduct
   Points: [2]
   Reason: [Bonus akhir bulan]

3. Preview
   AHMAD: 4 + 2 = 6
   BUDI: 7 + 2 = 9

4. Confirm → Execute
```

**Task Breakdown**:
1. Create bulk adjust page
2. Implement student selection dengan filter
3. Create adjustment form
4. Implement preview calculation
5. Create confirmation dialog
6. Implement bulk update API
7. Add progress tracking
8. Show summary result
9. Test with many students

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: SIGMA-023

---

### SIGMA-026: Golden Star Redemption Management

**User Story**:  
Sebagai **admin**, saya ingin **manage redemption GS** agar **saya dapat approve/reject permintaan redeem GS dari murid**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/golden-stars/redemptions` tersedia
- [ ] Table: Pending redemptions (student, type, GS cost, status)
- [ ] Actions: Approve, Reject
- [ ] Approval: auto-deduct GS, mark as used
- [ ] Rejection: return GS, add note
- [ ] History of approved/rejected redemptions
- [ ] Filter by status, student, type

**Redemption Types**:
- Skip UH (cost: based on KURS GS)
- Skip UAS (cost: based on KURS GS)

**Note**: Untuk MVP, redemption bisa manual via admin (tidak perlu student request flow dulu)

**Task Breakdown**:
1. Create redemptions page
2. Implement pending redemptions table
3. Add approve/reject actions
4. Update GS balance on approval
5. Mark GS as "Terpakai" di log
6. Add rejection reason input
7. Create history view
8. Test redemption flow

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: SIGMA-023

---

### SIGMA-027: Golden Star Statistics Dashboard

**User Story**:  
Sebagai **admin**, saya ingin **melihat statistik Golden Star** agar **saya dapat analisis efektivitas reward system**.

**Acceptance Criteria**:
- [ ] Page `/admin/dashboard/golden-stars/stats` tersedia
- [ ] Summary cards: Total GS distributed, Total redeemed, Active balance
- [ ] Chart: GS distribution per kelas
- [ ] Chart: GS earned vs used trend over time
- [ ] Table: Top GS earners (leaderboard)
- [ ] Table: Most frequent redeemers
- [ ] Filter: Semester, Date range
- [ ] Export stats to PDF

**Task Breakdown**:
1. Create stats page
2. Calculate aggregated GS data
3. Create summary cards
4. Implement distribution chart
5. Implement trend chart
6. Create leaderboard tables
7. Add filters
8. Implement PDF export
9. Test calculations

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: SIGMA-023, SIGMA-024

---

## Definition of Done - EPIC-5

**Critical Requirements**:
- [x] Admin dapat add Golden Star ke murid
- [x] Admin dapat view history GS transactions
- [x] Admin dapat bulk adjust GS untuk banyak murid
- [x] Admin dapat manage GS redemptions
- [x] Admin dapat view statistik GS
- [x] All GS operations ter-log
- [x] GOLDEN_STAR_LOG tab terupdate correctly
- [x] Balance calculations accurate
- [x] Tests passing untuk GS operations
- [x] Code review completed

---


# 🎨 EPIC-6: Student Dashboard Enhancement

**Priority**: Medium  
**Business Value**: Improve UX untuk murid  
**Story Points**: 21  
**Sprint**: Sprint 4

## User Stories

### SIGMA-028: Improve Dashboard Responsive Layout

**User Story**:  
Sebagai **murid**, saya ingin **dashboard responsive di semua device** agar **saya dapat akses dashboard dari HP atau tablet dengan nyaman**.

**Acceptance Criteria**:
- [ ] Mobile-first responsive design
- [ ] Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- [ ] Touch-friendly buttons (min 44x44px)
- [ ] Readable fonts (min 16px body)
- [ ] Collapsible sections untuk hemat space di mobile
- [ ] Horizontal scroll untuk wide tables
- [ ] Bottom navigation untuk mobile (optional)
- [ ] Test di real devices (iOS, Android)

**Responsive Behavior**:
```
Mobile (<640px):
- Single column layout
- Stacked cards
- Hamburger menu
- Bottom nav bar
- Collapsible sections

Tablet (640-1024px):
- Two column layout
- Side-by-side cards
- Visible sidebar
- Compact charts

Desktop (>1024px):
- Multi-column layout
- Full sidebar
- Expanded charts
- More data density
```

**Task Breakdown**:
1. Audit existing responsive issues
2. Update Tailwind breakpoints
3. Refactor dashboard layout untuk mobile-first
4. Update cards untuk stacking
5. Implement collapsible sections
6. Update header untuk mobile
7. Add bottom navigation (optional)
8. Test di berbagai devices
9. Fix any layout bugs

**Technical Domain**: UI/UX Web, Frontend Web  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: None

---

### SIGMA-029: Enhanced Loading States & Skeletons

**User Story**:  
Sebagai **murid**, saya ingin **loading indicators yang informatif** agar **saya tahu sistem sedang fetch data**.

**Acceptance Criteria**:
- [ ] Skeleton loaders untuk semua async content
- [ ] Skeleton match actual content shape
- [ ] Spinner untuk button actions
- [ ] Progress bar untuk large data loads
- [ ] Loading text indicators ("Memuat data...")
- [ ] Smooth fade-in animation saat data loaded
- [ ] Timeout handling (show error after 30s)

**Skeleton Components**:
```typescript
// RankCardSkeleton
<Card>
  <Skeleton className="h-4 w-24 mb-2" /> // Rank text
  <Skeleton className="h-8 w-32" />      // Score
  <Skeleton className="h-4 w-40" />      // Description
</Card>

// LeaderboardSkeleton
<Table>
  {Array(10).fill(0).map((_, i) => (
    <tr key={i}>
      <td><Skeleton className="h-4 w-8" /></td>   // Rank
      <td><Skeleton className="h-4 w-32" /></td>  // Name
      <td><Skeleton className="h-4 w-16" /></td>  // GS
    </tr>
  ))}
</Table>
```

**Task Breakdown**:
1. Audit all loading states
2. Create skeleton components
3. Replace generic Skeleton dengan custom shapes
4. Add fade-in animations
5. Implement timeout handling
6. Add loading text indicators
7. Test loading experience
8. Optimize skeleton performance

**Technical Domain**: UI/UX Web, Frontend Web  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: None

---

### SIGMA-030: Error Handling & Empty States

**User Story**:  
Sebagai **murid**, saya ingin **error messages yang jelas** agar **saya tahu apa yang salah dan bagaimana memperbaikinya**.

**Acceptance Criteria**:
- [ ] Friendly error messages (bukan technical jargon)
- [ ] Actionable error solutions (retry button, contact admin)
- [ ] Error illustrations atau icons
- [ ] Network error handling dengan offline indicator
- [ ] Empty states untuk no data scenarios
- [ ] Empty state illustrations
- [ ] Call-to-action di empty states
- [ ] Error boundary untuk catch React errors

**Error Messages**:
```
Network Error:
┌────────────────────────────────┐
│  🌐 Tidak dapat terhubung       │
│                                │
│  Periksa koneksi internet      │
│  Anda dan coba lagi.           │
│                                │
│  [Coba Lagi]                   │
└────────────────────────────────┘

No Data:
┌────────────────────────────────┐
│  📭 Belum ada data nilai        │
│                                │
│  Guru belum memasukkan nilai   │
│  untuk semester ini.           │
│                                │
│  [Refresh]                     │
└────────────────────────────────┘

Server Error:
┌────────────────────────────────┐
│  ⚠️  Terjadi kesalahan          │
│                                │
│  Mohon coba beberapa saat      │
│  lagi atau hubungi admin.      │
│                                │
│  [Hubungi Admin] [Coba Lagi]  │
└────────────────────────────────┘
```

**Task Breakdown**:
1. Create error message component
2. Create empty state component
3. Add error illustrations
4. Implement error boundary
5. Add network status detector
6. Replace generic errors dengan friendly messages
7. Add retry functionality
8. Test error scenarios
9. Test offline behavior

**Technical Domain**: UI/UX Web, Frontend Web  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: None

---

### SIGMA-031: Enhanced Charts & Data Visualization

**User Story**:  
Sebagai **murid**, saya ingin **visualisasi data yang lebih informatif** agar **saya dapat pahami performa akademik saya dengan mudah**.

**Acceptance Criteria**:
- [ ] Improve Academic Growth Chart dengan tooltips
- [ ] Add trend lines (naik/turun)
- [ ] Color coding: green (good), yellow (ok), red (needs improvement)
- [ ] Interactive charts (hover, click for detail)
- [ ] Comparison view: My score vs Class average
- [ ] Progress indicators untuk setiap bab
- [ ] Goal setting: target nilai (optional)
- [ ] Responsive charts (adapt to screen size)

**Enhanced Chart Features**:
```
Academic Growth Chart:
- Line chart dengan data points
- Tooltip on hover: "Bab 1: 87 (Rata kelas: 82)"
- Trend indicator: ↗️ +5 dari bab sebelumnya
- Color zones: >85 green, 70-85 yellow, <70 red
- Toggle: Show/Hide class average

Progress by Chapter:
┌─────────────────────────────────┐
│ Bab 1: Sel            ███████░ 87│
│ Bab 2: Jaringan       ██████░░ 76│
│ Bab 3: Genetika       ████░░░░ 55│
└─────────────────────────────────┘
```

**Task Breakdown**:
1. Enhance existing charts dengan Recharts features
2. Add tooltips dengan custom content
3. Implement color zones
4. Add trend indicators
5. Create progress bars component
6. Add comparison toggle
7. Make charts responsive
8. Test chart performance
9. Test chart accessibility

**Technical Domain**: Frontend Web  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: None

---

### SIGMA-032: Add Notifications & Alerts

**User Story**:  
Sebagai **murid**, saya ingin **notifikasi untuk updates penting** agar **saya tahu kapan ada nilai baru atau GS diterima**.

**Acceptance Criteria**:
- [ ] Notification badge di header (jika ada update baru)
- [ ] Notification panel dengan list updates
- [ ] Notification types: Nilai baru, GS diterima, Announcement
- [ ] Mark as read functionality
- [ ] Timestamp untuk setiap notification
- [ ] Auto-dismiss old notifications (>7 days)
- [ ] Sound/vibration alert (optional)
- [ ] Email notification (future enhancement)

**Notification Panel**:
```
┌────────────────────────────────────┐
│  🔔 Notifikasi (3)                 │
├────────────────────────────────────┤
│  📝 Nilai Tugas 1 Bab 2 sudah      │
│     tersedia: 95                   │
│     2 jam yang lalu                │
│                                    │
│  ⭐ Anda mendapat 2 Golden Star    │
│     Alasan: Tugas 1 sempurna       │
│     1 hari yang lalu               │
│                                    │
│  📢 Pengumuman: Ulangan Harian     │
│     Bab 2 tanggal 5 Oktober        │
│     3 hari yang lalu               │
└────────────────────────────────────┘
```

**Task Breakdown**:
1. Design notification data structure
2. Create notification API endpoint
3. Implement notification panel component
4. Add notification badge counter
5. Implement mark as read
6. Add timestamp formatting
7. Implement auto-dismiss logic
8. Add notification sound (optional)
9. Test notification flow

**Technical Domain**: Frontend Web, Backend  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: SIGMA-010

---

### SIGMA-033: Print & Export Features

**User Story**:  
Sebagai **murid**, saya ingin **export atau print dashboard** agar **saya dapat share dengan orang tua atau simpan sebagai backup**.

**Acceptance Criteria**:
- [ ] Print button di dashboard
- [ ] Print-optimized layout (hide buttons, optimize spacing)
- [ ] Export to PDF functionality
- [ ] Include: Profile, Nilai summary, GS balance, History nilai
- [ ] Clean formatting untuk print/PDF
- [ ] Option to select what to include
- [ ] School logo di header export
- [ ] Footer dengan timestamp generated

**Print Layout**:
```
┌─────────────────────────────────────────┐
│  [Logo Sekolah]        SIGMA            │
│  Laporan Akademik Semester 2            │
│  Generated: 01 Oktober 2026             │
├─────────────────────────────────────────┤
│  Profil Murid                           │
│  Nama: AHMAD DARMAWAN                   │
│  NISN: 0087595483                       │
│  Kelas: 11_P09                          │
├─────────────────────────────────────────┤
│  Summary Nilai                          │
│  Nilai Rapor: 76.5                      │
│  Ranking: 15 dari 36                    │
├─────────────────────────────────────────┤
│  Golden Star                            │
│  Saldo: 4 GS                            │
│  Total Dapat: 6 GS                      │
├─────────────────────────────────────────┤
│  Detail Nilai per Bab                   │
│  [Table]                                │
└─────────────────────────────────────────┘
```

**Task Breakdown**:
1. Create print stylesheet
2. Implement print button
3. Hide non-printable elements
4. Optimize layout untuk print
5. Install PDF generation library (jsPDF or react-pdf)
6. Implement PDF export function
7. Add options dialog (select sections)
8. Add school logo to export
9. Test print preview
10. Test PDF generation

**Technical Domain**: Frontend Web  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: None

---

## Definition of Done - EPIC-6

**Critical Requirements**:
- [x] Dashboard responsive di mobile/tablet/desktop
- [x] Loading states dengan skeleton loaders
- [x] Error handling dengan friendly messages
- [x] Empty states untuk no data scenarios
- [x] Enhanced charts dengan tooltips dan trends
- [x] Notification system berfungsi
- [x] Print & export features working
- [x] Tests passing untuk UI components
- [x] Accessibility tests passing
- [x] Code review completed

---

# ⚡ EPIC-7: Real-time Data & Performance

**Priority**: Medium  
**Business Value**: Improve data freshness dan system performance  
**Story Points**: 13  
**Sprint**: Sprint 5

## User Stories

### SIGMA-034: Reduce Cache TTL for Admin Changes

**User Story**:  
Sebagai **murid**, saya ingin **melihat data terbaru dalam <1 menit setelah guru update** agar **saya tidak perlu tunggu lama untuk refresh**.

**Acceptance Criteria**:
- [ ] Cache TTL reduced dari 5 menit ke 1 menit
- [ ] Cache invalidation on write operations
- [ ] Cache key include timestamp untuk versioning
- [ ] Stale-while-revalidate strategy
- [ ] Background refresh untuk active users
- [ ] Show "Data diupdate X detik lalu" indicator

**Implementation Strategy**:
```typescript
// Current: 5 minutes TTL
const studentCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});

// New: 1 minute TTL + invalidation
const studentCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 1, // 1 minute
  allowStale: true,
  updateAgeOnGet: true
});

// Invalidate on write
export async function invalidateStudentCache(nisn: string) {
  const keys = [`student:*:${nisn}:*`];
  keys.forEach(key => studentCache.delete(key));
}

// Background refresh
setInterval(async () => {
  if (isUserActive) {
    await fetchStudentData(email, nisn, semester);
  }
}, 30000); // Every 30 seconds
```

**Task Breakdown**:
1. Update cache TTL configuration
2. Implement cache invalidation function
3. Call invalidation after write operations
4. Add "last updated" timestamp to responses
5. Implement background refresh logic
6. Add active user detection
7. Show update indicator di UI
8. Test cache behavior
9. Monitor cache hit rate

**Technical Domain**: Backend, Performance  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: None

---

### SIGMA-035: Optimize Google Apps Script Performance

**User Story**:  
Sebagai **developer**, saya ingin **Google Apps Script lebih cepat** agar **API response time < 2 detik**.

**Acceptance Criteria**:
- [ ] Response time P95 < 2 seconds
- [ ] Batch operations untuk multiple updates
- [ ] Minimize Sheets API calls
- [ ] Cache frequently accessed data
- [ ] Use getRangeValues instead of loop
- [ ] Async processing untuk heavy operations
- [ ] Add performance logging

**Optimization Techniques**:
```javascript
// ❌ SLOW: Loop individual cells
for (let i = 0; i < 100; i++) {
  sheet.getRange(i + 1, 1).setValue(data[i]);
}

// ✅ FAST: Batch update
const values = data.map(d => [d.value]);
sheet.getRange(1, 1, data.length, 1).setValues(values);

// ❌ SLOW: Multiple getRange calls
const name = sheet.getRange('B2').getValue();
const email = sheet.getRange('D2').getValue();
const kelas = sheet.getRange('C2').getValue();

// ✅ FAST: Single getRange call
const data = sheet.getRange('B2:D2').getValues()[0];
const [name, kelas, email] = data;

// Cache frequently accessed data
const cache = CacheService.getScriptCache();
const cachedData = cache.get('students_list');
if (cachedData) {
  return JSON.parse(cachedData);
}
// ... fetch from sheet
cache.put('students_list', JSON.stringify(data), 300); // 5 min
```

**Task Breakdown**:
1. Audit current Apps Script performance
2. Identify slow operations
3. Refactor to use batch operations
4. Implement Apps Script caching (CacheService)
5. Minimize API calls
6. Add performance logging
7. Test performance improvements
8. Monitor execution time
9. Document optimization guidelines

**Technical Domain**: Backend (Google Apps Script), Performance  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: None

---

### SIGMA-036: Add Request Debouncing & Throttling

**User Story**:  
Sebagai **developer**, saya ingin **prevent excessive API calls** agar **tidak waste quota dan bandwidth**.

**Acceptance Criteria**:
- [ ] Debounce search inputs (300ms delay)
- [ ] Throttle auto-refresh requests
- [ ] Prevent duplicate simultaneous requests
- [ ] Request deduplication untuk same params
- [ ] Show "Request in progress" indicator
- [ ] Cancel pending requests on unmount
- [ ] Rate limiting per user (client-side)

**Implementation**:
```typescript
// Debounce search
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (query) => {
    fetchStudents(query);
  },
  300
);

// Throttle refresh
import { useThrottle } from '@/hooks/use-throttle';

const throttledRefresh = useThrottle(
  () => fetchStudentData(),
  5000 // Max once per 5 seconds
);

// Prevent duplicate requests
const pendingRequests = new Map();

async function fetchWithDedup(key, fetcher) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = fetcher();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
}
```

**Task Breakdown**:
1. Install debounce/throttle utilities
2. Implement debounce untuk search inputs
3. Implement throttle untuk auto-refresh
4. Create request deduplication utility
5. Add loading indicators
6. Implement request cancellation
7. Test debounce/throttle behavior
8. Monitor API call reduction

**Technical Domain**: Frontend Web, Performance  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: None

---

### SIGMA-037: Implement Progressive Data Loading

**User Story**:  
Sebagai **murid**, saya ingin **dashboard load lebih cepat** agar **saya tidak tunggu lama untuk lihat data penting**.

**Acceptance Criteria**:
- [ ] Load critical data first (profile, current rank)
- [ ] Lazy load non-critical sections (history, charts)
- [ ] Infinite scroll untuk long lists
- [ ] Virtualized tables untuk large datasets
- [ ] Image lazy loading
- [ ] Code splitting untuk admin routes
- [ ] Prefetch next page data

**Progressive Loading Strategy**:
```
Priority 1 (Load immediately):
- Student profile
- Current rank & score
- GS balance

Priority 2 (Load after 1s):
- Leaderboard top 10
- Summary charts

Priority 3 (Load on scroll):
- Detailed grade history
- Full GS transaction log

Priority 4 (Load on demand):
- Export features
- Settings
```

**Task Breakdown**:
1. Identify critical vs non-critical data
2. Implement priority-based loading
3. Add lazy loading untuk heavy components
4. Implement infinite scroll untuk lists
5. Install virtualization library (@tanstack/react-virtual)
6. Implement virtualized tables
7. Add code splitting dengan dynamic imports
8. Test loading performance
9. Measure Core Web Vitals (LCP, FID, CLS)

**Technical Domain**: Frontend Web, Performance  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: None

---

### SIGMA-038: Add Performance Monitoring

**User Story**:  
Sebagai **developer**, saya ingin **monitor application performance** agar **saya dapat identify dan fix bottlenecks**.

**Acceptance Criteria**:
- [ ] Vercel Analytics configured
- [ ] Web Vitals tracking (LCP, FID, CLS, TTFB)
- [ ] API response time tracking
- [ ] Error rate monitoring
- [ ] Custom performance marks
- [ ] Performance dashboard
- [ ] Alerting untuk performance degradation

**Monitoring Setup**:
```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to Vercel Analytics
  if (window.va) {
    window.va('track', metric.name, { value: metric.value });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// API performance
const startTime = performance.now();
const response = await fetch('/api/students');
const duration = performance.now() - startTime;

// Log to monitoring
trackMetric('api_response_time', duration, {
  endpoint: '/api/students',
  status: response.status
});
```

**Task Breakdown**:
1. Setup Vercel Analytics
2. Implement Web Vitals tracking
3. Add API response time tracking
4. Create performance dashboard
5. Setup alerting rules
6. Add custom performance marks
7. Monitor bundle size
8. Create performance budget
9. Document performance guidelines

**Technical Domain**: Performance, Monitoring  
**Estimasi Pengerjaan**: 1.5 hari  
**Dependencies**: None

---

## Definition of Done - EPIC-7

**Critical Requirements**:
- [x] Cache TTL reduced ke 1 menit
- [x] Cache invalidation berfungsi
- [x] Google Apps Script optimized (response < 2s P95)
- [x] Debouncing & throttling implemented
- [x] Progressive loading working
- [x] Performance monitoring active
- [x] Core Web Vitals meet targets (LCP <2.5s, FID <100ms, CLS <0.1)
- [x] API response time < 2s P95
- [x] Bundle size optimized
- [x] Code review completed

---

# 🧪 EPIC-8: Testing & Quality Assurance

**Priority**: Critical  
**Business Value**: Ensure system stability dan correctness  
**Story Points**: 21  
**Sprint**: Sprint 6

## User Stories

### SIGMA-039: Unit Tests for Core Functions

**User Story**:  
Sebagai **developer**, saya ingin **unit tests untuk core functions** agar **saya confident kode saya tidak break existing functionality**.

**Acceptance Criteria**:
- [ ] Test coverage > 80% untuk core logic
- [ ] Test auth functions (generateToken, verifyToken)
- [ ] Test calculation functions (nilai rapor, GS balance)
- [ ] Test validation schemas (Zod)
- [ ] Test utility functions
- [ ] Test API helper functions
- [ ] All tests passing
- [ ] Tests run di CI/CD pipeline

**Test Framework Setup**:
```typescript
// package.json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitest/ui": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}

// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
```

**Sample Tests**:
```typescript
// lib/auth.test.ts
import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from './auth';

describe('Auth Functions', () => {
  it('should generate valid JWT token', async () => {
    const payload = { email: 'test@school.com', role: 'student' };
    const token = await generateToken(payload);
    
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('should verify valid token', async () => {
    const payload = { email: 'test@school.com', role: 'student' };
    const token = await generateToken(payload);
    const verified = await verifyToken(token);
    
    expect(verified).toBeTruthy();
    expect(verified.email).toBe('test@school.com');
    expect(verified.role).toBe('student');
  });

  it('should reject invalid token', async () => {
    const verified = await verifyToken('invalid.token.here');
    expect(verified).toBeNull();
  });
});

// lib/calculations.test.ts
describe('Nilai Calculations', () => {
  it('should calculate rata harian correctly', () => {
    const tugas = [85, 90, 88];
    const uh = 87;
    const rataHarian = calculateRataHarian(tugas, uh);
    
    // Formula: (Σ tugas + 2 × UH) / (N tugas + 2)
    const expected = (85 + 90 + 88 + 2 * 87) / 5;
    expect(rataHarian).toBe(expected);
  });

  it('should calculate nilai rapor correctly', () => {
    const rataHarian = 87;
    const uasFinal = 85;
    const nilaiRapor = calculateNilaiRapor(rataHarian, uasFinal);
    
    // Formula: rataHarian × 0.9 + uasFinal × 0.1
    const expected = rataHarian * 0.9 + uasFinal * 0.1;
    expect(nilaiRapor).toBeCloseTo(expected, 2);
  });
});
```

**Task Breakdown**:
1. Install test dependencies (Vitest, Testing Library)
2. Setup vitest.config.ts
3. Write tests untuk auth functions
4. Write tests untuk calculation functions
5. Write tests untuk validation schemas
6. Write tests untuk utility functions
7. Run tests dan fix failures
8. Generate coverage report
9. Add tests to CI/CD
10. Document testing guidelines

**Technical Domain**: Testing  
**Estimasi Pengerjaan**: 4 hari  
**Dependencies**: None

---

### SIGMA-040: Integration Tests for API Endpoints

**User Story**:  
Sebagai **developer**, saya ingin **integration tests untuk API endpoints** agar **saya ensure API behavior correct**.

**Acceptance Criteria**:
- [ ] Test all API routes (GET, POST, PUT, DELETE)
- [ ] Test authentication middleware
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test request validation
- [ ] Mock Google Apps Script responses
- [ ] All integration tests passing
- [ ] Tests run di CI/CD

**Sample Integration Tests**:
```typescript
// app/api/auth/admin/login/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/auth/admin/login', () => {
  it('should return 400 for missing email', async () => {
    const request = new Request('http://localhost/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: '12345678' })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 401 for invalid credentials', async () => {
    // Mock Google Sheets response
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, error: 'Admin not found' })
    });

    const request = new Request('http://localhost/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'wrong@school.com',
        password: '12345678'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return token for valid credentials', async () => {
    // Mock successful login
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        admin: {
          email: 'admin@school.com',
          name: 'Admin',
          passwordHash: await bcrypt.hash('password123', 12)
        }
      })
    });

    const request = new Request('http://localhost/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'password123'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('admin@school.com');
  });
});
```

**Task Breakdown**:
1. Setup integration test environment
2. Create mock utilities untuk Google Sheets
3. Write tests untuk auth endpoints
4. Write tests untuk CRUD endpoints
5. Write tests untuk middleware
6. Write tests untuk rate limiting
7. Test error scenarios
8. Run tests dan fix failures
9. Add to CI/CD pipeline

**Technical Domain**: Testing, Backend  
**Estimasi Pengerjaan**: 4 hari  
**Dependencies**: SIGMA-039

---

### SIGMA-041: End-to-End Tests for Critical User Flows

**User Story**:  
Sebagai **QA**, saya ingin **E2E tests untuk critical flows** agar **saya ensure entire system works end-to-end**.

**Acceptance Criteria**:
- [ ] E2E test untuk student login flow
- [ ] E2E test untuk admin login flow
- [ ] E2E test untuk grade input flow
- [ ] E2E test untuk GS addition flow
- [ ] E2E test untuk student CRUD flow
- [ ] Tests run di headless browser
- [ ] Screenshots on failure
- [ ] All E2E tests passing

**E2E Framework: Playwright**:
```typescript
// e2e/student-login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Student Login Flow', () => {
  test('should login successfully dengan valid credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'ahmad@school.com');
    await page.fill('input[type="password"]', '0087595483');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Should show student name
    await expect(page.locator('text=AHMAD DARMAWAN')).toBeVisible();
  });

  test('should show error dengan invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[type="email"]', 'invalid@school.com');
    await page.fill('input[type="password"]', '0000000000');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.alert-destructive')).toBeVisible();
  });
});

// e2e/admin-grade-input.spec.ts
test.describe('Admin Grade Input', () => {
  test.beforeEach(async ({ page }) => {
    // Login sebagai admin
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[type="email"]', 'admin@school.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('should input grade successfully', async ({ page }) => {
    // Navigate to grade input
    await page.click('text=Input Nilai');
    
    // Select student
    await page.fill('input[placeholder*="Search"]', 'AHMAD');
    await page.click('text=AHMAD DARMAWAN');
    
    // Input nilai
    await page.fill('input[name="tugas1"]', '95');
    await page.click('button:has-text("Simpan")');
    
    // Should show success message
    await expect(page.locator('text=Nilai berhasil disimpan')).toBeVisible();
  });
});
```

**Task Breakdown**:
1. Install Playwright
2. Setup Playwright config
3. Create E2E test utilities
4. Write student login tests
5. Write admin login tests
6. Write grade input tests
7. Write GS management tests
8. Write student CRUD tests
9. Run tests dan fix failures
10. Add to CI/CD pipeline

**Technical Domain**: Testing  
**Estimasi Pengerjaan**: 5 hari  
**Dependencies**: SIGMA-039, SIGMA-040

---

### SIGMA-042: Load Testing & Stress Testing

**User Story**:  
Sebagai **developer**, saya ingin **load test aplikasi** agar **saya tahu system limits dan bottlenecks**.

**Acceptance Criteria**:
- [ ] Load test untuk concurrent reads (100 users)
- [ ] Load test untuk concurrent writes (10 admins)
- [ ] Stress test untuk Google Apps Script quota
- [ ] Test rate limiting behavior
- [ ] Identify breaking points
- [ ] Document performance under load
- [ ] Recommendations untuk scaling

**Load Testing Tool: k6**:
```javascript
// load-tests/concurrent-reads.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% requests < 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const email = `student${__VU}@school.com`;
  const nisn = `00875954${String(__VU).padStart(2, '0')}`;
  
  const response = http.get(
    `https://sigma-bio.vercel.app/api/students?email=${email}&nisn=${nisn}&semester=2`
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}
```

**Task Breakdown**:
1. Install k6 load testing tool
2. Create load test scenarios
3. Run concurrent read tests
4. Run concurrent write tests
5. Test rate limiting under load
6. Test Google Apps Script quotas
7. Analyze results
8. Document findings
9. Create recommendations

**Technical Domain**: Testing, Performance  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: None

---

### SIGMA-043: Security Testing & Penetration Testing

**User Story**:  
Sebagai **security engineer**, saya ingin **security testing** agar **saya ensure sistem aman dari common vulnerabilities**.

**Acceptance Criteria**:
- [ ] Test authentication bypass attempts
- [ ] Test authorization (role-based access)
- [ ] Test SQL injection (Sheets formula injection)
- [ ] Test XSS vulnerabilities
- [ ] Test CSRF protection
- [ ] Test rate limiting bypass attempts
- [ ] Test input validation
- [ ] Document vulnerabilities found
- [ ] Fix critical/high severity issues

**Security Test Checklist**:
```
Authentication:
□ Login dengan invalid credentials
□ Login tanpa CSRF token
□ Brute force protection
□ Session hijacking attempts
□ Token expiration handling

Authorization:
□ Access admin routes sebagai student
□ Access other student's data
□ Privilege escalation attempts
□ IDOR vulnerabilities

Input Validation:
□ Inject formula di input fields (=SUM(A1:A10))
□ Inject XSS scripts (<script>alert('xss')</script>)
□ SQL injection (meskipun tidak pakai SQL)
□ Oversized inputs (>10MB)
□ Special characters handling

API Security:
□ Missing authentication header
□ Invalid/expired tokens
□ Rate limiting bypass
□ CORS misconfiguration
□ API key exposure
```

**Task Breakdown**:
1. Create security test plan
2. Test authentication mechanisms
3. Test authorization checks
4. Test input validation
5. Test for XSS vulnerabilities
6. Test for injection attacks
7. Test CSRF protection
8. Document findings
9. Fix security issues
10. Retest after fixes

**Technical Domain**: Security, Testing  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: None

---

## Definition of Done - EPIC-8

**Critical Requirements**:
- [x] Unit test coverage > 80%
- [x] All unit tests passing
- [x] Integration tests covering all API endpoints
- [x] E2E tests untuk critical flows passing
- [x] Load testing completed
- [x] Security testing completed
- [x] All critical/high vulnerabilities fixed
- [x] Test reports generated
- [x] CI/CD pipeline configured
- [x] Code review completed

---

# 📚 EPIC-9: Documentation & Deployment

**Priority**: Critical  
**Business Value**: Enable successful launch dan adoption  
**Story Points**: 13  
**Sprint**: Sprint 6

## User Stories

### SIGMA-044: Admin User Guide (Bahasa Indonesia)

**User Story**:  
Sebagai **admin/guru**, saya ingin **panduan lengkap menggunakan sistem** agar **saya dapat menggunakan semua fitur dengan efektif**.

**Acceptance Criteria**:
- [ ] Panduan dalam Bahasa Indonesia
- [ ] Cover semua admin features
- [ ] Screenshots untuk setiap fitur
- [ ] Step-by-step tutorials
- [ ] Troubleshooting section
- [ ] FAQ section
- [ ] Video tutorials (optional)
- [ ] PDF export tersedia

**User Guide Structure**:
```markdown
# Panduan Admin SIGMA

## 1. Pendahuluan
- Apa itu SIGMA?
- Fitur-fitur Admin
- Login ke Admin Portal

## 2. Manajemen Murid
- Melihat Daftar Murid
- Menambah Murid Baru
- Mengedit Data Murid
- Menghapus Murid
- Import Murid dari CSV

## 3. Input Nilai
- Input Nilai Individual
- Input Nilai Bulk (Tabel)
- Import Nilai dari CSV
- Melihat History Nilai

## 4. Manajemen Golden Star
- Memberikan Golden Star
- Melihat Transaksi GS
- Adjustment GS Bulk
- Mengelola Redemption

## 5. Laporan & Statistik
- Laporan Nilai Per Kelas
- Statistik Golden Star
- Export Data

## 6. Troubleshooting
- Koneksi Error
- Data Tidak Terupdate
- Login Gagal

## 7. FAQ
```

**Task Breakdown**:
1. Outline user guide structure
2. Write content untuk setiap section
3. Create screenshots
4. Add step-by-step tutorials
5. Write troubleshooting guide
6. Write FAQ section
7. Review dengan guru/admin
8. Revise based on feedback
9. Generate PDF version
10. Publish to documentation site

**Technical Domain**: Documentation  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: All admin features completed

---

### SIGMA-045: Student User Guide (Bahasa Indonesia)

**User Story**:  
Sebagai **murid**, saya ingin **panduan menggunakan dashboard** agar **saya dapat maximize manfaat dari sistem**.

**Acceptance Criteria**:
- [ ] Panduan dalam Bahasa Indonesia
- [ ] Simple dan mudah dipahami murid
- [ ] Screenshots dashboard features
- [ ] Penjelasan Golden Star system
- [ ] Cara baca grafik dan statistik
- [ ] FAQ untuk murid

**Student Guide Structure**:
```markdown
# Panduan Murid SIGMA

## 1. Cara Login
- Menggunakan Email Sekolah
- Menggunakan Password (NISN)

## 2. Memahami Dashboard
- Kartu Ranking Saya
- Leaderboard Top 10
- Grafik Pertumbuhan Akademik

## 3. Golden Star
- Apa itu Golden Star?
- Cara Mendapat GS
- Cara Menggunakan GS
- Menukar GS untuk Skip Ulangan

## 4. Melihat Nilai
- Nilai Per Bab
- Nilai Rapor
- History Nilai

## 5. Tips & Trik
- Cara Meningkatkan Ranking
- Strategi Kumpulkan GS

## 6. FAQ
```

**Task Breakdown**:
1. Write student guide content
2. Create simple screenshots
3. Explain GS system dengan gambar
4. Write tips & strategies
5. Write FAQ untuk murid
6. Review dengan sample murid
7. Revise based on feedback
8. Generate PDF version

**Technical Domain**: Documentation  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: None

---

### SIGMA-046: API Documentation

**User Story**:  
Sebagai **developer**, saya ingin **API documentation lengkap** agar **saya atau developer lain dapat integrate atau maintain sistem**.

**Acceptance Criteria**:
- [ ] Document all API endpoints
- [ ] Request/response schemas
- [ ] Authentication requirements
- [ ] Error codes dan handling
- [ ] Rate limiting details
- [ ] Code examples (curl, JavaScript)
- [ ] Postman collection available

**API Documentation Format**:
```markdown
# SIGMA API Documentation

## Authentication

### POST /api/auth/admin/login
Login admin dengan email dan password.

**Request**:
```json
{
  "email": "admin@school.com",
  "password": "password123"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "user": {
    "email": "admin@school.com",
    "name": "Admin Biologi",
    "role": "admin"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Rate Limit**: 5 requests per 15 minutes  
**Authentication**: None (this is login endpoint)

---

## Students

### GET /api/students
Get student data by email dan NISN.

**Query Parameters**:
- `email` (required): Student email
- `nisn` (required): Student NISN (10 digits)
- `semester` (optional): 1 or 2

**Headers**:
```
Cookie: auth_token=<JWT_TOKEN>
```

**Response**:
```json
{
  "profile": {
    "nama": "AHMAD DARMAWAN",
    "kelas": "11_P09",
    "semesterAktif": "2"
  },
  "gsData": {
    "totalDapat": 6,
    "totalPakaiUH": 2,
    "saldoAkhir": 4
  },
  ...
}
```

**Rate Limit**: 10 requests per minute  
**Authentication**: Required (student or admin)
```

**Task Breakdown**:
1. Setup API documentation tool (Swagger/OpenAPI)
2. Document auth endpoints
3. Document student endpoints
4. Document admin endpoints
5. Document error responses
6. Create code examples
7. Generate Postman collection
8. Publish documentation
9. Test examples

**Technical Domain**: Documentation, Backend  
**Estimasi Pengerjaan**: 2.5 hari  
**Dependencies**: All API endpoints completed

---

### SIGMA-047: Deployment Guide & Infrastructure Setup

**User Story**:  
Sebagai **developer**, saya ingin **deployment guide lengkap** agar **saya dapat deploy sistem ke production dengan aman**.

**Acceptance Criteria**:
- [ ] Step-by-step deployment guide
- [ ] Environment variables documentation
- [ ] Google Apps Script deployment guide
- [ ] Vercel deployment guide
- [ ] Rollback procedures
- [ ] Backup strategies
- [ ] Monitoring setup guide

**Deployment Guide Content**:
```markdown
# SIGMA Deployment Guide

## Prerequisites
- Node.js 18+
- pnpm atau npm
- Google Account dengan access ke Google Sheets
- Vercel account
- Git repository

## 1. Google Sheets Setup
1. Copy template Google Sheets
2. Setup tabs: DATABASE_MASTER, TOPIC_GRADES, etc.
3. Add sample data

## 2. Google Apps Script Setup
1. Open Apps Script editor
2. Paste Code.gs
3. Deploy as Web App
4. Set permissions
5. Copy deployment URL
6. Set API_KEY in Script Properties

## 3. Environment Variables
Create `.env.local`:
```env
JWT_SECRET=your-secret-key-change-this
GOOGLE_SCRIPT_URL=https://script.google.com/macros/...
NEXT_PUBLIC_APP_URL=https://sigma-bio.vercel.app
```

## 4. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 5. Post-Deployment
- Test all features
- Verify environment variables
- Setup monitoring
- Configure alerts

## 6. Rollback Procedures
If something goes wrong:
1. Revert Git commit
2. Redeploy previous version: `vercel --prod`
3. Check Google Apps Script version

## 7. Backup Strategy
- Google Sheets: Auto-backup daily via Google Drive
- Code: Git repository with branches
- Database snapshots: Manual export weekly
```

**Task Breakdown**:
1. Document prerequisites
2. Write Google Sheets setup guide
3. Write Apps Script deployment guide
4. Document environment variables
5. Write Vercel deployment guide
6. Document rollback procedures
7. Document backup strategies
8. Test deployment process
9. Create deployment checklist

**Technical Domain**: DevOps, Documentation  
**Estimasi Pengerjaan**: 2 hari  
**Dependencies**: All features completed

---

### SIGMA-048: Production Launch & Monitoring

**User Story**:  
Sebagai **project manager**, saya ingin **successful production launch** agar **sistem dapat digunakan oleh guru dan murid**.

**Acceptance Criteria**:
- [ ] Pre-launch checklist completed
- [ ] Production deployment successful
- [ ] All tests passing in production
- [ ] Monitoring alerts configured
- [ ] Backup automated
- [ ] Training session untuk guru/admin
- [ ] Announce launch ke murid
- [ ] Monitor system for first 48 hours

**Pre-Launch Checklist**:
```
Technical:
□ All tests passing
□ Security scan completed
□ Performance benchmarks met
□ Environment variables set
□ SSL certificate active
□ DNS configured
□ CDN configured (if needed)
□ Error tracking enabled
□ Monitoring dashboards setup
□ Backup automated

Content:
□ Production data migrated
□ Sample data cleaned
□ User guides published
□ FAQ updated
□ Contact information updated

User Management:
□ Admin accounts created
□ Student accounts validated
□ Password reset mechanism tested
□ Email notifications configured

Training:
□ Admin training session scheduled
□ Training materials prepared
□ Demo environment available
□ Support channel setup (email/WhatsApp)

Communication:
□ Launch announcement prepared
□ User guides distributed
□ Support contact shared
□ Feedback form ready
```

**Launch Day Tasks**:
```
Pre-Launch (1 week before):
- Training session untuk guru
- Test accounts validation
- Soft launch dengan sample users

Launch Day:
- Deploy to production (morning)
- Smoke tests
- Announce to students (afternoon)
- Monitor traffic and errors

Post-Launch (48 hours):
- Monitor error rates
- Respond to support requests
- Collect feedback
- Fix critical bugs immediately

Week 1:
- Daily monitoring
- User feedback analysis
- Bug fixes and improvements
- Usage analytics review
```

**Task Breakdown**:
1. Complete pre-launch checklist
2. Schedule training session
3. Conduct training for guru
4. Deploy to production
5. Run smoke tests
6. Send launch announcement
7. Monitor system 48 hours
8. Collect and respond to feedback
9. Fix critical issues
10. Write post-launch report

**Technical Domain**: Project Management, DevOps  
**Estimasi Pengerjaan**: 3 hari  
**Dependencies**: All previous EPICs completed

---

## Definition of Done - EPIC-9

**Critical Requirements**:
- [x] Admin user guide completed (Bahasa Indonesia)
- [x] Student user guide completed (Bahasa Indonesia)
- [x] API documentation published
- [x] Deployment guide written dan tested
- [x] Production deployment successful
- [x] All monitoring and alerts configured
- [x] Training completed untuk admin/guru
- [x] Launch announcement sent
- [x] System stable for 48 hours post-launch
- [x] Feedback collected dan addressed

---

# 📊 Sprint Planning Summary

## Sprint 1: Authentication & Foundation (Week 1-2)
**Goal**: Secure authentication dan admin dashboard foundation

**Story Points**: 34  
**User Stories**:
- SIGMA-001 to SIGMA-010

**Deliverables**:
- JWT authentication working
- Admin login page
- Student login dengan JWT
- Middleware protection
- Admin dashboard layout
- Enhanced Google Apps Script

---

## Sprint 2: Student & Grade Management (Week 3-4)
**Goal**: CRUD untuk murid dan grade input system

**Story Points**: 35  
**User Stories**:
- SIGMA-011 to SIGMA-019

**Deliverables**:
- Student CRUD complete
- Individual grade input
- Bulk grade input
- CSV import untuk students dan grades

---

## Sprint 3: Golden Star & Grade Features (Week 5-6)
**Goal**: Complete grade management dan GS system

**Story Points**: 30  
**User Stories**:
- SIGMA-020 to SIGMA-027

**Deliverables**:
- Grade history dan audit
- Grade statistics
- Auto-calculate nilai rapor
- Golden Star management complete
- GS statistics dashboard

---

## Sprint 4: Dashboard Enhancement (Week 7-8)
**Goal**: Improve student dashboard UX

**Story Points**: 21  
**User Stories**:
- SIGMA-028 to SIGMA-033

**Deliverables**:
- Responsive dashboard
- Enhanced loading states
- Better error handling
- Enhanced charts
- Notifications system
- Print/Export features

---

## Sprint 5: Performance & Real-time (Week 9-10)
**Goal**: Optimize performance dan data freshness

**Story Points**: 13  
**User Stories**:
- SIGMA-034 to SIGMA-038

**Deliverables**:
- Reduced cache TTL
- Optimized Google Apps Script
- Debouncing/throttling
- Progressive loading
- Performance monitoring

---

## Sprint 6: Testing & Launch (Week 11-12)
**Goal**: QA, documentation, dan production launch

**Story Points**: 34  
**User Stories**:
- SIGMA-039 to SIGMA-048

**Deliverables**:
- Complete test suite
- Documentation (admin, student, API)
- Deployment guide
- Production launch
- Monitoring setup

---

# 📋 Backlog Prioritization Matrix

## Critical (Must Have for MVP)
- Authentication & Authorization
- Student CRUD
- Grade Input (Individual & Bulk)
- Golden Star Basic Management
- Admin Dashboard
- Google Apps Script Enhanced

## High Priority (Important for Launch)
- CSV Import (Students & Grades)
- Grade History & Audit
- GS Transaction History
- Responsive Design
- Error Handling

## Medium Priority (Nice to Have)
- Enhanced Charts
- Notifications
- Performance Optimizations
- Statistics Dashboards
- Print/Export

## Low Priority (Future Enhancements)
- Real-time Updates (WebSocket)
- Email Notifications
- Mobile App
- Advanced Analytics
- Multi-language Support

---

# 🎯 Success Criteria

## Functional Requirements
- [x] Admin dapat login dan manage semua data
- [x] Admin dapat input nilai via web
- [x] Admin dapat manage Golden Star
- [x] Murid dapat login dan view dashboard
- [x] Data sync dengan Google Sheets < 1 menit
- [x] System always online (99.9% uptime)

## Non-Functional Requirements
- [x] Response time P95 < 2 seconds
- [x] Mobile responsive
- [x] Secure (JWT, HTTPS, input validation)
- [x] Test coverage > 80%
- [x] Documentation complete

## Business Metrics
- [x] 100% guru adoption dalam 2 minggu
- [x] Input 1 kelas < 10 menit
- [x] Student satisfaction > 4.5/5
- [x] Error rate < 1%
- [x] Zero data loss

---

# 📝 Notes & Assumptions

## Assumptions
1. Google Sheets dapat handle 500 students max
2. Max 5 admin users concurrent
3. Max 100 students concurrent viewing
4. Guru familiar dengan Excel/Sheets
5. Murid memiliki smartphone atau laptop
6. Internet connection available di sekolah

## Risks
1. **Google Sheets Performance**: Mitigation via caching dan optimization
2. **Concurrent Write Conflicts**: Mitigation via optimistic locking
3. **API Quota Limits**: Mitigation via aggressive caching
4. **User Adoption**: Mitigation via training dan clear documentation
5. **Data Integrity**: Mitigation via validation dan audit logs

## Dependencies
1. Google Sheets API availability
2. Google Apps Script execution quotas
3. Vercel hosting availability
4. Guru commitment untuk training

---

# 📞 Support & Contact

**Project Owner**: Guru/Admin Sekolah  
**Development Team**: [Your Team]  
**Support Email**: support@sigma-bio.school  
**Documentation**: https://docs.sigma-bio.vercel.app  
**Repository**: https://github.com/[your-org]/sigma-bio

---

**Last Updated**: 2026-10-01  
**Version**: 2.0.0  
**Status**: Ready for Sprint 1

