"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { ensureStorageBuckets } from "@/lib/utils";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type FormField = Database["public"]["Tables"]["form_fields"]["Row"];

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  
  // Initialize Supabase client
  const supabase = createSupabaseClient();

  // Fetch document details
  useEffect(() => {
    const fetchDocumentAndFields = async () => {
      try {
        // Ensure storage buckets exist
        await ensureStorageBuckets(supabase);
        
        // Fetch document
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
        
        // Fetch fields for this document
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("form_fields")
          .select("*")
          .eq("document_id", documentId);
        
        if (fieldsError) {
          console.error("Error fetching fields:", fieldsError);
        } else {
          setFields(fieldsData || []);
        }
        
        // Get signed URL for the PDF with longer expiry
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from("documents")
          .createSignedUrl(docData.file_path, 7200); // 2 hours expiry
        
        if (urlError) {
          console.error("Error getting signed URL:", urlError);
          throw urlError;
        }
        
        console.log("PDF URL generated for view:", urlData.signedUrl);
        setPdfUrl(urlData.signedUrl);
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Error loading document");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentAndFields();
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
            <p className="text-sm text-gray-500 mt-1">
              Number of fields: {fields.length}
            </p>
          </div>
          
          <div 
            className="bg-white rounded-lg shadow overflow-hidden relative" 
            style={{ height: "750px" }}
          >
            {/* PDF iframe */}
            {pdfUrl ? (
              <iframe 
                src={`${pdfUrl}#view=FitH&scrollbar=0`}
                className="w-full h-full border-0"
                title="Document preview"
                onLoad={() => console.log("View page PDF iframe loaded")}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Failed to load PDF preview</p>
              </div>
            )}
            
            {/* Form fields overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="absolute border-2 flex items-center justify-center"
                  style={{
                    left: `${field.x_position}px`,
                    top: `${field.y_position}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                    borderColor: field.field_type === 'signature' ? '#4f46e5' : 
                                field.field_type === 'text' ? '#10b981' : '#f59e0b',
                    backgroundColor: field.field_type === 'signature' ? 'rgba(79, 70, 229, 0.1)' : 
                                    field.field_type === 'text' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  }}
                >
                  <span className="text-xs font-medium text-gray-700 bg-white px-1 py-0.5 rounded">
                    {field.field_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 