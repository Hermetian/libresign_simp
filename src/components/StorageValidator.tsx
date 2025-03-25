"use client";

import { useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ensureStorageBuckets } from "@/lib/utils";
import type { Database } from "@/lib/supabase";

export default function StorageValidator() {
  useEffect(() => {
    // Validate storage buckets on startup
    const validateStorage = async () => {
      try {
        const supabase = createClientComponentClient<Database>();
        
        // Only log if debug mode is enabled
        if (process.env.DEBUG === 'true') {
          console.log('Validating storage buckets on application startup...');
        }
        
        await ensureStorageBuckets(supabase);
        
        if (process.env.DEBUG === 'true') {
          console.log('Storage validation complete');
        }
      } catch (error) {
        console.error('Error validating storage:', error);
      }
    };
    
    validateStorage();
  }, []);
  
  // This component doesn't render anything
  return null;
} 