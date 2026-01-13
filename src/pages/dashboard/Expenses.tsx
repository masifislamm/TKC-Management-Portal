import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { 
  Loader2, 
  Plus, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Download,
  FileText,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import { toast } from "sonner";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  Tooltip
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";

export default function Expenses() {
  const stats = useQuery(api.expenses.getStats);
  const createExpense = useMutation(api.expenses.create);
  const analyzeReceipt = useAction(api.ai.analyzeReceipt);
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "Meals",
    date: new Date().toISOString().split('T')[0],
    receiptImage: "",
    accountCode: "",
  });

  const handleFileUpload = async (storageId: string, previewUrl: string) => {
    setFormData(prev => ({ ...prev, receiptImage: storageId }));
    
    // Analyze receipt
    setIsAnalyzing(true);
    try {
      const result = await analyzeReceipt({ storageId: storageId as any });
      if (result && typeof result === 'object' && 'data' in result) {
        const data = result.data as any;
        setFormData(prev => ({
          ...prev,
          amount: data.amount ? String(data.amount) : prev.amount,
          date: data.date ? data.date.split('T')[0] : prev.date,
          description: data.description || data.merchant || prev.description,
          type: data.category || prev.type,
        }));
        toast.success("Receipt analyzed successfully");
      } else if (result && typeof result === 'object' && 'error' in result) {
        toast.error(result.error || "Failed to analyze receipt");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze receipt");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createExpense({
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).getTime(),
        type: formData.type,
        receiptImage: formData.receiptImage ? formData.receiptImage as any : undefined,
        accountCode: formData.accountCode,
      });
      setIsOpen(false);
      toast.success("Expense submitted successfully");
      setFormData({
        description: "",
        amount: "",
        type: "Meals",
        date: new Date().toISOString().split('T')[0],
        receiptImage: "",
        accountCode: "",
      });
    } catch (error) {
      toast.error("Failed to submit expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses & Claims</h1>
          <p className="text-muted-foreground">Manage expenses and process claims</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/expenses/export")}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/expenses/upload-ocr")}>
            <Upload className="mr-2 h-4 w-4" /> Upload OCR
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Receipt</Label>
                  <FileUpload onUploadComplete={handleFileUpload} label="Upload Receipt" />
                  {isAnalyzing && <p className="text-xs text-muted-foreground animate-pulse">Analyzing receipt...</p>}
                  {formData.receiptImage && !isAnalyzing && <p className="text-xs text-muted-foreground">Receipt attached</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Category</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meals">Meals</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Fuel">Fuel</SelectItem>
                      <SelectItem value="Office">Office Supplies</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
                  Submit Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/expenses/import")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
          </Button>
          <Button size="sm" onClick={() => navigate("/dashboard/expenses/review")}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Review Claims
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {stats?.totalExpenses.toLocaleString() || "0"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingClaims || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvedClaims || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flaggedClaims || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Expenses by Expense Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <PieChart>
                  <Pie
                    data={stats?.typeData || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {(stats?.typeData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {(stats?.typeData || []).map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground">{item.name}: {Math.round((item.value / (stats?.totalExpenses || 1)) * 100)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={stats?.trendData || []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={10} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `RM${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Claims</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/dashboard/expenses/all")}>View All</Button>
          </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentClaims?.map((claim: any) => (
              <div key={claim._id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {claim.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{claim.userName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{new Date(claim.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{claim.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">RM {claim.amount.toFixed(2)}</span>
                  <Badge 
                    variant={claim.status === 'approved' ? 'default' : claim.status === 'rejected' ? 'destructive' : 'secondary'}
                    className={
                      claim.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' : 
                      claim.status === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300' : ''
                    }
                  >
                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
            {(!stats?.recentClaims || stats.recentClaims.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No recent claims found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsOpen(true)}>
          <CardContent className="pt-6">
            <div className="mb-4 h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-1">Upload Expense (OCR)</h3>
            <p className="text-sm text-muted-foreground">Upload receipt images for automatic processing</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/expenses/import")}>
          <CardContent className="pt-6">
            <div className="mb-4 h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-1">Import Excel</h3>
            <p className="text-sm text-muted-foreground">Bulk import expenses from spreadsheet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="mb-4 h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-1">Reimbursement Tracking</h3>
            <p className="text-sm text-muted-foreground">Track approved but unpaid reimbursements</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}