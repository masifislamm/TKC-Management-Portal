import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
  onUploadComplete: (storageId: string, url: string) => void;
  label?: string;
  accept?: string;
}

export function FileUpload({ onUploadComplete, label = "Upload File", accept = "image/*" }: FileUploadProps) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      
      // 3. Get public URL (optional, but useful for immediate display if needed, 
      // though we usually just pass storageId)
      // For now we just pass storageId and let the parent handle getting the URL if needed
      // But to be helpful we can construct a preview URL if we had the logic here.
      // We'll just pass storageId.
      
      // Actually, let's get the URL for the parent to use immediately if they want
      // We can't easily get the signed URL here without another query, 
      // so we'll just pass the storageId and let the parent query for the URL if needed.
      // Wait, the prop says `url`. Let's just pass a placeholder or fetch it if we really need.
      // For simplicity/speed, let's just pass storageId and the parent can use `api.files.getUrl`.
      
      onUploadComplete(storageId, URL.createObjectURL(file)); // Use local object URL for immediate preview
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {isUploading ? "Uploading..." : label}
      </Button>
    </div>
  );
}
