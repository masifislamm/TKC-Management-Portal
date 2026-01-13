"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateInvoicePDF = action({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; html: string; filename: string }> => {
    // Fetch invoice data
    const invoice = await ctx.runQuery(api.invoices.getById, { id: args.invoiceId });
    
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Fetch delivery order if linked
    let deliveryOrder = null;
    if (invoice.deliveryOrderId) {
      deliveryOrder = await ctx.runQuery(api.deliveries.getById, { id: invoice.deliveryOrderId });
    }

    // Generate HTML content for the PDF
    const htmlContent = generateInvoiceHTML(invoice, deliveryOrder);

    // For now, return the HTML content
    // In production, you would use a PDF generation library like puppeteer or jsPDF
    return {
      success: true,
      html: htmlContent,
      filename: `${invoice.invoiceId || 'invoice'}.pdf`,
    };
  },
});

function generateInvoiceHTML(invoice: any, deliveryOrder: any): string {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const subtotal = invoice.items.reduce((sum: number, item: any) => sum + item.total, 0);
  const taxAmount = invoice.taxRate ? subtotal * (invoice.taxRate / 100) : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceId}</title>
  <style>
    @media print {
      @page { margin: 20mm; }
      body { margin: 0; -webkit-print-color-adjust: exact; }
      .invoice-container { padding: 0 !important; border: none !important; }
    }
    body { margin: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; }
    .invoice-container { 
      padding: 40px; 
      color: #333; 
      background-color: #fff; 
      width: 100%; 
      max-width: 210mm; 
      margin: 0 auto; 
      box-sizing: border-box; 
      min-height: 297mm;
    }
    .invoice-container .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-container .company-info { font-size: 14px; }
    .invoice-container .invoice-title { font-size: 36px; font-weight: bold; color: #2563eb; margin-bottom: 20px; }
    .invoice-container .invoice-meta { text-align: right; }
    .invoice-container .section { margin-bottom: 30px; }
    .invoice-container .section-title { font-size: 12px; color: #666; margin-bottom: 10px; font-weight: bold; }
    .invoice-container table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .invoice-container th { background-color: #f3f4f6; padding: 12px; text-align: left; font-size: 14px; border-bottom: 2px solid #e5e7eb; }
    .invoice-container td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .invoice-container .text-right { text-align: right; }
    .invoice-container .totals { margin-left: auto; width: 300px; margin-top: 20px; }
    .invoice-container .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .invoice-container .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; }
    .invoice-container .payment-info { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px; page-break-inside: avoid; }
    .invoice-container .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <div class="invoice-title">INVOICE</div>
        <p><strong>TKC System</strong></p>
        <p>456 Industrial Avenue</p>
        <p>Pretoria, South Africa</p>
        <p>VAT: 4001234567</p>
      </div>
      <div class="invoice-meta">
        <p><strong>Invoice Number:</strong> ${invoice.invoiceId}</p>
        ${deliveryOrder ? `<p><strong>DO Reference:</strong> ${deliveryOrder.deliveryOrderId}</p>` : ''}
        <p><strong>Issue Date:</strong> ${formatDate(invoice._creationTime)}</p>
        <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">BILL TO:</div>
      <p><strong>${invoice.clientName}</strong></p>
      ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
      ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item: any) => `
          <tr>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${item.unit}</td>
            <td class="text-right">RM ${item.unitPrice.toFixed(2)}</td>
            <td class="text-right">RM ${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>RM ${subtotal.toFixed(2)}</span>
      </div>
      ${invoice.taxRate ? `
      <div class="totals-row">
        <span>VAT (${invoice.taxRate}%):</span>
        <span>RM ${taxAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="totals-row total-final">
        <span>Total Amount Due:</span>
        <span>RM ${invoice.amount.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <p><strong>Payment Instructions</strong></p>
      <p>Bank: First National Bank</p>
      <p>Account Name: TKC System (Pty) Ltd</p>
      <p>Account Number: 1234567890</p>
      <p>Branch Code: 250655</p>
      <p>Reference: ${invoice.invoiceId}</p>
    </div>

    <div class="footer">
      <p>Thank you for your business. Payment is due within ${invoice.paymentTerms || 'net 30 days'}.</p>
    </div>
  </div>
</body>
</html>
  `;
}