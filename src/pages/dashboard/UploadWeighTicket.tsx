import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { ArrowLeft, Info, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function UploadWeighTicket() {
  const navigate = useNavigate();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const analyzeWeighTicket = useAction(api.ai.analyzeWeighTicket);
  const createWeighTicket = useMutation(api.weighTickets.create);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    ticketNumber: "",
    truckNumber: "",
    tonnage: "",
    date: "",
    clientName: "",
    materialType: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId: newStorageId } = await result.json();
      setStorageId(newStorageId);
      setUploadedImage(URL.createObjectURL(file));
      
      // Analyze image
      setIsAnalyzing(true);
      const analysis = await analyzeWeighTicket({ storageId: newStorageId as any });
      
      if (analysis.data) {
        const data = analysis.data;
        setFormData({
          ticketNumber: data.ticketNumber || "",
          truckNumber: data.truckNumber || "",
          tonnage: data.tonnage?.toString() || "",
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          clientName: data.clientName || "",
          materialType: data.materialType || "",
        });
        toast.success("Data extracted successfully");
      } else {
        toast.error("Could not extract data from image");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload or analyze file");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!storageId) {
      toast.error("Please upload a weigh ticket first");
      return;
    }
    if (!formData.ticketNumber || !formData.tonnage) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    try {
      await createWeighTicket({
        ticketNumber: formData.ticketNumber,
        truckNumber: formData.truckNumber,
        tonnage: parseFloat(formData.tonnage),
        date: new Date(formData.date).getTime(),
        clientName: formData.clientName,
        materialType: formData.materialType,
        image: storageId as any,
      });
      toast.success("Weigh ticket saved successfully");
      navigate("/dashboard/deliveries");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save weigh ticket");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Weigh Ticket</h1>
          <p className="text-muted-foreground">Upload weighbridge ticket for automatic data extraction</p>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 text-sm text-blue-700">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <p>System accuracy will improve over time as more data is processed.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Upload */}
        <Card className="h-fit">
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Upload Weigh Ticket Image</h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] transition-colors ${
                uploadedImage ? 'border-primary/20 bg-primary/5' : 'border-muted-foreground/20 hover:bg-muted/50'
              }`}
            >
              {uploadedImage ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded ticket" 
                    className="max-h-[400px] object-contain rounded-lg shadow-sm" 
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => {
                      setUploadedImage(null);
                      setStorageId(null);
                      setFormData({
                        ticketNumber: "",
                        truckNumber: "",
                        tonnage: "",
                        date: "",
                        clientName: "",
                        materialType: "",
                      });
                    }}
                  >
                    <X className="mr-2 h-4 w-4" /> Remove Image
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium mb-1">Drag and drop weigh ticket here</h4>
                  <p className="text-sm text-muted-foreground mb-6">or</p>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Browse Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports JPG, PNG, PDF (Max 10MB)
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Form */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Extracted Data</h3>
                {isAnalyzing && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Analyzing...
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ticket Number *</Label>
                <Input 
                  placeholder="WT-2025-XXXX" 
                  value={formData.ticketNumber}
                  onChange={(e) => setFormData({...formData, ticketNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Truck Number *</Label>
                <Input 
                  placeholder="e.g., WRB-4567" 
                  value={formData.truckNumber}
                  onChange={(e) => setFormData({...formData, truckNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Tonnage (Tons) *</Label>
                <Input 
                  type="number" 
                  placeholder="0.0" 
                  value={formData.tonnage}
                  onChange={(e) => setFormData({...formData, tonnage: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Client *</Label>
                <Input 
                  placeholder="e.g., ABC Mining Corp" 
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Material Type *</Label>
                <Select 
                  value={formData.materialType} 
                  onValueChange={(val) => setFormData({...formData, materialType: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coal">Coal</SelectItem>
                    <SelectItem value="Iron Ore">Iron Ore</SelectItem>
                    <SelectItem value="Limestone">Limestone</SelectItem>
                    <SelectItem value="Gravel">Gravel</SelectItem>
                    <SelectItem value="Sand">Sand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/30 border-blue-100">
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Weigh Ticket OCR</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                <li>Upload clear image of weighbridge ticket</li>
                <li>System extracts tonnage and delivery info</li>
                <li>Verify extracted data for accuracy</li>
                <li>If OCR fails, enter manually</li>
                <li>Data used for driver salary calculation</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => navigate(-1)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSave}
              disabled={isSaving || !storageId}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Weigh Ticket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
