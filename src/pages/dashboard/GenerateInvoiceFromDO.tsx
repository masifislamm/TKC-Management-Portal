import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function GenerateInvoiceFromDO() {
  const navigate = useNavigate();
  const pendingDeliveries = useQuery(api.deliveries.getPendingDeliveries);
  const createInvoice = useMutation(api.invoices.create);

  const [selectedDOId, setSelectedDOId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  
  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>>([]);

  const [taxRate, setTaxRate] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");

  // Handle DO Selection
  useEffect(() => {
    if (selectedDOId && pendingDeliveries) {
      const delivery = pendingDeliveries.find(d => d._id === selectedDOId);
      if (delivery) {
        setClientName(delivery.clientName);
        setClientAddress(delivery.destinationAddress || "");
        
        // Map DO items to Invoice items
        const invoiceItems = delivery.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0, // Default to 0 as DO doesn't have price
          total: 0
        }));
        setItems(invoiceItems);
      }
    }
  }, [selectedDOId, pendingDeliveries]);

  const updateItemPrice = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].unitPrice = price;
    newItems[index].total = newItems[index].quantity * price;
    setItems(newItems);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!selectedDOId) {
      toast.error("Please select a delivery order");
      return;
    }
    if (items.some(i => i.unitPrice <= 0)) {
      toast.error("Please enter unit prices for all items");
      return;
    }

    setIsSubmitting(true);
    
    // Calculate due date based on payment terms
    const days = paymentTerms === "Net 30 Days" ? 30 : paymentTerms === "Net 60 Days" ? 60 : 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    try {
      const invoiceId = await createInvoice({
        clientName,
        clientEmail,
        clientAddress,
        items,
        deliveryOrderId: selectedDOId as Id<"deliveryOrders">,
        dueDate: dueDate.getTime(),
        source: "delivery_order",
        taxRate,
        paymentTerms,
      });

      if (invoiceId) {
        toast.success("Invoice generated successfully");
        // Use setTimeout to ensure toast shows before navigation
        setTimeout(() => {
          navigate(`/dashboard/invoices/${invoiceId}`);
        }, 100);
      }
    } catch (error) {
      console.error("Invoice creation error:", error);
      toast.error("Failed to generate invoice");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generate Invoice</h1>
          <p className="text-muted-foreground">Create invoice from delivery order</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Order Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>Select Delivery Order</Label>
                <Select value={selectedDOId} onValueChange={setSelectedDOId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pending delivery order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingDeliveries?.map((delivery) => (
                      <SelectItem key={delivery._id} value={delivery._id}>
                        {delivery.deliveryOrderId || "DO-???"} - {delivery.clientName} ({new Date(delivery.deliveryDate || 0).toLocaleDateString()})
                      </SelectItem>
                    ))}
                    {pendingDeliveries?.length === 0 && (
                      <SelectItem value="none" disabled>No pending deliveries found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid md:grid-cols-12 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                  <div className="md:col-span-5 space-y-2">
                    <Label>Material/Description</Label>
                    <Input value={item.description} readOnly className="bg-muted" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Quantity ({item.unit})</Label>
                    <Input value={item.quantity} readOnly className="bg-muted" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label>Unit Price (MYR)</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={item.unitPrice} 
                      onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2 text-right">
                    <Label>Line Total</Label>
                    <div className="h-10 flex items-center justify-end font-medium">
                      RM {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Select a delivery order to view items
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 14 Days">Net 14 Days</SelectItem>
                    <SelectItem value="Net 30 Days">Net 30 Days</SelectItem>
                    <SelectItem value="Net 60 Days">Net 60 Days</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="bg-blue-50/50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>RM {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span>RM {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Separator className="bg-blue-200" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Invoice will be generated in draft status</p>
              <p>• You can review and edit before sending</p>
              <p>• Invoice number will be auto-assigned</p>
              <p>• Payment terms: {paymentTerms}</p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Invoice
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/invoices")} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
