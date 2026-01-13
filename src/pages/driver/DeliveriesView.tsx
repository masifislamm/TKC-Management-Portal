import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Box, Calendar, FileText, MapPin } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface DeliveriesViewProps {
  deliveries: any[];
  onSelectDelivery: (delivery: any) => void;
}

export default function DeliveriesView({ deliveries, onSelectDelivery }: DeliveriesViewProps) {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const activeDeliveries = deliveries.filter(d => 
    d.status === "assigned" || d.status === "in-progress"
  );

  const completedDeliveries = deliveries.filter(d => 
    d.status === "delivered" || d.status === "invoiced"
  );

  const displayedDeliveries = activeTab === "active" ? activeDeliveries : completedDeliveries;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage your delivery orders</p>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm mb-6 flex">
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
            activeTab === "active" 
              ? "bg-gray-100 text-gray-900 shadow-sm" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          Active ({activeDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
            activeTab === "completed" 
              ? "bg-gray-100 text-gray-900 shadow-sm" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          Completed ({completedDeliveries.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {displayedDeliveries.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Box className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium">No deliveries found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === "active" 
                ? "You have no active deliveries at the moment." 
                : "You haven't completed any deliveries yet."}
            </p>
          </div>
        ) : (
          displayedDeliveries.map((delivery) => (
            <Card 
              key={delivery._id} 
              className="border-none shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onSelectDelivery(delivery)}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1">
                      {delivery.deliveryOrderId || "NO-ID"}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg">{delivery.clientName}</h3>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    delivery.status === "in-progress" ? "bg-blue-600 text-white" :
                    delivery.status === "assigned" ? "bg-gray-600 text-white" :
                    "bg-green-600 text-white"
                  )}>
                    {delivery.status === "in-progress" ? "In Progress" : 
                     delivery.status === "assigned" ? "Assigned" : 
                     delivery.status === "invoiced" ? "Completed" : "Delivered"}
                  </span>
                </div>

                {activeTab === "active" && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-4 flex items-center gap-3">
                    <FileText className="h-4 w-4 text-yellow-700" />
                    <span className="text-xs font-medium text-yellow-800">Print DO PDF before delivery</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Box className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Material</p>
                      <p className="text-sm font-medium text-gray-900">
                        {delivery.items[0]?.description} ({delivery.items[0]?.quantity} {delivery.items[0]?.unit})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Delivery Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : "Not scheduled"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Destination</p>
                      <p className="text-sm font-medium text-gray-900">{delivery.destinationAddress || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}