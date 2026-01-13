import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CalendarIcon, Loader2, Save, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function CreateDelivery() {
  const navigate = useNavigate();
  const createDelivery = useMutation(api.deliveries.create);
  const drivers = useQuery(api.users.listDrivers);
  const clientsData = useQuery(api.clients.list);
  const materialsData = useQuery(api.materials.list);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewMaterial, setIsNewMaterial] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: "",
    materialType: "",
    quantity: "",
    expectedTonnage: "",
    deliveryDate: undefined as Date | undefined,
    destinationAddress: "",
    driverId: "",
    notes: "",
    contactPerson: "",
    contactPhone: ""
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.materialType || !formData.quantity || !formData.deliveryDate || !formData.destinationAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createDelivery({
        clientName: formData.clientName,
        items: [{
          description: formData.materialType,
          quantity: parseFloat(formData.quantity),
          unit: "tons"
        }],
        notes: formData.notes,
        driverId: formData.driverId ? (formData.driverId as any) : undefined,
        deliveryDate: formData.deliveryDate.getTime(),
        expectedTonnage: formData.expectedTonnage ? parseFloat(formData.expectedTonnage) : undefined,
        destinationAddress: formData.destinationAddress,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
      });
      
      toast.success("Delivery order created successfully");
      navigate("/dashboard/deliveries");
    } catch (error) {
      toast.error("Failed to create delivery order");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Delivery Order</h1>
          <p className="text-muted-foreground">Fill in the details to create a new delivery order</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Client */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="client">Client *</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => {
                    setIsNewClient(!isNewClient);
                    handleInputChange("clientName", "");
                  }}
                >
                  {isNewClient ? (
                    <><X className="mr-1 h-3 w-3" /> Select Existing</>
                  ) : (
                    <><Plus className="mr-1 h-3 w-3" /> Add New Client</>
                  )}
                </Button>
              </div>
              
              {isNewClient ? (
                <Input 
                  placeholder="Enter new client name" 
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  autoFocus
                />
              ) : (
                <Select 
                  value={formData.clientName} 
                  onValueChange={(val) => {
                    handleInputChange("clientName", val);
                    const selectedClient = clientsData?.find(c => c.name === val);
                    if (selectedClient) {
                      if (selectedClient.contactPerson) handleInputChange("contactPerson", selectedClient.contactPerson);
                      if (selectedClient.phone) handleInputChange("contactPhone", selectedClient.phone);
                      if (selectedClient.address) handleInputChange("destinationAddress", selectedClient.address);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.map(client => (
                      <SelectItem key={client._id} value={client.name}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="material">Material Type *</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => {
                    setIsNewMaterial(!isNewMaterial);
                    handleInputChange("materialType", "");
                  }}
                >
                  {isNewMaterial ? (
                    <><X className="mr-1 h-3 w-3" /> Select Existing</>
                  ) : (
                    <><Plus className="mr-1 h-3 w-3" /> Add New Material</>
                  )}
                </Button>
              </div>
              
              {isNewMaterial ? (
                <Input 
                  placeholder="Enter new material type" 
                  value={formData.materialType}
                  onChange={(e) => handleInputChange("materialType", e.target.value)}
                  autoFocus
                />
              ) : (
                <Select 
                  value={formData.materialType} 
                  onValueChange={(val) => handleInputChange("materialType", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialsData?.map(material => (
                      <SelectItem key={material._id} value={material.name}>{material.name}</SelectItem>
                    ))}
                    {(!materialsData || materialsData.length === 0) && (
                      <div className="p-2 text-sm text-muted-foreground text-center">No materials found</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Site Contact Person</Label>
              <Input 
                id="contactPerson" 
                placeholder="e.g., John Doe" 
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Site Contact Phone</Label>
              <Input 
                id="contactPhone" 
                placeholder="e.g., +1 234 567 890" 
                value={formData.contactPhone}
                onChange={(e) => handleInputChange("contactPhone", e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Tons) *</Label>
              <Input 
                id="quantity" 
                type="number"
                placeholder="e.g., 50" 
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
              />
            </div>

            {/* Expected Tonnage */}
            <div className="space-y-2">
              <Label htmlFor="expectedTonnage">Expected Tonnage (Optional)</Label>
              <Input 
                id="expectedTonnage" 
                type="number"
                placeholder="e.g., 48.5" 
                value={formData.expectedTonnage}
                onChange={(e) => handleInputChange("expectedTonnage", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">For weighbridge verification</p>
            </div>

            {/* Delivery Date */}
            <div className="space-y-2">
              <Label>Delivery Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deliveryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deliveryDate ? format(formData.deliveryDate, "PPP") : <span>dd/mm/yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.deliveryDate}
                    onSelect={(date) => handleInputChange("deliveryDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Destination Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Destination Address *</Label>
              <Textarea 
                id="address" 
                placeholder="Enter full delivery address..." 
                value={formData.destinationAddress}
                onChange={(e) => handleInputChange("destinationAddress", e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Assign Driver */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="driver">Assign Driver (Optional)</Label>
              <Select 
                value={formData.driverId} 
                onValueChange={(val) => handleInputChange("driverId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
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

            {/* Special Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Special Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any special instructions or notes..." 
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="min-h-[100px] bg-muted/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-32">
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} className="w-64 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create & Generate PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}