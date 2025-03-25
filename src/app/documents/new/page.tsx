"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/lib/supabase";

export default function NewDocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  // Initialize Supabase client
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a PDF
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      
      // Use file name as default document name if not already set
      if (!documentName) {
        setDocumentName(selectedFile.name.replace(/\.pdf$/, ""));
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (!documentName.trim()) {
      toast.error("Please enter a document name");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      const userId = session.user.id;
      
      // Upload the file to Supabase Storage
      const fileName = `documents/${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, {
          contentType: "application/pdf",
          upsert: true,
        });
      
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      // Insert document record in the database
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          name: documentName,
          status: "draft",
          created_by: userId,
          file_path: fileName,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (documentError) {
        throw new Error(documentError.message);
      }
      
      toast.success("Document uploaded successfully");
      
      // Redirect to document edit page to add fields
      router.push(`/documents/${documentData.id}/edit`);
    } catch (error: any) {
      toast.error("Error uploading document: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push("/dashboard")}
        >
          ← Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
            <CardDescription>
              Upload a PDF document to add signature fields
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentName">Document Name</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Contract Agreement"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Upload PDF</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-gray-500">
                  Only PDF files are supported
                </p>
              </div>
              
              {file && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium">Selected file:</p>
                  <p className="text-sm">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 