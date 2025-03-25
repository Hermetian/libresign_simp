"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SignaturePad from "./SignaturePad";
import { Database } from "@/lib/supabase";

type Signature = Database["public"]["Tables"]["signatures"]["Row"];

interface SignatureManagerProps {
  userId: string;
  onSelectSignature?: (signatureUrl: string, signatureId: string) => void;
  selectedSignatureId?: string;
}

export default function SignatureManager({ userId, onSelectSignature, selectedSignatureId }: SignatureManagerProps) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSignatures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("signatures")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setSignatures(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error fetching signatures: " + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) {
      fetchSignatures();
    }
  }, [userId, fetchSignatures]);

  const handleSignatureSaved = (signatureUrl: string, signatureId: string) => {
    setSignatureDialogOpen(false);
    fetchSignatures();
    
    if (onSelectSignature) {
      onSelectSignature(signatureUrl, signatureId);
    }
  };

  const handleSelectSignature = (signature: Signature) => {
    if (onSelectSignature) {
      const { data } = supabase.storage
        .from("signatures")
        .getPublicUrl(signature.file_path);
      
      onSelectSignature(data.publicUrl, signature.id);
    }
  };

  const handleDeleteSignature = async (signatureId: string) => {
    try {
      // Find the signature to be deleted
      const signatureToDelete = signatures.find(sig => sig.id === signatureId);
      
      if (!signatureToDelete) {
        return;
      }
      
      // Delete from database
      const { error: deleteDbError } = await supabase
        .from("signatures")
        .delete()
        .eq("id", signatureId);
      
      if (deleteDbError) {
        throw new Error(deleteDbError.message);
      }
      
      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from("signatures")
        .remove([signatureToDelete.file_path]);
      
      if (deleteStorageError) {
        console.error("Error deleting file from storage:", deleteStorageError);
      }
      
      toast.success("Signature deleted");
      fetchSignatures();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error deleting signature: " + errorMessage);
    }
  };

  const setDefaultSignature = async (signatureId: string) => {
    try {
      // Clear default from all signatures
      await supabase
        .from("signatures")
        .update({ is_default: false })
        .eq("user_id", userId);
      
      // Set new default
      const { error } = await supabase
        .from("signatures")
        .update({ is_default: true })
        .eq("id", signatureId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Default signature updated");
      fetchSignatures();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error updating default signature: " + errorMessage);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Your Signatures</h3>
        <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Signature</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <SignaturePad 
              userId={userId} 
              onSave={handleSignatureSaved} 
              onCancel={() => setSignatureDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading signatures...</div>
      ) : signatures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-gray-500 mb-4">You don&apos;t have any signatures yet</p>
            <Button onClick={() => setSignatureDialogOpen(true)}>
              Create Your First Signature
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatures.map((signature) => {
            const { data } = supabase.storage
              .from("signatures")
              .getPublicUrl(signature.file_path);
            
            const isSelected = selectedSignatureId === signature.id;
            
            return (
              <Card 
                key={signature.id} 
                className={`cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleSelectSignature(signature)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex justify-between items-center">
                    <span>{signature.name}</span>
                    {signature.is_default && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Default</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-20 bg-white rounded border flex items-center justify-center p-2">
                    <Image 
                      src={data.publicUrl} 
                      alt={signature.name} 
                      width={200} 
                      height={60} 
                      className="object-contain h-full" 
                      unoptimized
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSignature(signature.id);
                      }}
                    >
                      Delete
                    </Button>
                    {!signature.is_default && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultSignature(signature.id);
                        }}
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 