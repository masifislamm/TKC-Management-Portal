import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Upload,
  DollarSign,
  Home,
  Truck,
  User
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";
import ClaimsView from "./ClaimsView";
import DeliveriesView from "./DeliveriesView";
import DeliveryDetailsView from "./DeliveryDetailsView";
import HomeView, { HomeNavigationTarget } from "./HomeView";
import UploadView from "./UploadView";
import ProfileView from "./ProfileView";

export type DriverDashboardView = "home" | "deliveries" | "upload" | "claims" | "delivery-details" | "profile";

export default function DriverDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const dashboardData = useQuery(api.driver.getDashboardData);
  const startDelivery = useMutation(api.driver.startDelivery);
  
  const [currentView, setCurrentView] = useState<DriverDashboardView>("home");
  const [previousView, setPreviousView] = useState<"home" | "deliveries">("home");
  
  // Upload Form State
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (dashboardData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  // Handle unauthorized access
  if (dashboardData === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-semibold">Access Denied</p>
          <p className="text-muted-foreground">You are not authorized to access the driver dashboard.</p>
          <p className="text-sm text-muted-foreground">Please contact your administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  const { stats, todaysDeliveries, activeDeliveries, allDeliveries } = dashboardData;

  const handleStartDelivery = async (id: Id<"deliveryOrders">) => {
    try {
      await startDelivery({ id });
      toast.success("Delivery started!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start delivery");
    }
  };

  const handleSelectDelivery = (delivery: any, fromView: "home" | "deliveries" = "deliveries") => {
    setSelectedDelivery(delivery);
    setPreviousView(fromView);
    setCurrentView("delivery-details");
  };

  const handleUploadProofFromDetails = (id: Id<"deliveryOrders">) => {
    setSelectedDeliveryId(id);
    setCurrentView("upload");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {currentView === "home" && (
        <HomeView 
          user={dashboardData.user}
          stats={stats}
          todaysDeliveries={todaysDeliveries}
          onSignOut={handleSignOut}
          onViewChange={(view: HomeNavigationTarget) => setCurrentView(view)}
          onStartDelivery={handleStartDelivery}
          onDeliveryClick={(d) => handleSelectDelivery(d, "home")}
        />
      )}
      
      {currentView === "upload" && (
        <UploadView 
          activeDeliveries={activeDeliveries}
          initialDeliveryId={selectedDeliveryId}
          onCancel={() => setCurrentView("home")}
          onSuccess={() => {
            setSelectedDeliveryId("");
            setCurrentView("home");
          }}
        />
      )}

      {currentView === "claims" && (
        <ClaimsView 
          activeDeliveries={activeDeliveries} 
          onBack={() => setCurrentView("home")} 
        />
      )}
      {currentView === "deliveries" && (
        <DeliveriesView 
          deliveries={allDeliveries || []} 
          onSelectDelivery={(d) => handleSelectDelivery(d, "deliveries")} 
        />
      )}
      {currentView === "delivery-details" && selectedDelivery && (
        <DeliveryDetailsView
          delivery={selectedDelivery}
          onBack={() => setCurrentView(previousView)}
          onUploadProof={handleUploadProofFromDetails}
        />
      )}

      {currentView === "profile" && (
        <ProfileView
          user={dashboardData.user}
          onSignOut={handleSignOut}
          onBack={() => setCurrentView("home")}
        />
      )}

      {/* Bottom Navigation */}
      {currentView !== "delivery-details" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between items-center z-50">
          <button
            className={cn("flex flex-col items-center", currentView === "home" ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
            onClick={() => setCurrentView("home")}
          >
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </button>
          <button
            className={cn("flex flex-col items-center", currentView === "deliveries" ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
            onClick={() => setCurrentView("deliveries")}
          >
            <Truck className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Deliveries</span>
          </button>
          <button
            className={cn("flex flex-col items-center", currentView === "upload" ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
            onClick={() => setCurrentView("upload")}
          >
            <Upload className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Upload</span>
          </button>
          <button
            className={cn("flex flex-col items-center", currentView === "claims" ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
            onClick={() => setCurrentView("claims")}
          >
            <DollarSign className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Claims</span>
          </button>
          <button
            className={cn("flex flex-col items-center", currentView === "profile" ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
            onClick={() => setCurrentView("profile")}
          >
            <User className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </button>
        </div>
      )}
    </div>
  );
}