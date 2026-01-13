import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Maximize2, 
  XCircle 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function ReviewClaims() {
  const navigate = useNavigate();
  const claims = useQuery(api.expenses.getPendingClaims);
  const reviewClaim = useMutation(api.expenses.reviewClaim);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [managerComments, setManagerComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset comments when changing claims
  useEffect(() => {
    setManagerComments("");
  }, [currentIndex]);

  if (claims === undefined) {
    return <div className="p-8 text-center">Loading claims...</div>;
  }

  if (claims.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
        </div>
        <h2 className="text-2xl font-bold">All Caught Up!</h2>
        <p className="text-muted-foreground">There are no pending claims to review.</p>
        <Button onClick={() => navigate("/dashboard/expenses")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Expenses
        </Button>
      </div>
    );
  }

  const currentClaim = claims[currentIndex];
  const progress = ((currentIndex + 1) / claims.length) * 100;

  const handleReview = async (status: "approved" | "rejected") => {
    setIsSubmitting(true);
    try {
      await reviewClaim({
        id: currentClaim._id,
        status,
        managerComments,
      });
      toast.success(`Claim ${status} successfully`);
      
      // If this was the last item, it will disappear from the list automatically due to reactivity
      // But we need to handle the index if it goes out of bounds
      if (currentIndex >= claims.length - 1) {
        setCurrentIndex(Math.max(0, claims.length - 2)); // Go to previous or 0
      }
    } catch (error) {
      toast.error("Failed to update claim status");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextClaim = () => {
    if (currentIndex < claims.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevClaim = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/expenses")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Claim Approval</h1>
            <p className="text-muted-foreground">Reviewing claim {currentIndex + 1} of {claims.length}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 px-3 py-1">
          Pending Review
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Claim Details */}
          <Card>
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Claim ID</p>
                  <p className="font-mono text-sm">CLM-{currentClaim._id.slice(-6).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                    Pending
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Employee</p>
                  <div className="font-medium">{currentClaim.userName}</div>
                  <div className="text-xs text-muted-foreground">{currentClaim.userEmployeeId}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
                  <p>{new Date(currentClaim.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Expense Type</p>
                  <p>{currentClaim.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Merchant / Description</p>
                  <p>{currentClaim.description}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Claim Amount</p>
                <p className="text-3xl font-bold">RM {currentClaim.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>

          {/* Manager Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Manager Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Add comments or notes about this claim..." 
                className="min-h-[120px] resize-none bg-muted/30"
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Receipt Image */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Receipt Image</CardTitle>
              {currentClaim.receiptImageUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Maximize2 className="mr-2 h-4 w-4" /> View Full Size
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex items-center justify-center bg-black/90 border-none">
                    <img 
                      src={currentClaim.receiptImageUrl}
                      alt="Receipt Full Size"
                      className="max-w-full max-h-full object-contain"
                    />
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 min-h-[300px] flex flex-col items-center justify-center p-6">
                {currentClaim.receiptImageUrl ? (
                  <img 
                    src={currentClaim.receiptImageUrl}
                    alt="Receipt"
                    className="max-h-[280px] object-contain rounded-md shadow-sm"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No receipt image attached</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Approval Guidelines */}
          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="text-base text-blue-900 dark:text-blue-100">Approval Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <span>Verify receipt matches claim amount</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <span>Check if expense is work-related</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <span>Confirm merchant and date accuracy</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <span>Ensure proper documentation</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => handleReview("rejected")}
              disabled={isSubmitting}
            >
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleReview("approved")}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button 
              variant="ghost" 
              onClick={prevClaim} 
              disabled={currentIndex === 0}
              className="w-[48%]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button 
              variant="ghost" 
              onClick={nextClaim} 
              disabled={currentIndex === claims.length - 1}
              className="w-[48%]"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
