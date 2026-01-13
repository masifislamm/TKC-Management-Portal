import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Box,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Truck,
  Users,
  UserPlus,
  X,
  Briefcase,
  ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

export default function DashboardLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add role check for admin/hr access
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "hr") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Delivery Orders", href: "/dashboard/deliveries", icon: Truck },
    { name: "Invoicing", href: "/dashboard/invoices", icon: FileText },
    { name: "Match Documents", href: "/dashboard/match", icon: Box },
    { name: "Expenses & Claims", href: "/dashboard/expenses", icon: BarChart3 },
    { name: "HR & Salary", href: "/dashboard/hr", icon: Briefcase },
    { name: "Admin Control", href: "/dashboard/admin", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-white border-r border-slate-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xl">
            <img
              src="https://harmless-tapir-303.convex.cloud/api/storage/8b9c6710-2a50-4880-a214-c81845283f60"
              alt="TKC Logo"
              className="w-8 h-8 rounded-lg"
            />
            TKC
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {user?.email || "admin@tkc.com"}
          </div>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-[#1e293b]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.name || "User"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background flex items-center px-4 lg:px-8 justify-between lg:justify-end sticky top-0 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}