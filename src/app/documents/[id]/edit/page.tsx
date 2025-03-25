"use client";

import { useEffect, useState, useRef } from "react";
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
import { ensureStorageBuckets } from "@/lib/utils";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type FormField = Database["public"]["Tables"]["form_fields"]["Row"];

export default function DocumentEditPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldEmail, setFieldEmail] = useState("");
  const [currentFieldType, setCurrentFieldType] = useState<"signature" | "text" | "date">("signature");
  const [fields, setFields] = useState<FormField[]>([]);
  
  // Reference to the PDF container for position calculations
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize Supabase client
  const supabase = createSupabaseClient();

  // Fetch document details and fields
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
        
        // Get signed URL for the PDF - using a longer duration to prevent refreshing issues
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from("documents")
          .createSignedUrl(docData.file_path, 7200); // 2 hours expiry
        
        if (urlError) {
          console.error("Error getting signed URL:", urlError);
          throw urlError;
        }
        
        console.log("PDF URL generated:", urlData.signedUrl);
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

  const handleAddField = async (type: "signature" | "text" | "date", position: { x: number, y: number }) => {
    try {
      // Default field dimensions
      const width = type === "signature" ? 150 : 120;
      const height = type === "signature" ? 60 : 40;
      
      // Get the user ID from the session or use the assigned email
      let assignedTo = null;
      
      if (fieldEmail.trim()) {
        // Use email directly
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
      const { data: fieldData, error } = await supabase
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
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update fields state with the new field
      if (fieldData) {
        setFields([...fields, fieldData]);
      }
      
      toast.success(`${type} field added`);
      
      // Clear email field after adding
      setFieldEmail("");
    } catch (error) {
      console.error("Error adding field:", error);
      toast.error("Failed to add field");
    }
  };

  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pdfContainerRef.current) return;
    
    // Get click position relative to the PDF container
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Adding ${currentFieldType} field at position (${x}, ${y})`);
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
                  Click anywhere on the document to add a {currentFieldType} field
                </p>
              </div>
              
              <div 
                className="bg-white rounded-lg shadow overflow-hidden relative" 
                style={{ height: "750px" }}
                ref={pdfContainerRef}
                onClick={handlePdfClick}
              >
                {/* PDF iframe */}
                {pdfUrl ? (
                  <iframe 
                    src={`${pdfUrl}#toolbar=0&view=FitH&scrollbar=0`}
                    className="w-full h-full border-0 pointer-events-none"
                    title="Document preview"
                    onLoad={() => console.log("PDF iframe loaded")}
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

                  <div className="border rounded-md p-3 bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">Added Fields ({fields.length})</h4>
                    {fields.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {fields.map((field, index) => (
                          <li key={field.id} className="text-xs text-gray-600">
                            {index + 1}. {field.field_type} field for {field.assigned_to}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No fields added yet</p>
                    )}
                  </div>
                  
                  <div>
                    <Button 
                      className="w-full mt-2"
                      disabled={fields.length === 0}
                      onClick={() => router.push(`/documents/${documentId}`)}
                    >
                      Finish Editing
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