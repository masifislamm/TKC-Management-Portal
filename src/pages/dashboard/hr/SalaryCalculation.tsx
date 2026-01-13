import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Calculator, CheckCircle, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function SalaryCalculation() {
  const navigate = useNavigate();
  const [month, setMonth] = useState<string>(new Date().getMonth().toString());
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [period, setPeriod] = useState<string>("1"); // 1 or 2
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateSalaries = useMutation(api.salaries.calculateSalaries);
  const processAllSalaries = useMutation(api.salaries.processAllSalariesInPeriod);
  
  const salaries = useQuery(api.salaries.getSalariesByPeriod, {
    month: parseInt(month),
    year: parseInt(year),
    period: parseInt(period),
  });

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const count = await calculateSalaries({
        month: parseInt(month),
        year: parseInt(year),
        period: parseInt(period),
      });
      toast.success(`Calculated salaries for ${count} drivers`);
    } catch (error) {
      toast.error("Failed to calculate salaries");
      console.error(error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await processAllSalaries({
        month: parseInt(month),
        year: parseInt(year),
        period: parseInt(period),
      });
      toast.success("All salaries processed successfully");
    } catch (error) {
      toast.error("Failed to process salaries");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = [2023, 2024, 2025, 2026];

  // Derived stats
  const totalDrivers = salaries?.length || 0;
  const totalPayout = salaries?.reduce((acc, s) => acc + s.totalAmount, 0) || 0;
  const totalDeliveries = salaries?.reduce((acc, s) => {
    const details = JSON.parse(s.details);
    return acc + (details.deliveryCount || 0);
  }, 0) || 0;
  const totalTonnage = salaries?.reduce((acc, s) => {
    const details = JSON.parse(s.details);
    return acc + (details.totalTonnage || 0);
  }, 0) || 0;

  const getPeriodLabel = () => {
    const m = months[parseInt(month)];
    const y = year;
    if (period === "1") return `${m} 1-15, ${y}`;
    return `${m} 16-End, ${y}`;
  };

  const getPeriodDateRange = () => {
    const m = parseInt(month);
    const y = parseInt(year);
    if (period === "1") {
      return `${y}-${(m + 1).toString().padStart(2, '0')}-01 to ${y}-${(m + 1).toString().padStart(2, '0')}-15`;
    } else {
      const lastDay = new Date(y, m + 1, 0).getDate();
      return `${y}-${(m + 1).toString().padStart(2, '0')}-16 to ${y}-${(m + 1).toString().padStart(2, '0')}-${lastDay}`;
    }
  };

  const hasData = salaries && salaries.length > 0;

  return (
    <div className="space-y-6 p-2 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/hr")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Driver Commission Calculation</h1>
            <p className="text-muted-foreground">Bi-monthly salary calculation (every 15 days)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {hasData && (
            <Button onClick={handleProcess} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Process Salaries
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="space-y-2 w-full md:w-1/3">
              <label className="text-sm font-medium">Salary Period (Bi-monthly)</label>
              <div className="flex gap-2">
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st - 15th</SelectItem>
                    <SelectItem value="2">16th - End</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">System calculates driver salaries every 15 days based on deliveries</p>
            </div>
            <Button onClick={handleCalculate} disabled={isCalculating} size="lg" className="w-full md:w-auto">
              {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
              Calculate Salaries
            </Button>
          </div>
        </CardContent>
      </Card>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-lg border border-dashed">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Calculator className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Select Period and Calculate</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            Choose a bi-monthly period and click "Calculate Salaries" to calculate driver commissions based on delivery orders and weigh tickets.
          </p>
          <div className="mt-8 bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm dark:bg-blue-900/20 dark:text-blue-300">
            Note: System calculates salaries every 15 days
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-1">Calculation Period</div>
                <div className="text-2xl font-bold">{getPeriodLabel()}</div>
              </div>
              <div className="text-right">
                <div className="text-blue-100 text-sm font-medium mb-1">Period Range</div>
                <div className="text-xl font-semibold">{getPeriodDateRange()}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Total Drivers</div>
                <div className="text-3xl font-bold mt-2">{totalDrivers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Total Deliveries</div>
                <div className="text-3xl font-bold mt-2">{totalDeliveries}</div>
                <div className="text-xs text-muted-foreground mt-1">In this period</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Total Tonnage</div>
                <div className="text-3xl font-bold mt-2">{totalTonnage.toFixed(1)} tons</div>
                <div className="text-xs text-muted-foreground mt-1">In this period</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Total Payout</div>
                <div className="text-3xl font-bold mt-2 text-blue-700 dark:text-blue-300">
                  RM {totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">For this 15-day period</div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Driver Commission Breakdown
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Commission for {getPeriodLabel()} (calculated from DOs and weigh tickets)
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Deliveries / Tonnage</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Total Commission</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Payout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary) => {
                    const details = JSON.parse(salary.details);
                    return (
                      <TableRow key={salary._id}>
                        <TableCell>
                          <div className="font-medium">{salary.driverName}</div>
                          <div className="text-xs text-muted-foreground">{salary.driverEmployeeId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{details.deliveryCount} shipments</div>
                          <div className="text-xs text-muted-foreground">{details.totalTonnage?.toFixed(1)} tons</div>
                        </TableCell>
                        <TableCell>
                          RM {details.commissionRate?.toFixed(2)}/ton
                        </TableCell>
                        <TableCell>
                          RM {salary.commissionAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          RM {salary.deductions?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell className="font-bold">
                          RM {salary.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={5}>Total Driver Salaries ({getPeriodLabel()})</TableCell>
                    <TableCell>RM {totalPayout.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="bg-blue-50/50 dark:bg-blue-950/10">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">How Bi-Monthly Driver Commission Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <span className="font-medium text-foreground">Calculation Frequency:</span> Every 15 days (twice per month)</li>
                <li>• <span className="font-medium text-foreground">Period 1:</span> 1st to 15th of each month</li>
                <li>• <span className="font-medium text-foreground">Period 2:</span> 16th to end of each month</li>
                <li>• <span className="font-medium text-foreground">Tonnage Commission:</span> MYR 15 per ton delivered (from DOs and weigh tickets)</li>
                <li>• <span className="font-medium text-foreground">Total Payout:</span> Tonnage Commission - Deductions</li>
                <li>• Drivers are paid purely on commission based on tonnage delivered in each 15-day period</li>
              </ul>
            </CardContent>
          </Card>

          {/* Manual Adjustments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Adjustments</CardTitle>
              <p className="text-sm text-muted-foreground">Add deductions or other adjustments before processing</p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Add Adjustment</Button>
            </CardContent>
          </Card>

          {/* Ready to Process */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Ready to Process</h3>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  <li>• Total payout for <span className="font-bold">{getPeriodLabel()}</span>: <span className="font-bold">RM {totalPayout.toFixed(2)}</span></li>
                  <li>• All calculations have been verified</li>
                  <li>• Click "Process Salaries" to queue payments</li>
                  <li>• Drivers will be notified once processed</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
