# BioExplorer Pro - Setup Instructions

## Project Overview

BioExplorer Pro is an advanced biology academic portal that tracks student achievements, rankings, and performance metrics. It integrates with Google Sheets to fetch student data and provides a comprehensive dashboard with rankings, leaderboards, and achievement tracking.

## Technology Stack

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 with dark mode support
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme Management**: next-themes

## Prerequisites

1. Node.js 18+ and npm/yarn
2. A Google Sheet with student data
3. Access to the Google Sheets API (or use the provided endpoint)

## Initial Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**To get these credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Select "Web Application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret

### 2. Google Sheet Data Structure

Your Google Sheet should have the following columns:

**Required Columns:**
- NO
- NISN
- Nama Lengkap
- Email Google
- Kelas
- Current Semester
- Saldo Akhir GS

**Semester 1 Columns (S1):**
- Rata Harian (90%) S1
- Nilai Asli UAS S1
- Redeem GS UAS S1
- Final UAS (10%) S1
- NILAI RAPOR S1
- SISA SALDO
- Saldo Akhir GS S1
- TOTAL GS DAPAT S1
- TOTAL GS TERPAKAI S1
- SALDO SAAT INI S1

**Semester 2 Columns (S2):**
- Similar structure with S2 suffix

**Task Columns:**
- Tugas 1-6 Bab 1 S1 (and corresponding GS columns)
- Similar for S2

### 3. Google Sheets API Endpoint

The application uses this endpoint to fetch student data:
```
https://script.google.com/macros/s/AKfycbwZ-3w-pZsWwalaevZzfbVa1ukMuxbuXqxCAfKziEQMej49y2z1xQ1h6QH9av3EyiD0/exec
```

This should be a Google Apps Script that exports your Google Sheet data as JSON.

## Running the Application

### Development Mode

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

### Production Build

```bash
npm run build
npm run start
```

## Features

### 1. Authentication
- Email-based login with NISN validation
- Session persistence using localStorage
- Automatic redirect to login for unauthenticated users

### 2. Dashboard
- **Personal Ranking Card**: Shows current rank, score, and Golden Star balance
- **Top 10 Leaderboard**: Displays top performing students with rank badges
- **Academic Growth Chart**: Visualizes score distribution and class averages
- **Bio-Bank Activity**: Shows Golden Star transactions and detailed grade breakdown by chapter

### 3. Semester Switching
- Toggle between "Semester Ganjil" (Odd) and "Semester Genap" (Even)
- All data updates dynamically based on selected semester

### 4. Theme Support
- Light/Dark mode toggle
- Theme preference persisted to localStorage
- Emerald green color scheme optimized for both themes

### 5. Data Refresh
- Manual "Sync Data" button with rotating animation
- Automatic refresh every 60 minutes
- Real-time data fetching from Google Sheets

## Component Structure

```
components/
├── auth-provider.tsx          # Authentication context
├── dashboard-header.tsx       # Header with user info and controls
├── rank-card.tsx             # Personal ranking display
├── leaderboard.tsx           # Top 10 students table
├── academic-growth-chart.tsx # Charts and analytics
├── bio-bank-activity.tsx     # Transaction and grade breakdown
├── semester-selector.tsx     # Semester switcher
├── theme-toggle.tsx          # Dark/light mode toggle
└── dashboard-skeleton.tsx    # Loading skeletons

app/
├── page.tsx                  # Root redirect
├── login/
│   └── page.tsx             # Login page
└── dashboard/
    └── page.tsx             # Main dashboard

lib/
├── types.ts                 # TypeScript interfaces
└── api.ts                   # Data fetching and processing

hooks/
├── use-interval.ts          # Auto-refresh hook
└── use-local-storage.ts     # Persistent storage hook
```

## Data Flow

1. **Login**: User enters email and NISN
2. **Authentication**: Email is validated against Google Sheet data
3. **Session Storage**: User session persisted to localStorage
4. **Data Fetching**: Dashboard fetches all student data from API
5. **Processing**: Data is filtered and ranked based on selected semester
6. **Display**: Components render based on processed data

## Color Scheme

- **Primary**: Emerald Green (#10B981)
- **Secondary**: Emerald light (#ecfdf5)
- **Accent**: Emerald dark (#d1fae5)
- **Destructive**: Red (#ef4444)
- **Dark Mode**: Deep slate backgrounds with emerald accents

## Performance Optimizations

- Skeleton loaders during data fetching
- Memoized components to prevent unnecessary re-renders
- Efficient data processing using array methods
- Lazy loading of components
- Debounced refresh functionality

## Troubleshooting

### "Student profile not found"
- Verify email in Google Sheet matches login email exactly
- Check that the Google Sheet endpoint is accessible
- Ensure NISN matches the data in the sheet

### Data not refreshing
- Check network connection
- Verify Google Sheets endpoint is working
- Check browser console for API errors
- Try manual refresh with "Sync Data" button

### Authentication issues
- Clear localStorage and cookies
- Check Google OAuth credentials
- Verify redirect URIs in Google Cloud Console

### Styling issues
- Clear browser cache
- Ensure Tailwind CSS is properly compiled
- Check that all dependencies are installed

## Deployment

The application can be deployed to Vercel, Netlify, or any Next.js-compatible hosting:

### Vercel Deployment
```bash
vercel deploy
```

### Environment Variables (Production)
Add the same environment variables to your hosting platform:
- NEXT_PUBLIC_GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

## Support

For issues or questions, please check:
1. Browser console for error messages
2. Network tab to verify API calls
3. Google Sheet data structure and formatting
4. Environment variables configuration

## License

This project is built with v0.app and uses Next.js with shadcn/ui components.
