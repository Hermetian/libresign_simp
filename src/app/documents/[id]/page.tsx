"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";

type Document = Database["public"]["Tables"]["documents"]["Row"];

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize Supabase client
  const supabase = createSupabaseClient();

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data: docData, error: docError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();
        
        if (docError) {
          throw docError;
        }
        
        if (!docData) {
          toast.error("Document not found");
          router.push("/dashboard");
          return;
        }
        
        setDocument(docData);
        
        // Get signed URL for the PDF
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from("documents")
          .createSignedUrl(docData.file_path, 3600); // 1 hour expiry
        
        if (urlError) {
          throw urlError;
        }
        
        setPdfUrl(urlData.signedUrl);
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Error loading document");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading document...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">View Document</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push(`/documents/${documentId}/edit`)}>
              Edit Document
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-xl font-semibold mb-2">{document?.name}</h2>
            <p className="text-sm text-gray-500">
              Status: <span className="capitalize">{document?.status}</span>
            </p>
          </div>
          
          <div 
            className="bg-white rounded-lg shadow overflow-auto" 
            style={{ height: "750px" }}
          >
            {pdfUrl ? (
              <iframe 
                src={pdfUrl}
                className="w-full h-full border-0"
                title="Document preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Failed to load PDF preview</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 