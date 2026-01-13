import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Box, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Play, 
  Plus, 
  Truck, 
  Upload, 
  Users 
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

export default function DashboardHome() {
  const stats = useQuery(api.dashboard.getStats);
  const chartData = useQuery(api.dashboard.getChartData);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);
  const systemActivity = useQuery(api.dashboard.getSystemActivity);
  const navigate = useNavigate();

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'];

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case "upload": return Upload;
      case "truck": return Truck;
      case "check": return CheckCircle2;
      case "dollar": return DollarSign;
      default: return Activity;
    }
  };

  const getActivityColorClasses = (color: string) => {
    switch (color) {
      case "purple": return {
        bg: "bg-purple-50/50",
        border: "border-purple-100",
        iconBg: "bg-purple-100",
        iconText: "text-purple-600",
        badge: "bg-purple-600"
      };
      case "blue": return {
        bg: "bg-blue-50/50",
        border: "border-blue-100",
        iconBg: "bg-blue-100",
        iconText: "text-blue-600",
        badge: "bg-blue-600"
      };
      case "green": return {
        bg: "bg-green-50/50",
        border: "border-green-100",
        iconBg: "bg-green-100",
        iconText: "text-green-600",
        badge: "bg-green-600"
      };
      case "amber": return {
        bg: "bg-amber-50/50",
        border: "border-amber-100",
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
        badge: "bg-amber-600"
      };
      default: return {
        bg: "bg-gray-50/50",
        border: "border-gray-100",
        iconBg: "bg-gray-100",
        iconText: "text-gray-600",
        badge: "bg-gray-600"
      };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's your overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/match")}>
            <Box className="w-4 h-4" />
            Match Documents
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/dashboard/deliveries")}>
            <Plus className="w-4 h-4" />
            Create D.O.
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/expenses")}>
            <Clock className="w-4 h-4" />
            Approve Claims
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/hr")}>
            <Activity className="w-4 h-4" />
            Run Salary
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Delivery Orders</p>
              <div className="text-3xl font-bold">{stats?.activeDeliveries ?? "-"}</div>
            </div>
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Invoices</p>
              <div className="text-3xl font-bold">{stats?.pendingInvoices ?? "-"}</div>
            </div>
            <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Claims</p>
              <div className="text-3xl font-bold">{stats?.pendingClaims ?? "-"}</div>
            </div>
            <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Drivers On Delivery</p>
              <div className="text-3xl font-bold">{stats?.driversOnDelivery ?? "-"}</div>
            </div>
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Deliveries This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {chartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.deliveries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading chart...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Expense Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full relative">
              {chartData ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.expenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.expenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {chartData.expenses.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{entry.type}: {entry.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading chart...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity?.map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={cn(
                    "w-2 h-2 mt-2 rounded-full shrink-0",
                    activity.type === 'delivery' ? "bg-green-500" :
                    activity.type === 'expense' ? "bg-orange-500" : "bg-blue-500"
                  )} />
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.desc}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {!recentActivity?.length && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>System Activity</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemActivity?.map((activity, i) => {
                const Icon = getActivityIcon(activity.icon);
                const colors = getActivityColorClasses(activity.color);
                
                return (
                  <div key={i} className={cn("flex items-start gap-4 p-3 rounded-lg border", colors.bg, colors.border)}>
                    <div className="mt-1">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", colors.iconBg, colors.iconText)}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <span className={cn("text-[10px] text-white px-1.5 py-0.5 rounded", colors.badge)}>
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{activity.userEmail}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!systemActivity?.length && (
                <p className="text-sm text-muted-foreground">No system activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}