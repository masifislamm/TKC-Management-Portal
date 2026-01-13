import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router";

interface HRStatsProps {
  stats?: {
    totalEmployees: number;
    activeEmployees: number;
    onLeaveEmployees: number;
    drivers: number;
    pendingLeaveRequests: number;
  };
}

export function HRStats({ stats }: HRStatsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeEmployees || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.onLeaveEmployees || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.drivers || 0}</div>
        </CardContent>
      </Card>

      {/* Action/Info Cards - New Row */}
      <div className="col-span-full grid gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/dashboard/hr/leave-approval")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-sm font-medium">Pending Leave Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mt-2">{stats?.pendingLeaveRequests || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/dashboard/hr/salary-calculation")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <CardTitle className="text-sm font-medium">Process Bi-monthly Salary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium mt-2">Calculate driver commissions</div>
            <p className="text-xs text-muted-foreground mt-1">Every 15 days based on deliveries</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/dashboard/hr/salary-summary")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-sm font-medium">Salary Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium mt-2">View payment history</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}