"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "@/lib/supabase";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type User = {
  id: string;
  email?: string;
};

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Initialize Supabase client
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchDocuments = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .or(`created_by.eq.${userId}`)
        .order("created_at", { ascending: false });

      setDocuments(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error fetching documents: " + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!data.session) {
          // No session found, redirect to login
          router.push("/login");
          return;
        }
        
        setUser(data.session.user);
        fetchDocuments(data.session.user.id);
      } catch (error) {
        console.error("Session check error:", error);
        toast.error("Authentication error. Please try logging in again.");
        router.push("/login");
      }
    };

    checkUser();
  }, [router, supabase, fetchDocuments]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error signing out: " + errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">LibreSign</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-gray-600">{user.email}</span>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Documents</h2>
            <Button asChild>
              <Link href="/documents/new">Create New Document</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading documents...</div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-500 mb-4">You don&apos;t have any documents yet</p>
                <Button asChild>
                  <Link href="/documents/new">Create Your First Document</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <CardTitle className="truncate">{doc.name}</CardTitle>
                    <CardDescription>
                      Status: <span className="capitalize">{doc.status}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Created on {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                      <Link href={`/documents/${doc.id}`}>View</Link>
                    </Button>
                    {doc.status === "draft" && (
                      <Button asChild>
                        <Link href={`/documents/${doc.id}/edit`}>Edit</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 