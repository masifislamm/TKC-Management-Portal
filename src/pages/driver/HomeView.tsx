import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { 
  Box, 
  Clock, 
  TrendingUp, 
  Upload, 
  DollarSign, 
  LogOut,
  MapPin,
  Package,
  AlertCircle,
  Receipt
} from "lucide-react";
import { useState } from "react";

export type HomeNavigationTarget = "upload" | "claims" | "deliveries";

interface HomeViewProps {
  user: { name: string; userId?: string; role?: string };
  stats: {
    todaysCount: number;
    pendingClaims: number;
    pendingClaimsTotal?: number;
    completedThisWeek: number;
  };
  todaysDeliveries: any[];
  debugInfo?: {
    totalDeliveries: number;
    userId: string;
  };
  onSignOut: () => void;
  onViewChange: (view: HomeNavigationTarget) => void;
  onStartDelivery: (id: Id<"deliveryOrders">) => void;
  onDeliveryClick: (delivery: any) => void;
}

export default function HomeView({ 
  user, 
  stats, 
  todaysDeliveries, 
  debugInfo,
  onSignOut, 
  onViewChange,
  onStartDelivery,
  onDeliveryClick
}: HomeViewProps) {
  const [activeTab, setActiveTab] = useState<"in-progress" | "assigned" | "pending">("in-progress");

  // Filter deliveries based on active tab
  const filteredDeliveries = todaysDeliveries.filter(d => {
    if (activeTab === "in-progress") return d.status === "in-progress";
    if (activeTab === "assigned") return d.status === "assigned";
    if (activeTab === "pending") return d.status === "pending"; 
    return false;
  });

  // Counts for tabs
  const inProgressCount = todaysDeliveries.filter(d => d.status === "in-progress").length;
  const assignedCount = todaysDeliveries.filter(d => d.status === "assigned").length;
  const pendingCount = todaysDeliveries.filter(d => d.status === "pending").length;

  // Show debug info if no deliveries found
  const showDebugInfo = debugInfo && debugInfo.totalDeliveries === 0;

  return (
    <>
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome Back, {user.name.split(' ')[0]}!</h1>
            <p className="text-blue-100 mt-1">
              You have {stats.todaysCount} deliveries scheduled for today
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-blue-700 rounded-full"
            onClick={onSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-8">
        {/* Debug Info Banner */}
        {showDebugInfo && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">⚠️ No Deliveries Found - Account Mismatch</h3>
                  <p className="text-sm text-orange-800 mb-3">
                    You're currently logged in, but no deliveries are assigned to this account.
                  </p>
                  <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-900 mb-2">Your Current Login Details:</p>
                    <div className="space-y-1">
                      <p className="text-xs text-orange-800">
                        <strong>Email:</strong> {user.name || "Not set"}
                      </p>
                      <p className="text-xs text-orange-800">
                        <strong>Role:</strong> {user.role || "not set"}
                      </p>
                      <p className="text-xs text-orange-800 font-mono">
                        <strong>User ID:</strong> {debugInfo?.userId}
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2">✓ To Fix This Issue:</p>
                    <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                      <li>Sign out from this account</li>
                      <li>Log in using the email address that was assigned to the delivery orders</li>
                      <li>Check with your admin if you're unsure which email to use</li>
                    </ol>
                  </div>
                  <p className="text-xs text-orange-600 mt-3 italic">
                    Note: The delivery orders are assigned to a specific driver account. Make sure you're logged in with the correct email address.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="shadow-sm border-none">
            <CardContent className="p-4 flex flex-col items-center text-center h-full justify-between">
              <div className="bg-blue-100 p-2 rounded-lg mb-2">
                <Box className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.todaysCount}</span>
              <span className="text-[10px] text-gray-500 leading-tight mt-1">Today's Deliveries</span>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-none" onClick={() => onViewChange("claims")}>
            <CardContent className="p-4 flex flex-col items-center text-center h-full justify-between cursor-pointer">
              <div className="bg-orange-100 p-2 rounded-lg mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</span>
              <span className="text-[10px] text-gray-500 leading-tight mt-1">Pending Claims</span>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardContent className="p-4 flex flex-col items-center text-center h-full justify-between">
              <div className="bg-green-100 p-2 rounded-lg mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.completedThisWeek}</span>
              <span className="text-[10px] text-gray-500 leading-tight mt-1">Completed This Week</span>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl shadow-sm text-base font-medium"
            onClick={() => onViewChange("upload")}
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Delivery Proof
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 h-12 rounded-xl shadow-sm text-base font-medium"
            onClick={() => onViewChange("claims")}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Submit Expense Claim
          </Button>
        </div>

        {/* Today's Deliveries Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Today's Deliveries</h2>
            <Button variant="link" className="text-blue-600 text-sm h-auto p-0" onClick={() => onViewChange("deliveries")}>View All</Button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-200/50 p-1 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab("in-progress")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "in-progress" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              In Progress <span className="ml-1 opacity-80 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{inProgressCount}</span>
            </button>
            <button
              onClick={() => setActiveTab("assigned")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "assigned" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Assigned <span className={cn("ml-1 opacity-80 text-xs px-1.5 py-0.5 rounded-full", activeTab === "assigned" ? "bg-white/20" : "bg-gray-300")}>{assignedCount}</span>
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "pending" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Pending <span className={cn("ml-1 opacity-80 text-xs px-1.5 py-0.5 rounded-full", activeTab === "pending" ? "bg-white/20" : "bg-gray-300")}>{pendingCount}</span>
            </button>
          </div>

          {/* Delivery List */}
          <div className="space-y-3">
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-white rounded-xl border border-gray-100">
                No deliveries in this status
              </div>
            ) : (
              filteredDeliveries.map((delivery) => (
                <Card 
                  key={delivery._id} 
                  className="border-none shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => onDeliveryClick(delivery)}
                >
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-gray-500 font-medium block mb-1">{delivery.deliveryOrderId || "NO-ID"}</span>
                          <h3 className="font-bold text-gray-900">{delivery.clientName}</h3>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                          delivery.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                          delivery.status === "assigned" ? "bg-gray-100 text-gray-700" :
                          "bg-orange-100 text-orange-700"
                        )}>
                          {delivery.status === "in-progress" ? "In Progress" : 
                           delivery.status === "assigned" ? "Assigned" : "Pending"}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Material: {delivery.items[0]?.description || "Unknown"}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Destination: {delivery.destinationAddress || "Not specified"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Start Delivery Button */}
                    {delivery.status === "assigned" && (
                      <div className="px-4 pb-4">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartDelivery(delivery._id);
                          }}
                        >
                          Start Delivery
                        </Button>
                      </div>
                    )}

                    {/* Progress Bar for In Progress */}
                    {delivery.status === "in-progress" && (
                      <div className="h-1 w-full bg-gray-100">
                        <div className="h-full bg-blue-600 w-2/3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Pending Expense Claims Summary */}
        <div className="mb-24">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pending Expense Claims</h2>
            <Button variant="link" className="text-blue-600 text-sm h-auto p-0" onClick={() => onViewChange("claims")}>View All</Button>
          </div>
          
          {stats.pendingClaims === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-gray-100 p-3 rounded-full">
                    <Receipt className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No pending expense claims</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => onViewChange("claims")}
                  >
                    Submit New Claim
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {stats.pendingClaims} {stats.pendingClaims === 1 ? 'claim' : 'claims'} awaiting approval
                  </p>
                  <p className="font-medium text-gray-900">
                    Total: ${(stats.pendingClaimsTotal || 0).toFixed(2)}
                  </p>
                </div>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                  Pending
                </span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}