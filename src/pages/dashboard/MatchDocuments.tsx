import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { 
  Loader2, 
  Link as LinkIcon, 
  CheckCircle, 
  Search, 
  Truck, 
  FileText, 
  ArrowRight,
  XCircle,
  ArrowLeftRight,
  Calendar,
  Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";

export default function MatchDocuments() {
  const navigate = useNavigate();
  const deliveries = useQuery(api.deliveries.list, { paginationOpts: { numItems: 100, cursor: null } });
  const invoices = useQuery(api.invoices.list, { paginationOpts: { numItems: 100, cursor: null } });
  const matchToDelivery = useMutation(api.invoices.matchToDelivery);
  
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [isMatching, setIsMatching] = useState(false);

  // Process data to create maps for quick lookup
  const { deliveryMap, invoiceMap, invoiceByDeliveryId } = useMemo(() => {
    const dMap = new Map<string, Doc<"deliveryOrders">>();
    const iMap = new Map<string, Doc<"invoices">>();
    const iByDMap = new Map<string, Doc<"invoices">>();

    deliveries?.page.forEach(d => dMap.set(d._id, d));
    invoices?.page.forEach(i => {
      iMap.set(i._id, i);
      if (i.deliveryOrderId) {
        iByDMap.set(i.deliveryOrderId, i);
      }
    });

    return { deliveryMap: dMap, invoiceMap: iMap, invoiceByDeliveryId: iByDMap };
  }, [deliveries?.page, invoices?.page]);

  // Filtered lists
  const filteredDeliveries = useMemo(() => {
    if (!deliveries?.page) return [];
    return deliveries.page.filter(d => {
      const searchLower = deliverySearch.toLowerCase();
      const matchesSearch = 
        d.deliveryOrderId?.toLowerCase().includes(searchLower) ||
        d.clientName.toLowerCase().includes(searchLower) ||
        d.items.some(i => i.description.toLowerCase().includes(searchLower));
      return matchesSearch;
    });
  }, [deliveries?.page, deliverySearch]);

  const filteredInvoices = useMemo(() => {
    if (!invoices?.page) return [];
    return invoices.page.filter(i => {
      const searchLower = invoiceSearch.toLowerCase();
      const matchesSearch = 
        i.invoiceId?.toLowerCase().includes(searchLower) ||
        i.clientName.toLowerCase().includes(searchLower) ||
        i.items.some(item => item.description.toLowerCase().includes(searchLower));
      return matchesSearch;
    });
  }, [invoices?.page, invoiceSearch]);

  const handleMatch = async () => {
    if (!selectedDeliveryId || !selectedInvoiceId) return;
    
    setIsMatching(true);
    try {
      await matchToDelivery({
        invoiceId: selectedInvoiceId as Id<"invoices">,
        deliveryOrderId: selectedDeliveryId as Id<"deliveryOrders">,
      });
      toast.success("Documents matched successfully");
      setSelectedDeliveryId(null);
      setSelectedInvoiceId(null);
    } catch (error) {
      toast.error("Failed to match documents");
      console.error(error);
    } finally {
      setIsMatching(false);
    }
  };

  const selectedDelivery = selectedDeliveryId ? deliveryMap.get(selectedDeliveryId) : null;
  const selectedInvoice = selectedInvoiceId ? invoiceMap.get(selectedInvoiceId) : null;

  return (
    <div className="flex flex-col h-full space-y-6 p-8 overflow-hidden">
      <div className="flex flex-col space-y-1 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Document Matching</h1>
        <p className="text-muted-foreground">Match delivery orders with their corresponding invoices</p>
      </div>

      {/* Main Content Area - Fixed height with proper overflow */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: Delivery Orders */}
        <Card className="col-span-5 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-2 font-semibold text-base">
              <FileText className="h-5 w-5 text-blue-600" />
              Delivery Orders
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">{filteredDeliveries.length} total</Badge>
          </div>
          
          <div className="px-4 pt-4 pb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by DO#, client, or material..." 
                className="pl-9"
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {filteredDeliveries.map((delivery) => {
                const matchedInvoice = invoiceByDeliveryId.get(delivery._id);
                const isMatched = !!matchedInvoice;
                const isSelected = selectedDeliveryId === delivery._id;

                return (
                  <div
                    key={delivery._id}
                    onClick={() => setSelectedDeliveryId(delivery._id)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                      isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border bg-card",
                      isMatched && !isSelected && "opacity-60"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono font-semibold text-sm">{delivery.deliveryOrderId || "DO-???"}</span>
                      <div className="flex gap-2">
                        <Badge variant={delivery.status === "delivered" ? "default" : "secondary"} className={cn(
                          "text-xs",
                          delivery.status === "delivered" && "bg-green-600 hover:bg-green-700 text-white"
                        )}>
                          {delivery.status === "delivered" ? "Delivered" : delivery.status}
                        </Badge>
                        <Badge variant={isMatched ? "outline" : "secondary"} className={cn(
                          "text-xs",
                          isMatched ? "text-green-600 border-green-600 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                        )}>
                          {isMatched ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Matched</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Unmatched</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="font-semibold text-sm mb-2">{delivery.clientName}</div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                      <Package className="w-3.5 h-3.5" />
                      <span>{delivery.items.map(i => `${i.description} ${i.quantity}${i.unit}`).join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(delivery.deliveryDate || delivery._creationTime).toLocaleDateString()}</span>
                    </div>
                    {isMatched && (
                      <div className="mt-3 text-xs bg-green-50 text-green-700 px-2.5 py-1.5 rounded border border-green-200">
                        Matched with: {matchedInvoice.invoiceId}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Middle Column: Actions */}
        <div className="col-span-2 flex flex-col items-center justify-center space-y-6">
          <Button 
            size="lg" 
            className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-base shadow-sm font-semibold"
            disabled={!selectedDeliveryId || !selectedInvoiceId || isMatching}
            onClick={handleMatch}
          >
            {isMatching ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <LinkIcon className="mr-2 h-5 w-5" />}
            Match
          </Button>

          <Card className="w-full p-5 bg-blue-50/50 border-blue-100">
            <div className="text-center space-y-4">
              <div className="text-sm font-medium text-blue-900">Ready to match:</div>
              
              <div className={cn(
                "p-3 rounded-lg text-sm font-mono transition-all",
                selectedDelivery ? "bg-white shadow-sm text-blue-700 border border-blue-200" : "bg-blue-100/50 text-blue-400 border border-dashed border-blue-300"
              )}>
                {selectedDelivery ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    {selectedDelivery.deliveryOrderId}
                  </div>
                ) : "Select Delivery"}
              </div>

              <ArrowRight className="w-4 h-4 mx-auto text-blue-400 rotate-90" />

              <div className={cn(
                "p-3 rounded-lg text-sm font-mono transition-all",
                selectedInvoice ? "bg-white shadow-sm text-green-700 border border-green-200" : "bg-green-100/50 text-green-400 border border-dashed border-green-300"
              )}>
                {selectedInvoice ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    {selectedInvoice.invoiceId}
                  </div>
                ) : "Select Invoice"}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Invoices */}
        <Card className="col-span-5 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-2 font-semibold text-base">
              <FileText className="h-5 w-5 text-green-600" />
              Invoices
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">{filteredInvoices.length} total</Badge>
          </div>

          <div className="px-4 pt-4 pb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by INV#, client, or items..." 
                className="pl-9"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {filteredInvoices.map((invoice) => {
                const matchedDO = invoice.deliveryOrderId ? deliveryMap.get(invoice.deliveryOrderId) : null;
                const isMatched = !!matchedDO;
                const isSelected = selectedInvoiceId === invoice._id;

                return (
                  <div
                    key={invoice._id}
                    onClick={() => setSelectedInvoiceId(invoice._id)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                      isSelected ? "ring-2 ring-green-600 border-green-600 bg-green-50/30" : "border-border bg-card",
                      isMatched && !isSelected && "opacity-60"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono font-semibold text-sm">{invoice.invoiceId || "INV-???"}</span>
                      <div className="flex gap-2">
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className={cn(
                          "text-xs",
                          invoice.status === "paid" && "bg-green-600 text-white",
                          invoice.status === "sent" && "bg-blue-600 text-white",
                          invoice.status === "overdue" && "bg-red-600 text-white",
                          invoice.status === "approved" && "bg-indigo-600 text-white",
                          invoice.status === "pending" && "bg-orange-500 text-white"
                        )}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                        <Badge variant={isMatched ? "outline" : "secondary"} className={cn(
                          "text-xs",
                          isMatched ? "text-green-600 border-green-600 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                        )}>
                          {isMatched ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Matched</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Unmatched</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="font-semibold text-sm mb-2">{invoice.clientName}</div>
                    <div className="font-semibold text-green-700 mb-2 text-sm">$ MYR {invoice.amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {invoice.items.map(i => i.description).join(", ")}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                    {isMatched && matchedDO && (
                      <div className="mt-3 text-xs bg-green-50 text-green-700 px-2.5 py-1.5 rounded border border-green-200">
                        Matched with: {matchedDO.deliveryOrderId}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Bottom Section: Document Preview */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Delivery Order: {selectedDelivery?.deliveryOrderId || "None Selected"}</h3>
              </div>
              {selectedDelivery ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="col-span-2 font-medium">{selectedDelivery.clientName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Material:</span>
                    <span className="col-span-2">{selectedDelivery.items.map(i => i.description).join(", ")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="col-span-2">{selectedDelivery.items.map(i => `${i.quantity} ${i.unit}`).join(", ")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Delivery Date:</span>
                    <span className="col-span-2">{new Date(selectedDelivery.deliveryDate || selectedDelivery._creationTime).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="col-span-2">
                      <Badge className={cn(selectedDelivery.status === "delivered" && "bg-green-600")}>
                        {selectedDelivery.status}
                      </Badge>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic py-8 text-center">Select a delivery order to view details</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Invoice: {selectedInvoice?.invoiceId || "None Selected"}</h3>
              </div>
              {selectedInvoice ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="col-span-2 font-medium">{selectedInvoice.clientName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="col-span-2 font-medium">$ MYR {selectedInvoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="col-span-2">{selectedInvoice.items.map(i => i.description).join(", ")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="col-span-2">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="col-span-2">
                      <Badge className={cn(
                        selectedInvoice.status === "paid" && "bg-green-600",
                        selectedInvoice.status === "sent" && "bg-blue-600",
                        selectedInvoice.status === "approved" && "bg-indigo-600"
                      )}>
                        {selectedInvoice.status}
                      </Badge>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic py-8 text-center">Select an invoice to view details</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-between pt-4 flex-shrink-0">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/deliveries")}>View All DOs</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/invoices")}>View All Invoices</Button>
        </div>
      </div>
    </div>
  );
}