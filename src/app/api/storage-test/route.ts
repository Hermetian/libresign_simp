import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

export async function GET() {
  // Initialize Supabase client with service role for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Get list of buckets to verify storage access
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      return NextResponse.json(
        { error: 'Failed to list buckets', details: bucketsError },
        { status: 500 }
      );
    }
    
    const results = {
      message: 'Storage configuration check completed',
      documents: { exists: false, created: false, fileCount: 0 },
      signatures: { exists: false, created: false, fileCount: 0 },
    };
    
    // Check if documents bucket exists
    const documentsBucket = buckets?.find(bucket => bucket.name === 'documents');
    results.documents.exists = !!documentsBucket;
    
    // Check if signatures bucket exists
    const signaturesBucket = buckets?.find(bucket => bucket.name === 'signatures');
    results.signatures.exists = !!signaturesBucket;
    
    // Create documents bucket if it doesn't exist
    if (!documentsBucket) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('documents', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
      
      if (createBucketError) {
        console.error('Failed to create documents bucket:', createBucketError);
      } else {
        results.documents.created = true;
      }
    }
    
    // Create signatures bucket if it doesn't exist
    if (!signaturesBucket) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('signatures', {
          public: false,
          fileSizeLimit: 5242880, // 5MB
        });
      
      if (createBucketError) {
        console.error('Failed to create signatures bucket:', createBucketError);
      } else {
        results.signatures.created = true;
      }
    }
    
    // Get list of files in documents bucket if it exists
    if (documentsBucket || results.documents.created) {
      const { data: files, error: filesError } = await supabase
        .storage
        .from('documents')
        .list();
      
      if (!filesError && files) {
        results.documents.fileCount = files.length;
      }
    }
    
    // Get list of files in signatures bucket if it exists
    if (signaturesBucket || results.signatures.created) {
      const { data: files, error: filesError } = await supabase
        .storage
        .from('signatures')
        .list();
      
      if (!filesError && files) {
        results.signatures.fileCount = files.length;
      }
    }
    
    // Setup RLS policies for both buckets
    await setupStoragePolicies(supabase);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json(
      { error: 'Storage test failed', details: error },
      { status: 500 }
    );
  }
}

// Helper function to set up storage policies
async function setupStoragePolicies(supabase: SupabaseClient) {
  try {
    // These queries need the service role key
    // Create policies for documents bucket
    await supabase.rpc('setup_documents_storage_policies');
    
    // Create policies for signatures bucket
    await supabase.rpc('setup_signatures_storage_policies');
    
    console.log('Storage policies setup completed');
  } catch (error) {
    console.error('Error setting up storage policies:', error);
    // Continue even if policy setup fails - may not have these functions available
  }
} 