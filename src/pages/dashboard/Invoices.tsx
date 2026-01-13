import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useQuery } from "convex/react";
import { Plus, Search, Filter, Download, Link as LinkIcon, FileText } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router";
import { useAction } from "convex/react";

export default function Invoices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const invoices = useQuery(api.invoices.list, { 
    paginationOpts: { numItems: 10, cursor: null },
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  
  const stats = useQuery(api.invoices.getStats);
  const createInvoice = useMutation(api.invoices.create);
  const generatePDF = useAction(api.pdf.generateInvoicePDF);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unit: "hrs", unitPrice: 0, total: 0 }]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit: "hrs", unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    // Recalculate total
    if (field === "quantity" || field === "unitPrice") {
      item.total = item.quantity * item.unitPrice;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createInvoice({
        clientName,
        items,
        dueDate: new Date(dueDate).getTime(),
        source: "manual",
      });
      setIsOpen(false);
      toast.success("Invoice created");
      setClientName("");
      setDueDate("");
      setItems([{ description: "", quantity: 1, unit: "hrs", unitPrice: 0, total: 0 }]);
    } catch (error) {
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "approved": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "pending": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
      case "draft": return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      case "paid": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
      case "overdue": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "summary_file":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">Summary File</Badge>;
      case "delivery_order":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Delivery Order</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">Manual</Badge>;
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceName: string) => {
    try {
      toast.loading("Generating PDF...");
      const result = await generatePDF({ invoiceId: invoiceId as Id<"invoices"> });
      
      if (result.success && result.html) {
        // Create a blob from the HTML and trigger download
        const blob = new Blob([result.html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.dismiss();
        toast.success("Invoice downloaded successfully");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download invoice");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage and track all invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/invoices/create-from-summary")}>
            <Plus className="h-4 w-4" /> From Summary File
          </Button>
          <Button className="gap-2" onClick={() => navigate("/dashboard/invoices/create-from-do")}>
            <Plus className="h-4 w-4" /> From Delivery Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              RM {stats?.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sentThisMonth || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPayment || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.draft || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice ID or client..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Match with DOs
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>DO Match</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.page.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell className="font-medium">{invoice.invoiceId || "—"}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.deliveryOrderId ? (
                      <div className="flex flex-col">
                        <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">Matched</Badge>
                        <span className="text-xs text-muted-foreground mt-1">DO-Linked</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <Badge variant="outline" className="w-fit bg-red-50 text-red-700 border-red-200">Unmatched</Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getSourceBadge(invoice.source)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/dashboard/invoices/${invoice._id}`)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDownloadInvoice(invoice._id, invoice.invoiceId || 'invoice')}
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices?.page.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}