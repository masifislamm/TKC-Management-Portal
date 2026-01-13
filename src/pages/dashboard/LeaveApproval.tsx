import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Calendar as CalendarIcon, Check, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function LeaveApproval() {
  const navigate = useNavigate();
  const stats = useQuery(api.hr.getLeaveApprovalStats);
  const pendingRequests = useQuery(api.hr.getPendingLeaveRequestsWithDetails);
  const updateStatus = useMutation(api.hr.updateLeaveStatus);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleReview = (request: any) => {
    setSelectedRequest(request);
    setIsReviewOpen(true);
  };

  const handleAction = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    try {
      await updateStatus({ id: selectedRequest._id, status });
      toast.success(`Leave request ${status}`);
      setIsReviewOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const generateRequestId = (id: string, timestamp: number) => {
    return `LR-${new Date(timestamp).getFullYear()}-${id.slice(-3).toUpperCase()}`;
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
            <h1 className="text-2xl font-bold tracking-tight">Leave Approval</h1>
            <p className="text-muted-foreground">Review and approve leave requests</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/hr/leave-calendar")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.thisMonth || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.approved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.rejected || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No pending requests found
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests?.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-medium">
                      {generateRequestId(request._id, request._creationTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {request.user.firstName} {request.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {request.user.employeeId || "EMP-???"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{formatDate(request.startDate)}</TableCell>
                    <TableCell>{formatDate(request.endDate)}</TableCell>
                    <TableCell>{request.duration}</TableCell>
                    <TableCell>{request.balance} days</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleReview(request)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
            <DialogDescription>
              Review the details below and approve or reject the request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee</label>
                  <div className="font-medium">
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div>{selectedRequest.type}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <div>
                    {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                    <span className="ml-2 text-muted-foreground">({selectedRequest.duration} days)</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Balance</label>
                  <div>{selectedRequest.balance} days</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {selectedRequest.reason}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => handleAction("rejected")}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleAction("approved")}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
