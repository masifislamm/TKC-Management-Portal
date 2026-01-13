import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation, useAction } from "convex/react";
import { ArrowLeft, Edit, Download, Send, CheckCircle2, Clock, FileText, Trash2, Loader2, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(
    api.invoices.getById,
    id ? { id: id as Id<"invoices"> } : "skip",
  );
  const deliveryOrder = useQuery(
    api.deliveries.getById,
    invoice?.deliveryOrderId ? { id: invoice.deliveryOrderId } : "skip",
  );
  const updateStatus = useMutation(api.invoices.updateStatus);
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);
  const [isSending, setIsSending] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    setIsPrinting(true);
    // Create a hidden iframe to trigger the print
    const existingIframe = document.getElementById('print-frame');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-frame';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = `/print/invoices/${invoice._id}`;
    
    // Reset loading state after a delay to allow content to load and print dialog to trigger
    iframe.onload = () => {
      setTimeout(() => setIsPrinting(false), 2000);
    };
    
    document.body.appendChild(iframe);
  };

  const handleSendToClient = async () => {
    setIsSending(true);
    try {
      await updateStatus({ id: invoice._id, status: "sent" });
      toast.success("Invoice sent to client");
    } catch (error) {
      toast.error("Failed to send invoice");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteInvoice = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoice({ id: invoice._id });
      toast.success("Invoice deleted successfully");
      navigate("/dashboard/invoices");
    } catch (error) {
      toast.error("Failed to delete invoice");
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-500/10 text-green-600 border-green-200";
      case "approved": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "pending": return "bg-orange-500/10 text-orange-600 border-orange-200";
      case "draft": return "bg-gray-500/10 text-gray-600 border-gray-200";
      case "paid": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "overdue": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/invoices")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Invoice Details</h1>
                <p className="text-sm text-muted-foreground">{invoice.invoiceId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(invoice.status)}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditOpen(true)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF} disabled={isPrinting}>
                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Print / Save PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button 
                size="sm" 
                className="gap-2 bg-blue-600 hover:bg-blue-700" 
                onClick={handleSendToClient}
                disabled={isSending || invoice.status === "sent"}
              >
                <Send className="h-4 w-4" />
                {invoice.status === "sent" ? "Sent" : "Send to Client"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card className="shadow-sm">
          <CardContent className="p-12">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-4xl font-bold text-blue-600 mb-4">INVOICE</h2>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">TKC System</p>
                  <p className="text-muted-foreground">456 Industrial Avenue</p>
                  <p className="text-muted-foreground">Pretoria, South Africa</p>
                  <p className="text-muted-foreground">VAT: 4001234567</p>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Invoice Number</p>
                  <p className="text-lg font-bold">{invoice.invoiceId}</p>
                </div>
                {deliveryOrder && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">DO Reference</p>
                    <p className="font-medium">{deliveryOrder.deliveryOrderId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3">Bill To:</p>
                <div className="space-y-1">
                  <p className="font-bold text-lg">{invoice.clientName}</p>
                  {invoice.clientAddress && (
                    <p className="text-sm text-muted-foreground">{invoice.clientAddress}</p>
                  )}
                  {invoice.clientEmail && (
                    <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Issue Date</span>
                  <span className="font-medium">{formatDate(invoice._creationTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Terms</span>
                  <span className="font-medium">{invoice.paymentTerms || "Net 30 Days"}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Qty</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Unit</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-4 px-4">{item.description}</td>
                      <td className="py-4 px-4 text-center">{item.quantity}</td>
                      <td className="py-4 px-4 text-center">{item.unit}</td>
                      <td className="py-4 px-4 text-right">RM {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 px-4 text-right font-medium">RM {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>RM {invoice.items.reduce((sum, item) => sum + item.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {invoice.taxRate && invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT ({invoice.taxRate}%)</span>
                    <span>RM {(invoice.items.reduce((sum, item) => sum + item.total, 0) * (invoice.taxRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount Due</span>
                  <span>RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-muted/30 p-6 rounded-lg space-y-2">
              <p className="font-semibold text-sm mb-3">Payment Instructions</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Bank: First National Bank</p>
                <p>Account Name: TKC System (Pty) Ltd</p>
                <p>Account Number: 1234567890</p>
                <p>Branch Code: 250655</p>
                <p>Reference: {invoice.invoiceId}</p>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-8">
              Thank you for your business. Payment is due within net 30 days.
            </div>
          </CardContent>
        </Card>

        {/* Status & Actions Card */}
        <Card className="mt-6 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Invoice Status & Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                <p className="font-medium text-sm">Invoice {invoice.status === "draft" ? "Created" : "Approved"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(invoice._creationTime)}</p>
              </div>
              <div className={`flex flex-col items-center justify-center p-6 rounded-lg border ${invoice.status === "sent" || invoice.status === "paid" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                <Send className={`h-8 w-8 mb-2 ${invoice.status === "sent" || invoice.status === "paid" ? "text-green-600" : "text-gray-400"}`} />
                <p className="font-medium text-sm">{invoice.status === "sent" || invoice.status === "paid" ? "Sent" : "Not Sent"}</p>
                <p className="text-xs text-muted-foreground">{invoice.status === "sent" || invoice.status === "paid" ? "Delivered to client" : 'Click "Send to Client" above'}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <p className="font-medium text-sm">PDF Available</p>
                <p className="text-xs text-muted-foreground">Ready for download</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog (placeholder) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Invoice editing functionality coming soon.</p>
            <Button onClick={() => setIsEditOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoice.invoiceId}? This action cannot be undone.
              {invoice.deliveryOrderId && " The linked delivery order will be reset to 'delivered' status."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Invoice"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}