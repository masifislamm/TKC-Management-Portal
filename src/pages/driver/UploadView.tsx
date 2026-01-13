import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Camera, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

interface UploadViewProps {
  activeDeliveries: any[];
  initialDeliveryId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function UploadView({ 
  activeDeliveries, 
  initialDeliveryId, 
  onCancel, 
  onSuccess 
}: UploadViewProps) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const confirmDelivery = useMutation(api.deliveries.confirmDelivery);

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(initialDeliveryId || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialDeliveryId) {
      setSelectedDeliveryId(initialDeliveryId);
    }
  }, [initialDeliveryId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedDeliveryId) {
      toast.error("Please select a delivery order");
      return;
    }
    if (!file) {
      toast.error("Please upload a proof of delivery");
      return;
    }

    setIsSubmitting(true);
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

      // 3. Confirm delivery
      await confirmDelivery({
        id: selectedDeliveryId as Id<"deliveryOrders">,
        deliveryProof: storageId,
        notes: notes,
      });

      toast.success("Delivery proof submitted successfully!");
      onSuccess();
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit proof. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Delivery Proof</h1>
        <p className="text-gray-500 text-sm mt-1">Take or upload a photo of the signed delivery slip</p>
      </div>

      <div className="space-y-4">
        {/* Select Delivery */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <label className="text-sm font-medium text-gray-900 mb-2 block">Select Delivery Order</label>
            <Select value={selectedDeliveryId} onValueChange={setSelectedDeliveryId}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-12">
                <SelectValue placeholder="Select a delivery..." />
              </SelectTrigger>
              <SelectContent>
                {activeDeliveries.length === 0 ? (
                  <SelectItem value="none" disabled>No active deliveries</SelectItem>
                ) : (
                  activeDeliveries.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.deliveryOrderId || "NO-ID"} - {d.clientName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <label className="text-sm font-medium text-gray-900 mb-2 block">Upload Proof</label>
            
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 mb-4 min-h-[200px]">
              {previewUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={previewUrl} alt="Preview" className="max-h-[200px] rounded-lg object-contain" />
                  <button 
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No file selected</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                ref={cameraInputRef}
                onChange={handleFileSelect}
              />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              
              <Button 
                variant="outline" 
                className="h-12 border-gray-200"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <Button 
                variant="outline" 
                className="h-12 border-gray-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <label className="text-sm font-medium text-gray-900 mb-2 block">Additional Notes (Optional)</label>
            <Textarea 
              placeholder="Add any special notes about this delivery..."
              className="bg-gray-50 border-gray-200 min-h-[100px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            variant="outline" 
            className="h-12 border-gray-200"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmitProof}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Proof"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
