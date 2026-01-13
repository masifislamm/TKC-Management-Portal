import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Calendar, LogOut, User, FileText, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface ProfileViewProps {
  user: any;
  onSignOut: () => void;
  onBack: () => void;
}

export default function ProfileView({ user, onSignOut, onBack }: ProfileViewProps) {
  const requestLeave = useMutation(api.hr.requestLeave);
  const myLeaveRequests = useQuery(api.hr.getMyLeaveRequests);

  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitLeave = async () => {
    if (!leaveType) {
      toast.error("Please select a leave type");
      return;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }
    if (!endDate) {
      toast.error("Please select an end date");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for leave");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestLeave({
        type: leaveType,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        reason: reason.trim(),
      });

      toast.success("Leave request submitted successfully!");

      // Reset form
      setLeaveType("");
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user's leave requests (already filtered by backend)
  const userLeaveRequests = myLeaveRequests || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-white/90 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span className="text-sm">Back</span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name || "Driver"}</h1>
            <p className="text-blue-100 text-sm">{user.email}</p>
            {user.employeeId && (
              <p className="text-blue-100 text-xs mt-1">ID: {user.employeeId}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Profile Information */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Role</span>
              <span className="font-medium text-gray-900 capitalize">{user.role || "Driver"}</span>
            </div>
            {user.phone && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{user.phone}</span>
              </div>
            )}
            {user.department && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Department</span>
                <span className="font-medium text-gray-900">{user.department}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-gray-900 capitalize">
                {user.status || "Active"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Apply for Leave */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Apply for Leave
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                  <SelectValue placeholder="Select leave type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-50 border-gray-200 h-11"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-50 border-gray-200 h-11"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Reason</Label>
              <Textarea
                placeholder="Please provide a reason for your leave request..."
                className="bg-gray-50 border-gray-200 min-h-[100px] resize-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmitLeave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Leave Request"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* My Leave Requests */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              My Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userLeaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No leave requests yet
              </div>
            ) : (
              <div className="space-y-3">
                {userLeaveRequests.map((request: any) => {
                  const duration = Math.ceil(
                    (request.endDate - request.startDate) / (1000 * 60 * 60 * 24)
                  ) + 1;

                  return (
                    <div
                      key={request._id}
                      className="border border-gray-200 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 capitalize">
                          {request.type} Leave
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>
                            {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                            {format(new Date(request.endDate), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {duration} {duration === 1 ? "day" : "days"}
                          </span>
                        </div>
                      </div>
                      {request.reason && (
                        <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                          {request.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
