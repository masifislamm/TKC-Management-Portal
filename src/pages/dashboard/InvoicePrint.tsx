import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function InvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(
    api.invoices.getById,
    id ? { id: id as Id<"invoices"> } : "skip",
  );
  const deliveryOrder = useQuery(
    api.deliveries.getById,
    invoice?.deliveryOrderId ? { id: invoice.deliveryOrderId } : "skip",
  );

  useEffect(() => {
    if (invoice && (invoice.deliveryOrderId ? deliveryOrder : true)) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [invoice, deliveryOrder]);

  if (!invoice) {
    return <div className="p-8">Loading invoice...</div>;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-[210mm] mx-auto">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden mb-8 flex justify-end gap-4">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" onClick={() => window.close()}>
          Close
        </Button>
      </div>

      {/* Invoice Content */}
      <div className="invoice-content">
        {/* Header */}
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
        <div className="grid grid-cols-2 gap-8 mb-12">
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
          <div className="space-y-3 text-right">
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
            <thead className="bg-muted/50 border-b-2 border-black">
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
                <tr key={index} className="border-b border-gray-200">
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
            <div className="border-t border-black my-2"></div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount Due</span>
              <span>RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-2 border border-gray-200 break-inside-avoid">
          <p className="font-semibold text-sm mb-3">Payment Instructions</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Bank: First National Bank</p>
            <p>Account Name: TKC System (Pty) Ltd</p>
            <p>Account Number: 1234567890</p>
            <p>Branch Code: 250655</p>
            <p>Reference: {invoice.invoiceId}</p>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-12">
          Thank you for your business. Payment is due within {invoice.paymentTerms || "net 30 days"}.
        </div>
      </div>
    </div>
  );
}
