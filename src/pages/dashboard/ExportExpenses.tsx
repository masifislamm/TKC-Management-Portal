import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ExportExpenses() {
  const navigate = useNavigate();
  
  // Filter States
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [accountCode, setAccountCode] = useState<string>("all");
  const [expenseType, setExpenseType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  // Column Selection States
  const [selectedColumns, setSelectedColumns] = useState({
    date: true,
    type: true,
    accountCode: true,
    status: true,
    merchant: true, // Mapping to description
    amount: true,
    description: true,
    submittedBy: true,
  });

  // Fetch Data
  const expenses = useQuery(api.expenses.getExpensesForExport, {
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
    accountCode: accountCode === "all" ? undefined : accountCode,
    type: expenseType === "all" ? undefined : expenseType,
    status: status === "all" ? undefined : status,
  });

  const filteredExpenses = expenses || [];
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExport = (format: "csv" | "xlsx") => {
    if (!filteredExpenses.length) {
      toast.error("No data to export");
      return;
    }

    const dataToExport = filteredExpenses.map(e => {
      const row: any = {};
      if (selectedColumns.date) row["Date"] = new Date(e.date).toLocaleDateString();
      if (selectedColumns.merchant) row["Merchant"] = e.description; // Using description as merchant
      if (selectedColumns.type) row["Expense Type"] = e.type;
      if (selectedColumns.amount) row["Amount"] = e.amount;
      if (selectedColumns.accountCode) row["Account Code"] = e.accountCode || "-";
      if (selectedColumns.status) row["Status"] = e.status;
      if (selectedColumns.description) row["Description"] = e.description;
      if (selectedColumns.submittedBy) row["Submitted By"] = e.submittedByName;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    const fileName = `expenses_export_${new Date().toISOString().split('T')[0]}`;
    
    if (format === "csv") {
      XLSX.writeFile(workbook, `${fileName}.csv`);
    } else {
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }
    
    toast.success(`Exported ${filteredExpenses.length} records to ${format.toUpperCase()}`);
  };

  const toggleColumn = (key: keyof typeof selectedColumns) => {
    setSelectedColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Expenses</h1>
          <p className="text-muted-foreground">Filter and export expense data to CSV or Excel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Filters & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-4 w-4 text-primary"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></div>
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Code</Label>
                <Select value={accountCode} onValueChange={setAccountCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Account Codes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Account Codes</SelectItem>
                    {/* In a real app, fetch these dynamically */}
                    <SelectItem value="ACC-5100">ACC-5100 (Fuel)</SelectItem>
                    <SelectItem value="ACC-5200">ACC-5200 (Maintenance)</SelectItem>
                    <SelectItem value="ACC-5300">ACC-5300 (Meals)</SelectItem>
                    <SelectItem value="ACC-5400">ACC-5400 (Accommodation)</SelectItem>
                    <SelectItem value="ACC-5500">ACC-5500 (Tolls)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expense Type</Label>
                <Select value={expenseType} onValueChange={setExpenseType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Expense Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Expense Types</SelectItem>
                    <SelectItem value="Meals">Meals</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Fuel">Fuel</SelectItem>
                    <SelectItem value="Office">Office Supplies</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="reimbursed">Reimbursed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Select Columns */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Columns to Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-date" checked={selectedColumns.date} onCheckedChange={() => toggleColumn('date')} />
                  <Label htmlFor="col-date">Date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-merchant" checked={selectedColumns.merchant} onCheckedChange={() => toggleColumn('merchant')} />
                  <Label htmlFor="col-merchant">Merchant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-type" checked={selectedColumns.type} onCheckedChange={() => toggleColumn('type')} />
                  <Label htmlFor="col-type">Expense Type</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-amount" checked={selectedColumns.amount} onCheckedChange={() => toggleColumn('amount')} />
                  <Label htmlFor="col-amount">Amount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-account" checked={selectedColumns.accountCode} onCheckedChange={() => toggleColumn('accountCode')} />
                  <Label htmlFor="col-account">Account Code</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-desc" checked={selectedColumns.description} onCheckedChange={() => toggleColumn('description')} />
                  <Label htmlFor="col-desc">Description</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-status" checked={selectedColumns.status} onCheckedChange={() => toggleColumn('status')} />
                  <Label htmlFor="col-status">Status</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="col-submitted" checked={selectedColumns.submittedBy} onCheckedChange={() => toggleColumn('submittedBy')} />
                  <Label htmlFor="col-submitted">Submitted By</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preview ({filteredExpenses.length} records)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.slice(0, 5).map((expense) => (
                      <TableRow key={expense._id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>{expense.type}</TableCell>
                        <TableCell>RM {expense.amount.toFixed(2)}</TableCell>
                        <TableCell>{expense.accountCode || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            expense.status === 'approved' ? 'default' : 
                            expense.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          } className={
                            expense.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' : 
                            expense.status === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300' : ''
                          }>
                            {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No records found matching filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredExpenses.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Showing 5 of {filteredExpenses.length} records
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleExport("csv")}>
                <FileText className="mr-2 h-4 w-4" /> Export as CSV
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleExport("xlsx")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date Range:</span>
                <span className="font-medium">
                  {startDate ? new Date(startDate).toLocaleDateString() : "All"} - {endDate ? new Date(endDate).toLocaleDateString() : "All"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Records:</span>
                <span className="font-medium">{filteredExpenses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Columns:</span>
                <span className="font-medium">{Object.values(selectedColumns).filter(Boolean).length}</span>
              </div>
              <div className="pt-4 border-t border-blue-200 dark:border-blue-800 flex justify-between items-center">
                <span className="text-sm font-medium">Total Amount:</span>
                <span className="text-lg font-bold">RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Export filtered expense data</p>
              <p>• Choose CSV or Excel format</p>
              <p>• Select specific columns</p>
              <p>• Data includes all applied filters</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
