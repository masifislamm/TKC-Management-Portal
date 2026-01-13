import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Box, Calendar, MapPin, Phone, User, Upload, CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeliveryDetailsViewProps {
  delivery: any; // Using any for now to avoid complex type imports, but should be Doc<"deliveryOrders">
  onBack: () => void;
  onUploadProof: (id: Id<"deliveryOrders">) => void;
}

export default function DeliveryDetailsView({ delivery, onBack, onUploadProof }: DeliveryDetailsViewProps) {
  const steps = [
    { id: "assigned", label: "Assigned", icon: CheckCircle2 },
    { id: "in-progress", label: "Out for Delivery", icon: Clock },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  const getCurrentStepIndex = () => {
    if (delivery.status === "delivered") return 3;
    if (delivery.status === "in-progress") return 2;
    if (delivery.status === "assigned") return 1;
    return 0;
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-gray-100">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Delivery Details</h1>
          <p className="text-xs text-gray-500">{delivery.deliveryOrderId || "NO-ID"}</p>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          delivery.status === "in-progress" ? "bg-blue-100 text-blue-700" :
          delivery.status === "assigned" ? "bg-gray-100 text-gray-700" :
          "bg-green-100 text-green-700"
        )}>
          {delivery.status === "in-progress" ? "In Progress" : 
           delivery.status === "assigned" ? "Assigned" : "Delivered"}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-medium text-gray-900 mb-6">Delivery Progress</h3>
            <div className="relative flex flex-col gap-8 pl-4 border-l-2 border-gray-100 ml-3">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep - 1;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="relative pl-6">
                    <div className={cn(
                      "absolute -left-[21px] top-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center transition-colors",
                      isCompleted || isCurrent ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-300"
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : 
                       isCurrent ? <Circle className="h-4 w-4 fill-current" /> :
                       <Circle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className={cn("font-medium text-sm", (isCompleted || isCurrent) ? "text-gray-900" : "text-gray-400")}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-blue-600 mt-0.5 font-medium">Current Status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-medium text-gray-900">Delivery Information</h3>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Box className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Material & Quantity</p>
                <p className="font-medium text-gray-900">
                  {delivery.items.map((i: any) => `${i.description} - ${i.quantity} ${i.unit}`).join(", ")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Destination</p>
                <p className="font-medium text-gray-900">{delivery.destinationAddress || "No address specified"}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Delivery Date</p>
                <p className="font-medium text-gray-900">
                  {delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : "Not scheduled"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Contact */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-medium text-gray-900">Client Contact</h3>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                <p className="font-medium text-gray-900">{delivery.contactPerson || "Not specified"}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="font-medium text-gray-900">{delivery.contactPhone || "Not specified"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-medium text-gray-900 mb-2">Special Notes</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {delivery.notes || "No special notes for this delivery."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-20">
        <Button 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium shadow-lg shadow-blue-200"
          onClick={() => onUploadProof(delivery._id)}
        >
          <Upload className="mr-2 h-5 w-5" />
          Upload Delivery Proof
        </Button>
      </div>
    </div>
  );
}
