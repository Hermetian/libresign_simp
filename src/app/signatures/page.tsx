"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import SignatureManager from "@/components/signatures/SignatureManager";

export default function SignaturesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUserId(session.user.id);
    };

    checkUser();
  }, [router, supabase]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">LibreSign</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to Dashboard
          </Button>
          
          <h2 className="text-2xl font-bold mb-6">Manage Your Signatures</h2>
          
          <SignatureManager userId={userId} />
        </div>
      </main>
    </div>
  );
} 