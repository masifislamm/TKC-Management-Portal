import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const TYPE_COLORS = {
  "Annual Leave": "bg-blue-500",
  "Sick Leave": "bg-purple-500",
  "Vacation": "bg-cyan-500",
  "Emergency": "bg-red-500",
  "Unpaid Leave": "bg-gray-500",
  "Default": "bg-indigo-500",
};

export default function LeaveCalendar() {
  const navigate = useNavigate();
  const leaveRequests = useQuery(api.hr.getAllLeaveRequestsForCalendar);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Check if a date has any leave
  const getLeavesForDate = (day: number) => {
    if (!leaveRequests || !day) return [];

    const dateToCheck = new Date(currentYear, currentMonth, day).setHours(0, 0, 0, 0);

    return leaveRequests.filter((leave) => {
      const startDate = new Date(leave.startDate).setHours(0, 0, 0, 0);
      const endDate = new Date(leave.endDate).setHours(0, 0, 0, 0);

      // Apply filters
      if (filterStatus !== "all" && leave.status !== filterStatus) return false;
      if (filterType !== "all" && leave.type !== filterType) return false;

      return dateToCheck >= startDate && dateToCheck <= endDate;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLeaveClick = (leave: any) => {
    setSelectedLeave(leave);
    setIsDetailOpen(true);
  };

  const days = getDaysInMonth(currentDate);

  // Get unique types for filter
  const uniqueTypes = Array.from(new Set(leaveRequests?.map((l) => l.type) || []));

  // Stats
  const stats = {
    total: leaveRequests?.length || 0,
    pending: leaveRequests?.filter((l) => l.status === "pending").length || 0,
    approved: leaveRequests?.filter((l) => l.status === "approved").length || 0,
    thisMonth: leaveRequests?.filter((l) => {
      const startDate = new Date(l.startDate);
      return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
    }).length || 0,
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leave Calendar</h1>
            <p className="text-muted-foreground">View all employee leave requests</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.thisMonth}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xl font-semibold min-w-[200px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-muted">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const leaves = day ? getLeavesForDate(day) : [];
                const isToday =
                  day === new Date().getDate() &&
                  currentMonth === new Date().getMonth() &&
                  currentYear === new Date().getFullYear();

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`min-h-[100px] p-2 border-r border-b last:border-r-0 ${
                      !day ? "bg-muted/30" : ""
                    } ${isToday ? "bg-blue-50" : ""}`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isToday
                              ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                              : ""
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {leaves.slice(0, 3).map((leave, idx) => {
                            const typeColor =
                              TYPE_COLORS[leave.type as keyof typeof TYPE_COLORS] ||
                              TYPE_COLORS.Default;
                            return (
                              <motion.button
                                key={`${leave._id}-${idx}`}
                                onClick={() => handleLeaveClick(leave)}
                                className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate ${typeColor} text-white hover:opacity-80 transition-opacity`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {leave.user.firstName} {leave.user.lastName}
                              </motion.button>
                            );
                          })}
                          {leaves.length > 3 && (
                            <div className="text-xs text-muted-foreground pl-1.5">
                              +{leaves.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Annual Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-sm">Sick Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500"></div>
              <span className="text-sm">Vacation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Emergency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="text-sm">Unpaid Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>View details of this leave request</DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    {selectedLeave.user.firstName} {selectedLeave.user.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLeave.user.employeeId || "No ID"}
                  </div>
                </div>
                <Badge className={STATUS_COLORS[selectedLeave.status as keyof typeof STATUS_COLORS]}>
                  {selectedLeave.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">{selectedLeave.type}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <div className="mt-1">{selectedLeave.user.department || "N/A"}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Duration</label>
                <div className="mt-1">
                  {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {selectedLeave.reason}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Submitted On
                </label>
                <div className="mt-1 text-sm">
                  {formatDate(selectedLeave._creationTime)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
