"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/lib/supabase";

interface SignaturePadProps {
  userId: string;
  onSave?: (signatureUrl: string, signatureId: string) => void;
  onCancel?: () => void;
}

export default function SignaturePad({ userId, onSave, onCancel }: SignaturePadProps) {
  const [signatureName, setSignatureName] = useState("My Signature");
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  // Initialize Supabase client
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const saveSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please draw your signature first");
      return;
    }

    setIsSaving(true);

    try {
      // Convert signature to image data URL (PNG)
      const signatureDataUrl = signatureRef.current.toDataURL("image/png");
      
      // Convert data URL to Blob for upload
      const signatureBlob = await fetch(signatureDataUrl).then(r => r.blob());
      
      // Upload to Supabase Storage
      const fileName = `signatures/${userId}/${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(fileName, signatureBlob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL for the signature image
      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(fileName);

      const signatureUrl = urlData.publicUrl;

      // Save signature metadata in the database
      const { data: signatureData, error: signatureError } = await supabase
        .from("signatures")
        .insert({
          user_id: userId,
          name: signatureName,
          file_path: fileName,
          is_default: isDefault,
        })
        .select()
        .single();

      if (signatureError) {
        throw new Error(signatureError.message);
      }

      toast.success("Signature saved successfully");
      
      if (onSave && signatureData) {
        onSave(signatureUrl, signatureData.id);
      }
    } catch (error: any) {
      toast.error("Error saving signature: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Draw your signature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signatureName">Signature Name</Label>
          <Input
            id="signatureName"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="My Signature"
          />
        </div>
        
        <div className="border rounded-md p-2 bg-white">
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              className: "w-full h-40",
            }}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label htmlFor="isDefault" className="text-sm cursor-pointer">
            Set as default signature
          </Label>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" onClick={clearSignature} disabled={isSaving}>
            Clear
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="ml-2" disabled={isSaving}>
              Cancel
            </Button>
          )}
        </div>
        <Button onClick={saveSignature} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Signature"}
        </Button>
      </CardFooter>
    </Card>
  );
} 