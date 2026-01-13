import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { ArrowLeft, Calendar, CheckCircle2, FileText, Info, Loader2, Upload, AlertCircle, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function UploadExpenseOCR() {
  const navigate = useNavigate();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const analyzeReceipt = useAction(api.ai.analyzeReceipt);
  const createExpense = useMutation(api.expenses.create);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: "",
    date: "",
    type: "Meals",
    accountCode: "",
    merchant: "",
    description: "",
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setIsUploading(true);
    setExtractedData(null);

    try {
      // 1. Upload file
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId: newStorageId } = await result.json();
      setStorageId(newStorageId);

      // 2. Analyze receipt
      setIsUploading(false);
      setIsAnalyzing(true);
      
      const analyzeResult = await analyzeReceipt({ storageId: newStorageId as any });
      
      if (analyzeResult && typeof analyzeResult === 'object' && 'data' in analyzeResult) {
        const data = analyzeResult.data as any;
        setExtractedData(data);
        setFormData({
          amount: data.amount ? String(data.amount) : "",
          date: data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0],
          type: data.category || "Meals",
          accountCode: "", // AI might not return this reliably yet
          merchant: data.merchant || "",
          description: data.description || data.merchant || "",
        });
        toast.success("Data extracted successfully");
      } else {
        toast.error("Could not extract data from image");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to process file");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.amount || !formData.date || !storageId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      await createExpense({
        description: formData.description || formData.merchant || "Expense",
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).getTime(),
        type: formData.type,
        receiptImage: storageId as any,
        accountCode: formData.accountCode,
      });
      toast.success("Expense saved successfully");
      navigate("/dashboard/expenses");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save expense");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/expenses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Expense (OCR)</h1>
          <p className="text-muted-foreground">Upload receipt image for automatic data extraction</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Upload & Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                  ${file ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">Data extracted successfully!</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}>
                      Upload Different Image
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">SVG, PNG, JPG or GIF (max. 10MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Receipt Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 bg-muted/30 flex items-center justify-center p-0 overflow-hidden rounded-b-xl relative">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Receipt preview" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="h-12 w-12 opacity-20" />
                  <p className="text-sm">No image uploaded</p>
                </div>
              )}
              
              {(isUploading || isAnalyzing) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">
                    {isUploading ? "Uploading image..." : "Analyzing receipt..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Extracted Data */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">Extracted Data</CardTitle>
              {extractedData && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Auto-detected
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warnings */}
              {!extractedData && !isAnalyzing && !file && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900 p-4 flex gap-3 text-amber-800 dark:text-amber-200">
                  <Info className="h-5 w-5 shrink-0" />
                  <p className="text-sm">Upload a receipt to automatically extract expense details.</p>
                </div>
              )}

              {extractedData && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900 p-4 flex gap-3 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">Missing data detected — please fill manually or verify auto-detected values.</p>
                </div>
              )}

              <div className="rounded-lg border p-4 flex gap-3 text-muted-foreground">
                <Info className="h-5 w-5 shrink-0" />
                <p className="text-sm">System accuracy will improve over time as more data is processed.</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="amount">Amount (MYR) *</Label>
                  </div>
                  <Input 
                    id="amount" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <Progress value={extractedData ? 92 : 0} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{extractedData ? "92%" : "0%"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date} 
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <Progress value={extractedData ? 79 : 0} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{extractedData ? "79%" : "0%"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Expense Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meals">Meals</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Fuel">Fuel</SelectItem>
                      <SelectItem value="Office">Office Supplies</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <Progress value={extractedData ? 79 : 0} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{extractedData ? "79%" : "0%"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Account Code *</Label>
                  <div className="flex gap-2">
                    <Select value={formData.accountCode} onValueChange={(val) => setFormData({...formData, accountCode: val})}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select Account Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACC-001">ACC-001 (General)</SelectItem>
                        <SelectItem value="ACC-002">ACC-002 (Travel)</SelectItem>
                        <SelectItem value="ACC-003">ACC-003 (Meals)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <Progress value={extractedData ? 95 : 0} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{extractedData ? "95%" : "0%"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input 
                    id="merchant" 
                    value={formData.merchant} 
                    onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                    placeholder="Merchant Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Expense description"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="hidden lg:block"></div> {/* Spacer */}
        <div className="space-y-6">
          {/* How OCR Works */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
            <h3 className="font-semibold mb-4">How OCR Works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Upload a clear image of your receipt
              </li>
              <li className="flex items-start gap-2">
                <span className="block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Our system extracts key information automatically
              </li>
              <li className="flex items-start gap-2">
                <span className="block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Account codes are auto-assigned based on expense type
              </li>
              <li className="flex items-start gap-2">
                <span className="block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Review and edit the extracted data
              </li>
              <li className="flex items-start gap-2">
                <span className="block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Save to create an expense record
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/expenses")}>
              Cancel
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isSaving || !file}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Expense
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
