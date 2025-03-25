import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SupabaseClient } from "@supabase/supabase-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to ensure storage buckets exist
export async function ensureStorageBuckets(supabase: SupabaseClient) {
  // Check both required storage buckets
  for (const bucket of ['documents', 'signatures']) {
    try {
      const { error } = await supabase.storage.getBucket(bucket)
      
      if (error) {
        console.log(`Storage bucket '${bucket}' needs to be created`)
        
        // Create the bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: false,
          fileSizeLimit: bucket === 'documents' ? 10485760 : 5242880, // 10MB for docs, 5MB for signatures
        })
        
        if (createError) {
          console.error(`Failed to create ${bucket} bucket:`, createError)
        } else {
          console.log(`Created ${bucket} bucket successfully`)
        }
      }
    } catch (error) {
      console.error(`Error checking/creating ${bucket} bucket:`, error)
    }
  }
}
