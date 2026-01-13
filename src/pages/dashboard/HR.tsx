import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Calendar, DollarSign } from "lucide-react";
import { EmployeeTable } from "./hr/EmployeeTable";
import { HRStats } from "./hr/HRStats";
import { useNavigate } from "react-router";

export default function HR() {
  const stats = useQuery(api.hr.getDashboardStats);
  const navigate = useNavigate();

  return (
    <div className="space-y-8 p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">HR & Salary Management</h2>
          <p className="text-muted-foreground">
            Manage employees, leave, and salaries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/hr/leave-calendar")}>
            <Calendar className="mr-2 h-4 w-4" />
            Leave Calendar
          </Button>
          <Button onClick={() => navigate("/dashboard/hr/salary-calculation")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Run Salary Calculation
          </Button>
        </div>
      </div>

      <HRStats stats={stats} />

      <div className="space-y-4">
        <EmployeeTable />
      </div>
    </div>
  );
}