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
import { useQuery } from "convex/react";
import { Plus, Search, Filter, Upload, Scale, Link as LinkIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Loader2, Trash2, CheckCircle } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";

export default function Deliveries() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");

  const deliveries = useQuery(api.deliveries.list, { 
    paginationOpts: { numItems: 10, cursor: null },
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    driverId: driverFilter === "all" ? undefined : driverFilter as Id<"users">
  });

  const drivers = useQuery(api.users.listDrivers);
  const driverMap = useMemo(() => {
    const map = new Map();
    drivers?.forEach(d => map.set(d._id, d.name));
    return map;
  }, [drivers]);

  const confirmDelivery = useMutation(api.deliveries.confirmDelivery);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofImage, setProofImage] = useState<string>("");
  
  // Remove createDelivery mutation and form state related to the old dialog if needed, 
  // but I'll just leave them or comment them out if I'm replacing the button action.
  // Actually, I should clean up the unused code if I'm replacing the functionality.
  // For now, I will just change the button to navigate.

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !proofImage) return;
    
    setIsSubmitting(true);
    try {
      await confirmDelivery({
        id: selectedDelivery as any,
        deliveryProof: proofImage as any,
      });
      setIsConfirmOpen(false);
      toast.success("Delivery confirmed");
      setProofImage("");
      setSelectedDelivery(null);
    } catch (error) {
      toast.error("Failed to confirm delivery");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
      case "assigned": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "delivered": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "invoiced": return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Delivery Orders</h2>
          <p className="text-muted-foreground">Manage and track all delivery orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/deliveries/upload-ticket")}>
            <Scale className="h-4 w-4" />
            Upload Weigh Ticket
          </Button>
          <Button className="gap-2" onClick={() => navigate("/dashboard/deliveries/create")}>
            <Plus className="h-4 w-4" /> Create New DO
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by DO ID, client, or driver..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Match with Invoices
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {drivers?.map((driver) => (
                <SelectItem key={driver._id} value={driver._id}>
                  {driver.name || "Unknown Driver"}
                </SelectItem>
              ))}
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
                <TableHead>DO ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries?.page.map((delivery) => (
                <TableRow key={delivery._id}>
                  <TableCell className="font-medium">{delivery.deliveryOrderId || "—"}</TableCell>
                  <TableCell>{delivery.clientName}</TableCell>
                  <TableCell>{delivery.items[0]?.description || "—"}</TableCell>
                  <TableCell>{delivery.driverId ? driverMap.get(delivery.driverId) || "Unknown" : "Unassigned"}</TableCell>
                  <TableCell>
                    {delivery.deliveryDate 
                      ? new Date(delivery.deliveryDate).toLocaleDateString() 
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(delivery.status)}>
                      {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {delivery.status === "pending" || delivery.status === "assigned" ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => navigate(`/dashboard/deliveries/${delivery._id}`)}
                        >
                          View Details
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => navigate(`/dashboard/deliveries/${delivery._id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {deliveries?.page.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No deliveries found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery Proof (Photo/Signature)</Label>
              <FileUpload 
                onUploadComplete={(storageId) => setProofImage(storageId)} 
                label="Upload Proof" 
              />
              {proofImage && <p className="text-xs text-muted-foreground">Proof attached</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !proofImage}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Delivery
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}