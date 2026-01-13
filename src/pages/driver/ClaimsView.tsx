import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Camera, CheckCircle2, Clock, DollarSign, Image as ImageIcon, Loader2, Upload, X, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClaimsViewProps {
  activeDeliveries: any[];
  onBack: () => void;
}

export default function ClaimsView({ activeDeliveries, onBack }: ClaimsViewProps) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createExpense = useMutation(api.expenses.create);
  const recentClaims = useQuery(api.expenses.getMyRecentExpenses);

  const [claimType, setClaimType] = useState<string>("Fuel");
  const [amount, setAmount] = useState<string>("");
  const [deliveryId, setDeliveryId] = useState<string>("none");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!description) {
      toast.error("Please provide a description");
      return;
    }
    if (!file) {
      toast.error("Please upload a receipt");
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

      // 3. Create expense record
      await createExpense({
        description,
        amount: parseFloat(amount),
        date: Date.now(),
        type: claimType,
        receiptImage: storageId,
        deliveryOrderId: deliveryId !== "none" ? (deliveryId as Id<"deliveryOrders">) : undefined,
      });

      toast.success("Expense claim submitted successfully!");
      
      // Reset form
      setAmount("");
      setDescription("");
      setFile(null);
      setPreviewUrl(null);
      setDeliveryId("none");
      setClaimType("Fuel");
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit claim. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Expense Claim</h1>
          <p className="text-gray-500 text-sm">Upload receipts and claim expenses</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Form */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-gray-900">New Claim Details</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Claim Type *</label>
              <Select value={claimType} onValueChange={setClaimType}>
                <SelectTrigger className="bg-gray-50 border-gray-200 h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fuel">Fuel</SelectItem>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Tolls">Tolls</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount (MYR) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="pl-9 bg-gray-50 border-gray-200 h-12"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Related Delivery Order</label>
              <Select value={deliveryId} onValueChange={setDeliveryId}>
                <SelectTrigger className="bg-gray-50 border-gray-200 h-12">
                  <SelectValue placeholder="Select delivery order (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeDeliveries.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.deliveryOrderId || "NO-ID"} - {d.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <Textarea 
                placeholder="Provide details about this expense..."
                className="bg-gray-50 border-gray-200 min-h-[100px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Upload Receipts *</label>
              
              {previewUrl ? (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
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
                    Upload File
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-500">* Upload clear photos of receipts/invoices as proof</p>
            </div>

            <Button 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white mt-4"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Submit Claim
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Claims</h3>
          <div className="space-y-3">
            {!recentClaims ? (
              <div className="text-center py-4 text-gray-500">Loading claims...</div>
            ) : recentClaims.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-gray-100 text-gray-500">
                No recent claims found
              </div>
            ) : (
              recentClaims.map((claim) => (
                <Card key={claim._id} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="text-xs text-gray-500 block mb-0.5">
                          {new Date(claim.date).toLocaleDateString()}
                        </span>
                        <h4 className="font-bold text-gray-900">{claim.type}</h4>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        claim.status === "approved" ? "bg-green-100 text-green-700" :
                        claim.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-sm text-gray-600 line-clamp-1 flex-1 mr-4">{claim.description}</p>
                      <span className="font-bold text-gray-900">RM {claim.amount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-100 shadow-none">
          <CardContent className="p-4">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Claim Submission Tips:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4">
              <li>Always upload clear receipt photos</li>
              <li>Link expenses to delivery orders when possible</li>
              <li>Submit claims within 7 days of expense</li>
              <li>Approval usually takes 1-3 business days</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
