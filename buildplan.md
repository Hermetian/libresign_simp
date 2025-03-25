# LibreSign Simplified Build Plan

## Overview
This is a simplified DocuSign clone with the following core features:
- User authentication (using Supabase Auth)
- Document upload functionality
- Form field placement on documents
- Signature drawing and saving
- Document signing
- Viewing signed documents

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **UI**: Tailwind CSS + Shadcn UI
- **PDF Handling**: react-pdf + fabric.js (for annotations)
- **Signature Drawing**: react-signature-canvas
- **Deployment**: Vercel

## Project Structure
```
libresign_simplified/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── documents/
│   │   └── signatures/
│   ├── dashboard/
│   ├── documents/
│   │   ├── [id]/
│   │   ├── new/
│   │   └── sign/[id]/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── auth/
│   ├── documents/
│   ├── form-fields/
│   └── signatures/
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── public/
└── ...config files
```

## Implementation Steps

### 1. Project Setup (15 minutes)
- Initialize Next.js project with TypeScript
- Set up Tailwind CSS and Shadcn UI
- Configure ESLint and Prettier
- Set up environment variables

### 2. Authentication & Database (20 minutes)
- Set up Supabase project
- Configure Supabase Auth with email/password provider
- Create login/signup components
- Set up authentication middleware
- Create protected routes

### 3. Database Setup (15 minutes)
- Set up Supabase PostgreSQL tables
- Create database schema for users, documents, and signatures
- Set up Supabase client utility

### 4. Document Upload (20 minutes)
- Create document upload page
- Implement Supabase Storage for document storage
- Create document preview component using react-pdf

### 5. Form Field Placement (30 minutes)
- Create form field editor using fabric.js
- Implement drag and drop functionality for signature fields
- Save field positions to Supabase database

### 6. Signature Drawing (20 minutes)
- Create signature pad component using react-signature-canvas
- Save signatures to Supabase Storage
- Create UI for managing saved signatures

### 7. Document Signing (30 minutes)
- Create document signing page
- Implement signature placement based on form fields
- Apply signatures to the document
- Generate signed PDF
- Store signed document in Supabase Storage

### 8. Dashboard & Document Management (20 minutes)
- Create dashboard for document overview
- Implement document status tracking
- Create document history and audit trail
- Add filtering and sorting options

### 9. Testing & Bug Fixes (20 minutes)
- Test all major workflows
- Fix any bugs or issues
- Ensure responsive design

### 10. Deployment (10 minutes)
- Deploy to Vercel
- Set up environment variables in production
- Test the deployed application

## Time Allocation
Total time estimate: 3 hours
- Setup and core infrastructure: 50 minutes
- Main features: 100 minutes
- UI polish and testing: 30 minutes

## Priorities
If time runs short, focus on these core features in order:
1. Authentication
2. Document upload
3. Signature creation
4. Document signing
5. Dashboard for viewing documents

This simplified approach focuses on delivering a functional prototype within the 2-hour timeframe while ensuring the core functionality is in place. 