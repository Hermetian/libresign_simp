"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";

type Document = Database["public"]["Tables"]["documents"]["Row"];

export default function DocumentEditPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldEmail, setFieldEmail] = useState("");
  const [currentFieldType, setCurrentFieldType] = useState<"signature" | "text" | "date">("signature");
  
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

  const handleAddField = async (type: "signature" | "text" | "date", position: { x: number, y: number }) => {
    try {
      // Default field dimensions
      const width = type === "signature" ? 200 : 150;
      const height = type === "signature" ? 80 : 40;
      
      // Get the user ID from the session or use the assigned email
      let assignedTo = null;
      
      if (fieldEmail.trim()) {
        // Look up user by email or create a placeholder
        assignedTo = fieldEmail.trim();
      } else {
        // If no email specified, assign to current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          assignedTo = session.user.id;
        }
      }
      
      if (!assignedTo) {
        toast.error("Could not determine field assignee");
        return;
      }
      
      // Insert the field
      const { error } = await supabase
        .from("form_fields")
        .insert({
          document_id: documentId,
          field_type: type,
          x_position: position.x,
          y_position: position.y,
          width,
          height,
          page: 1, // Default to first page
          assigned_to: assignedTo
        });
      
      if (error) {
        throw error;
      }
      
      toast.success(`${type} field added`);
      
      // Clear email field after adding
      setFieldEmail("");
    } catch (error) {
      console.error("Error adding field:", error);
      toast.error("Failed to add field");
    }
  };

  // Mock function to demonstrate adding a field (in a real app, you'd use PDF.js or a similar library)
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get click position relative to the PDF container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleAddField(currentFieldType, { x, y });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Document</h1>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* PDF Preview */}
            <div className="lg:w-3/4">
              <div className="bg-white p-4 rounded-lg shadow mb-4">
                <h2 className="text-xl font-semibold mb-2">{document?.name}</h2>
                <p className="text-sm text-gray-500">
                  Click anywhere on the document to add a field
                </p>
              </div>
              
              <div 
                className="bg-white rounded-lg shadow overflow-auto" 
                style={{ height: "750px" }}
                onClick={handlePdfClick}
              >
                {pdfUrl ? (
                  <iframe 
                    src={`${pdfUrl}#toolbar=0`} 
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
            
            {/* Field Controls */}
            <div className="lg:w-1/4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-4">Add Field</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fieldType">Field Type</Label>
                    <Select 
                      value={currentFieldType} 
                      onValueChange={(value: string) => setCurrentFieldType(value as "signature" | "text" | "date")}
                    >
                      <SelectTrigger id="fieldType">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="signature">Signature</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="assignTo">Assign to (email)</Label>
                    <Input
                      id="assignTo"
                      type="email"
                      placeholder="Leave empty for yourself"
                      value={fieldEmail}
                      onChange={(e) => setFieldEmail(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter recipient email to assign field, or leave empty to assign to yourself
                    </p>
                  </div>
                  
                  <div>
                    <Button className="w-full mt-2">
                      Send Document for Signing
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 