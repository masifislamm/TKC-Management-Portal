import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  MapPin, 
  Phone, 
  Truck, 
  User,
  AlertCircle,
  Download,
  Mail
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export default function DeliveryDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const delivery = useQuery(api.deliveries.getWithDetails, { 
    id: id as Id<"deliveryOrders"> 
  });

  const drivers = useQuery(api.users.listDrivers);
  const assignDriver = useMutation(api.deliveries.assignDriver);
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  const handleAssignDriver = async () => {
    if (!selectedDriverId || !delivery) return;
    
    try {
      await assignDriver({
        id: delivery._id,
        driverId: selectedDriverId as Id<"users">,
      });
      toast.success("Driver assigned successfully");
      setIsAssignDialogOpen(false);
    } catch (error) {
      toast.error("Failed to assign driver");
      console.error(error);
    }
  };

  if (delivery === undefined) {
    return <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>;
  }

  if (delivery === null) {
    return <div className="p-6 text-center">Delivery not found</div>;
  }

  const steps = [
    { label: "Created", date: delivery._creationTime, status: "completed" },
    { label: "Assigned", date: delivery.status !== "pending" ? delivery._creationTime : null, status: delivery.status !== "pending" ? "completed" : "pending" },
    { label: "Out for Delivery", date: ["in-progress", "delivered", "invoiced"].includes(delivery.status) ? delivery.deliveryDate : null, status: ["in-progress", "delivered", "invoiced"].includes(delivery.status) ? "completed" : "pending" },
    { label: "Delivered", date: ["delivered", "invoiced"].includes(delivery.status) ? delivery.deliveryDate : null, status: ["delivered", "invoiced"].includes(delivery.status) ? "completed" : "pending" },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Delivery Order Details</h1>
            <p className="text-muted-foreground">{delivery.deliveryOrderId || "No ID"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            Reconcile
          </Button>
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate(`/dashboard/invoices/create-from-do?deliveryId=${delivery._id}`)}
          >
            <FileText className="h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-6">Delivery Progress</h3>
          <div className="relative flex items-center justify-between px-4 md:px-10">
            {/* Connecting Lines */}
            <div className="absolute left-0 top-[15px] w-full h-[2px] bg-gray-100 -z-10" />
            
            {steps.map((step, index) => {
              const isCompleted = step.status === "completed";
              const isLast = index === steps.length - 1;
              
              return (
                <div key={index} className="flex flex-col items-center gap-2 bg-background px-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${isCompleted 
                      ? "bg-green-50 border-green-500 text-green-600" 
                      : "bg-gray-50 border-gray-200 text-gray-300"}
                  `}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(step.date).toLocaleDateString()}
                        <br />
                        {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Order & Client Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Material Type</p>
                <p className="font-medium">{delivery.items[0]?.description || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Created Date</p>
                <p className="font-medium">{new Date(delivery._creationTime).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</p>
                <p className="font-medium">
                  {delivery.items.reduce((acc, item) => acc + item.quantity, 0)} {delivery.items[0]?.unit || "Tons"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Reconciliation Status</p>
                <Badge variant={delivery.status === "invoiced" ? "default" : "secondary"} className="mt-1">
                  {delivery.status === "invoiced" ? "Reconciled" : "Pending"}
                </Badge>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pickup Location</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">Main Warehouse, Pretoria</p>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Delivery Location</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{delivery.destinationAddress || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Company Name</p>
                <p className="font-medium text-lg">{delivery.clientName}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact Person</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{delivery.contactPerson || "—"}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{delivery.contactPhone || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uploaded Delivery Proof</CardTitle>
            </CardHeader>
            <CardContent>
              {delivery.deliveryProofUrl ? (
                <div className="rounded-lg border overflow-hidden bg-muted/10">
                  <img 
                    src={delivery.deliveryProofUrl} 
                    alt="Delivery Proof" 
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-muted/10 rounded-lg border border-dashed">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Delivery proof will appear here once uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Driver & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Driver</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {delivery.driver ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">{delivery.driver.name}</p>
                      <p className="text-sm text-muted-foreground">{delivery.driver.phone || "No phone"}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => {
                      if (delivery.driver?.phone) {
                        window.location.href = `tel:${delivery.driver.phone}`;
                      } else {
                        toast.error("No phone number available for this driver");
                      }
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Contact Driver
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                    <User className="h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground mb-4">No driver assigned</p>
                  
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">Assign Driver</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Driver</DialogTitle>
                        <DialogDescription>
                          Select a driver to assign to this delivery order.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Select
                          value={selectedDriverId}
                          onValueChange={setSelectedDriverId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers?.map((driver) => (
                              <SelectItem key={driver._id} value={driver._id}>
                                {driver.name || "Unknown Driver"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignDriver} disabled={!selectedDriverId}>Assign Driver</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Special Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {delivery.notes || "No special notes for this delivery."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <FileText className="h-4 w-4" />
                View Documents
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                <AlertCircle className="h-4 w-4" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}