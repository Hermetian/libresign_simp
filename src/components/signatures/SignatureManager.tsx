"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase";
import { ensureStorageBuckets } from "@/lib/utils";
import type { Database } from "@/lib/supabase";

type Signature = Database["public"]["Tables"]["signatures"]["Row"];

interface SignatureManagerProps {
  userId: string;
}

export default function SignatureManager({ userId }: SignatureManagerProps) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  
  const supabase = createSupabaseClient();
  
  // Fetch user's signatures
  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        // Ensure buckets exist
        await ensureStorageBuckets(supabase);
        
        // Fetch signatures
        const { data, error } = await supabase
          .from("signatures")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        setSignatures(data || []);
      } catch (error) {
        console.error("Error fetching signatures:", error);
        toast.error("Failed to load signatures");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSignatures();
  }, [userId, supabase]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if it's a supported image type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG, JPEG, etc.)");
        return;
      }
      
      setSignatureFile(file);
      
      // Use file name as default signature name if not set
      if (!signatureName) {
        setSignatureName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };
  
  const handleUploadSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signatureFile) {
      toast.error("Please select a signature image");
      return;
    }
    
    if (!signatureName.trim()) {
      toast.error("Please enter a name for your signature");
      return;
    }
    
    setUploadingSignature(true);
    
    try {
      // Upload signature image to storage
      const filePath = `signatures/${userId}/${Date.now()}_${signatureFile.name.replace(/\s+/g, "_")}`;
      
      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(filePath, signatureFile, {
          contentType: signatureFile.type,
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Check if this is the first signature (to set as default)
      const isDefault = signatures.length === 0;
      
      // Create signature record in database
      const { data: signatureData, error: signatureError } = await supabase
        .from("signatures")
        .insert({
          user_id: userId,
          name: signatureName,
          file_path: filePath,
          is_default: isDefault,
        })
        .select()
        .single();
      
      if (signatureError) throw signatureError;
      
      // Add new signature to state
      setSignatures([signatureData, ...signatures]);
      
      // Reset form
      setSignatureName("");
      setSignatureFile(null);
      
      toast.success("Signature uploaded successfully");
    } catch (error) {
      console.error("Error uploading signature:", error);
      toast.error("Failed to upload signature");
    } finally {
      setUploadingSignature(false);
    }
  };
  
  const handleSetDefault = async (signatureId: string) => {
    try {
      // First, update all signatures to not be default
      await supabase
        .from("signatures")
        .update({ is_default: false })
        .eq("user_id", userId);
      
      // Then set the selected one as default
      await supabase
        .from("signatures")
        .update({ is_default: true })
        .eq("id", signatureId);
      
      // Update state
      setSignatures(signatures.map(sig => ({
        ...sig,
        is_default: sig.id === signatureId
      })));
      
      toast.success("Default signature updated");
    } catch (error) {
      console.error("Error setting default signature:", error);
      toast.error("Failed to update default signature");
    }
  };
  
  const handleDeleteSignature = async (signatureId: string, filePath: string) => {
    try {
      // Delete from database
      await supabase
        .from("signatures")
        .delete()
        .eq("id", signatureId);
      
      // Delete from storage
      await supabase.storage
        .from("signatures")
        .remove([filePath]);
      
      // Update state
      setSignatures(signatures.filter(sig => sig.id !== signatureId));
      
      toast.success("Signature deleted");
    } catch (error) {
      console.error("Error deleting signature:", error);
      toast.error("Failed to delete signature");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading signatures...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Upload new signature */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUploadSignature} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signatureName">Signature Name</Label>
              <Input
                id="signatureName"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="E.g. My Signature"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signatureFile">Upload Image</Label>
              <Input
                id="signatureFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <p className="text-xs text-gray-500">
                Upload an image of your signature (PNG, JPEG, etc.)
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={uploadingSignature}>
              {uploadingSignature ? "Uploading..." : "Upload Signature"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Existing signatures */}
      <div>
        <h3 className="text-lg font-medium mb-4">Your Signatures</h3>
        
        {signatures.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">
              You don&apos;t have any signatures yet. Upload one above to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signatures.map((signature) => (
              <Card key={signature.id} className={`${signature.is_default ? 'border-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{signature.name}</h4>
                        {signature.is_default && (
                          <span className="text-xs text-blue-600 font-medium">Default Signature</span>
                        )}
                      </div>
                      <div className="space-x-2">
                        {!signature.is_default && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetDefault(signature.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteSignature(signature.id, signature.file_path)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {/* Signature Preview */}
                    <div className="border rounded-md p-4 bg-gray-50 h-32 flex items-center justify-center">
                      <SignaturePreview filePath={signature.file_path} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Component to handle signature preview with URL fetching
function SignaturePreview({ filePath }: { filePath: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const supabase = createSupabaseClient();
  
  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const { data } = await supabase.storage
          .from("signatures")
          .createSignedUrl(filePath, 3600);
        
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        }
      } catch (error) {
        console.error("Error fetching signature image:", error);
      }
    };
    
    fetchImageUrl();
  }, [filePath, supabase]);
  
  if (!imageUrl) {
    return <div className="text-sm text-gray-400">Loading signature...</div>;
  }
  
  return (
    <Image
      src={imageUrl}
      alt="Signature"
      width={200}
      height={80}
      className="max-h-full max-w-full object-contain"
      unoptimized={true} // Required for external URLs with signed tokens
    />
  );
} 