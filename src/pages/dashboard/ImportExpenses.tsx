import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight, 
  Download, 
  FileSpreadsheet, 
  Upload, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

// Define the shape of our imported data
interface ImportedExpense {
  Date: string | number;
  "Employee Name": string;
  "Expense Type": string;
  Merchant: string;
  Amount: number;
  Description?: string;
}

interface ParsedExpense {
  date: number;
  submittedBy: Id<"users">;
  submittedByName: string;
  type: string;
  description: string;
  amount: number;
  isValid: boolean;
  error?: string;
}

export default function ImportExpenses() {
  const navigate = useNavigate();
  const createBulk = useMutation(api.expenses.createBulk);
  const users = useQuery(api.users.getAll);
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExpense[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file || !users) return;
    
    setIsProcessing(true);
    
    try {
      const XLSX = await import("xlsx");
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as ImportedExpense[];
          
          const processed: ParsedExpense[] = jsonData.map((row: ImportedExpense, index: number) => {
            // Find user
            const user = users.find(u => 
              u.name?.toLowerCase() === row["Employee Name"]?.toLowerCase() || 
              u.email?.toLowerCase() === row["Employee Name"]?.toLowerCase()
            );
            
            // Parse date (Excel dates can be tricky)
            let dateTimestamp = Date.now();
            if (row.Date) {
              if (typeof row.Date === 'number') {
                // Excel serial date
                dateTimestamp = new Date((row.Date - (25567 + 2)) * 86400 * 1000).getTime();
              } else {
                dateTimestamp = new Date(row.Date).getTime();
              }
            }

            const isValid = !!user && !!row.Amount && !!row["Expense Type"];
            let error = "";
            if (!user) error = "Employee not found";
            else if (!row.Amount) error = "Invalid amount";
            
            return {
              date: dateTimestamp,
              submittedBy: user?._id as Id<"users"> || "" as Id<"users">, // Will be filtered if invalid
              submittedByName: row["Employee Name"],
              type: row["Expense Type"] || "Other",
              description: row.Merchant || row.Description || "Imported Expense",
              amount: Number(row.Amount) || 0,
              isValid,
              error
            };
          });

          setParsedData(processed);
          setStep(3); // Skip mapping for now as we assume template format, go to preview
        } catch (error) {
          console.error(error);
          toast.error("Failed to parse Excel file");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Failed to load Excel processor", error);
      toast.error("Failed to load Excel processor");
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const validExpenses = parsedData.filter(d => d.isValid);
    
    if (validExpenses.length === 0) {
      toast.error("No valid expenses to import");
      return;
    }

    setIsProcessing(true);
    try {
      await createBulk({
        expenses: validExpenses.map(e => ({
          date: e.date,
          submittedBy: e.submittedBy,
          type: e.type,
          description: e.description,
          amount: e.amount,
        }))
      });
      toast.success(`Successfully imported ${validExpenses.length} expenses`);
      navigate("/dashboard/expenses");
    } catch (error) {
      console.error(error);
      toast.error("Failed to import expenses");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const template = [
        {
          "Date": "2024-01-15",
          "Employee Name": "John Doe",
          "Expense Type": "Meals",
          "Merchant": "Restaurant ABC",
          "Amount": 50.00,
          "Description": "Lunch with client"
        }
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");
      XLSX.writeFile(wb, "expense_template.xlsx");
    } catch (error) {
      console.error("Failed to download template", error);
      toast.error("Failed to generate template");
    }
  };

  const totalAmount = parsedData.reduce((sum, item) => sum + (item.isValid ? item.amount : 0), 0);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/expenses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Excel Expense Sheet</h1>
          <p className="text-muted-foreground">Bulk import expenses from spreadsheet</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between max-w-3xl mx-auto mb-8">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
          </div>
          <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>Upload File</span>
        </div>
        <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
          </div>
          <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>Map Columns</span>
        </div>
        <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
          <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>Preview & Import</span>
        </div>
      </div>

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Upload Excel File</h3>
                  <p className="text-sm text-muted-foreground mt-1">Upload your expense spreadsheet (.xlsx, .xls, .csv)</p>
                </div>
                <Input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs">
                  <Upload className="mr-2 h-4 w-4" /> Choose File
                </Button>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
              </div>
              
              {file && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={processFile} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue to Preview
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template & Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Download our template to ensure correct formatting:</p>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" /> Download Template
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Required columns:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Date (YYYY-MM-DD)</li>
                  <li>• Employee Name (Must match system user name)</li>
                  <li>• Expense Type (Fuel, Meals, etc.)</li>
                  <li>• Amount</li>
                  <li>• Merchant (Optional)</li>
                  <li>• Description (Optional)</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex gap-3 text-sm text-orange-800 dark:text-orange-200">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>Ensure all amounts are in MYR and dates follow the correct format. Employee names must match exactly with registered users.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preview Import Data</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review {parsedData.length} expense records before importing
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">RM {totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Expense Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow key={index} className={!row.isValid ? "bg-red-50 dark:bg-red-900/10" : ""}>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>{row.submittedByName}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell className="text-right">RM {row.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {row.isValid ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valid</Badge>
                        ) : (
                          <Badge variant="destructive">{row.error}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" onClick={() => { setStep(1); setFile(null); }}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isProcessing || parsedData.filter(d => d.isValid).length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {parsedData.filter(d => d.isValid).length} Expenses
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}