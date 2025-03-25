# LibreSign - Open-Source Document Signing

LibreSign is a simplified e-signature platform that allows users to upload documents, add signature fields, and sign documents digitally.

## Features

- **User Authentication**: Secure login and signup using Supabase Auth
- **Document Management**: Upload, view, and track document status
- **Signature Creation**: Draw and save signatures for quick access
- **Form Field Placement**: Add signature fields to documents
- **Document Signing**: Sign documents with saved signatures
- **Dashboard**: View all your documents and their status

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **UI**: Tailwind CSS + Shadcn UI
- **PDF Handling**: react-pdf + fabric.js
- **Signature Drawing**: react-signature-canvas

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/libresign_simplified.git
   cd libresign_simplified
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following environment variables:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

   # Next.js
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Set up the following tables in your Supabase database:
     - `users`: User profiles
     - `documents`: Document metadata
     - `form_fields`: Fields added to documents
     - `signatures`: User signatures
   - Configure storage buckets for `documents` and `signatures`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

This application can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set up the environment variables in the Vercel dashboard
4. Deploy!

## License

This project is open-source and available under the MIT License.
