import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowLeft, Download, FileText, Search, TrendingUp, Wallet, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function SalarySummary() {
  const navigate = useNavigate();
  const summary = useQuery(api.salaries.getSalarySummary, { year: new Date().getFullYear() });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/hr")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Salary Summary</h2>
            <p className="text-muted-foreground">View salary payment history and analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <h3 className="text-2xl font-bold">{summary ? formatCurrency(summary.stats.thisMonth) : "..."}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/20 dark:text-green-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paid This Year</p>
              <h3 className="text-2xl font-bold">{summary ? formatCurrency(summary.stats.paidThisYear) : "..."}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/20 dark:text-purple-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Monthly</p>
              <h3 className="text-2xl font-bold">{summary ? formatCurrency(summary.stats.avgMonthly) : "..."}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg dark:bg-orange-900/20 dark:text-orange-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <h3 className="text-2xl font-bold">{summary ? summary.stats.pending : "..."}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Salary Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {summary && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="var(--color-primary)" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "var(--color-primary)" }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Month Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {summary && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={summary.breakdown} margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 12 }} 
                      interval={0}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/30 p-4 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by month..." className="pl-9 bg-background" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="2024">
          <SelectTrigger className="w-[120px] bg-background">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Salary Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Date Processed</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Regular Staff</TableHead>
                <TableHead>Drivers</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary?.records.map((record, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{record.month}</TableCell>
                  <TableCell>{new Date(record.dateProcessed).toLocaleDateString()}</TableCell>
                  <TableCell>{record.employees}</TableCell>
                  <TableCell>{formatCurrency(record.regularStaff)}</TableCell>
                  <TableCell>{formatCurrency(record.drivers)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(record.grandTotal)}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === "Paid" ? "default" : "secondary"} className={record.status === "Paid" ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" size="sm" className="text-blue-600">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!summary || summary.records.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No salary records found for this year.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="grid md:grid-cols-3 gap-8 text-sm text-muted-foreground border-t pt-8 mt-8">
        <div>
          <h4 className="font-semibold text-foreground mb-2">Payment Schedule</h4>
          <p>Salaries are processed on the last working day of each month</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Export Options</h4>
          <p>Download CSV reports for accounting and payroll integration</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-2">Historical Data</h4>
          <p>Access salary records dating back to company inception</p>
        </div>
      </div>
    </div>
  );
}
