import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, FileUp, Loader2, Check, AlertCircle, Download } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import Papa from "papaparse";
import { Badge } from "@/components/ui/badge";

interface InvoiceRow {
  clientName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  deliveryOrder?: string; // DO Number to match
  status: "valid" | "invalid";
  error?: string;
  matchedDOId?: Id<"deliveryOrders">;
}

export default function GenerateInvoiceFromSummary() {
  const navigate = useNavigate();
  const createBulk = useMutation(api.invoices.createBulk);
  const pendingDeliveries = useQuery(api.deliveries.getPendingDeliveries);
  
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData: InvoiceRow[] = results.data.map((row: any) => {
          const quantity = parseFloat(row.quantity) || 0;
          const unitPrice = parseFloat(row.unitPrice) || 0;
          const total = quantity * unitPrice;
          
          // Try to find matching DO
          let matchedDOId: Id<"deliveryOrders"> | undefined;
          if (row.deliveryOrder && pendingDeliveries) {
            const match = pendingDeliveries.find(d => d.deliveryOrderId === row.deliveryOrder);
            if (match) matchedDOId = match._id;
          }

          const isValid = row.clientName && quantity > 0 && unitPrice > 0;

          return {
            clientName: row.clientName || "",
            description: row.description || "",
            quantity,
            unit: row.unit || "unit",
            unitPrice,
            total,
            deliveryOrder: row.deliveryOrder,
            status: isValid ? "valid" : "invalid",
            error: !isValid ? "Missing required fields" : undefined,
            matchedDOId
          };
        });
        setData(parsedData);
      },
      error: (error: Error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleGenerate = async () => {
    const validRows = data.filter(r => r.status === "valid");
    if (validRows.length === 0) {
      toast.error("No valid rows to process");
      return;
    }

    setIsSubmitting(true);
    try {
      const invoicesToCreate = validRows.map(row => ({
        clientName: row.clientName,
        items: [{
          description: row.description,
          quantity: row.quantity,
          unit: row.unit,
          unitPrice: row.unitPrice,
          total: row.total
        }],
        deliveryOrderId: row.matchedDOId,
        dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // Default 30 days
        source: "summary_file",
        taxRate: 0,
        paymentTerms: "Net 30 Days"
      }));

      await createBulk({ invoices: invoicesToCreate });
      
      toast.success(`Successfully created ${invoicesToCreate.length} invoices`);
      navigate("/dashboard/invoices");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate invoices");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "clientName,description,quantity,unit,unitPrice,deliveryOrder\n"
      + "Acme Corp,Haulage Service,10,ton,150,DO-2024-1234";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "invoice_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generate Invoices from Summary</h1>
          <p className="text-muted-foreground">Upload a CSV file to bulk generate invoices</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-muted/50 hover:bg-muted/80 transition-colors">
              <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Upload your CSV summary file here.<br/>
                Supported columns: clientName, description, quantity, unit, unitPrice, deliveryOrder
              </p>
              <div className="flex gap-4">
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileUpload} 
              />
              {file && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                  <Check className="h-4 w-4 text-green-500" />
                  {file.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {data.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Preview Data</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {data.filter(r => r.status === "valid").length} Valid
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {data.filter(r => r.status === "invalid").length} Invalid
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>DO Match</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.clientName}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>{row.quantity} {row.unit}</TableCell>
                        <TableCell>RM {row.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>RM {row.total.toFixed(2)}</TableCell>
                        <TableCell>
                          {row.matchedDOId ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Matched
                            </Badge>
                          ) : row.deliveryOrder ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              {row.deliveryOrder} (Not Found)
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.status === "valid" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-red-500 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              {row.error}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 flex justify-end gap-4">
                <Button variant="outline" onClick={() => { setFile(null); setData([]); }}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isSubmitting || data.filter(r => r.status === "valid").length === 0}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
