import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Debug query to check delivery data
export const debugDeliveries = query({
  args: {
    driverId: v.id("users"),
    month: v.number(),
    year: v.number(),
    period: v.number(),
  },
  handler: async (ctx, args) => {
    let startDate: number;
    let endDate: number;

    if (args.period === 1) {
      startDate = new Date(args.year, args.month, 1).getTime();
      endDate = new Date(args.year, args.month, 15, 23, 59, 59, 999).getTime();
    } else {
      startDate = new Date(args.year, args.month, 16).getTime();
      endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();
    }

    const deliveries = await ctx.db
      .query("deliveryOrders")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect();

    return deliveries.map(d => ({
      id: d._id,
      deliveryOrderId: d.deliveryOrderId,
      status: d.status,
      deliveryDate: d.deliveryDate,
      _creationTime: d._creationTime,
      expectedTonnage: d.expectedTonnage,
      inPeriod: (() => {
        const status = d.status?.toLowerCase();
        if (status !== "delivered" && status !== "invoiced") return false;
        const dateToCheck = d.deliveryDate || d._creationTime;
        return dateToCheck >= startDate && dateToCheck <= endDate;
      })(),
      startDate,
      endDate,
    }));
  },
});

export const calculateSalaries = mutation({
  args: {
    month: v.number(), // 0-11
    year: v.number(),
    period: v.number(), // 1 (1-15) or 2 (16-end)
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Calculate start and end dates based on period
    let startDate: number;
    let endDate: number;

    if (args.period === 1) {
      startDate = new Date(args.year, args.month, 1).getTime();
      endDate = new Date(args.year, args.month, 15, 23, 59, 59, 999).getTime();
    } else {
      startDate = new Date(args.year, args.month, 16).getTime();
      // Last day of the month
      endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();
    }

    // Get all drivers
    const drivers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "driver"))
      .collect();

    const results = [];

    for (const driver of drivers) {
      // Get deliveries for this driver in this period
      // Note: In a real app, we'd use an index on date. 
      // For now, fetching by driver and filtering is acceptable for small datasets.
      const deliveries = await ctx.db
        .query("deliveryOrders")
        .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
        .collect();

      // Filter deliveries by period using deliveryDate (when delivery was completed) or _creationTime as fallback
      // Count deliveries with "delivered" or "invoiced" status (invoiced means completed and billed)
      const periodDeliveries = deliveries.filter(d => {
        if (d.status !== "delivered" && d.status !== "invoiced") return false;
        
        // Use deliveryDate if available, otherwise fall back to _creationTime
        const dateToCheck = d.deliveryDate || d._creationTime;
        return dateToCheck >= startDate && dateToCheck <= endDate;
      });

      // Calculate commission
      // Logic: 15 MYR per ton
      let totalTonnage = 0;
      // Note: deliveryOrders schema has expectedTonnage, but weighTickets has actual tonnage.
      // Ideally we link weighTickets to deliveryOrders. 
      // For this implementation, we will assume we can get tonnage from the DO or associated ticket.
      // Since we don't have a direct link in the schema provided in context (DO -> Ticket), 
      // we'll use expectedTonnage from DO as a fallback or 0 if missing.
      
      for (const d of periodDeliveries) {
        totalTonnage += d.expectedTonnage || 0;
      }

      const commissionRate = 15; // 15 per ton
      const commissionAmount = totalTonnage * commissionRate;
      
      // Base salary - assuming 0 for commission based model or keep existing logic
      // The prompt implies "Driver Commission Calculation", so maybe just commission?
      // I'll keep a small base if they have a salaryType, otherwise 0.
      let baseAmount = 0;
      if (driver.salaryType === "Senior") baseAmount = 500; // Reduced base for bi-monthly
      
      const deductions = 0; // Default 0
      const totalAmount = baseAmount + commissionAmount - deductions;

      // Check if salary record already exists for this period and driver
      const existingSalary = await ctx.db
        .query("salaries")
        .withIndex("by_driver_period", (q) => q.eq("driverId", driver._id).eq("periodStart", startDate))
        .first();

      const salaryData = {
        driverId: driver._id,
        periodStart: startDate,
        periodEnd: endDate,
        baseAmount,
        commissionAmount,
        totalAmount,
        deductions,
        status: "draft" as const,
        details: JSON.stringify({
          deliveryCount: periodDeliveries.length,
          totalTonnage,
          commissionRate,
          baseType: driver.salaryType || "Standard"
        })
      };

      if (existingSalary) {
        // Update existing draft
        if (existingSalary.status === "draft") {
          await ctx.db.patch(existingSalary._id, salaryData);
          results.push(existingSalary._id);
        }
      } else {
        const id = await ctx.db.insert("salaries", salaryData);
        results.push(id);
      }
    }

    return results.length;
  },
});

export const getSalariesByPeriod = query({
  args: {
    month: v.number(),
    year: v.number(),
    period: v.number(),
  },
  handler: async (ctx, args) => {
    let startDate: number;
    let endDate: number;

    if (args.period === 1) {
      startDate = new Date(args.year, args.month, 1).getTime();
      endDate = new Date(args.year, args.month, 15, 23, 59, 59, 999).getTime();
    } else {
      startDate = new Date(args.year, args.month, 16).getTime();
      endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();
    }

    const salaries = await ctx.db
      .query("salaries")
      .withIndex("by_period", (q) => q.eq("periodStart", startDate).eq("periodEnd", endDate))
      .collect();

    // Enrich with driver details
    const enrichedSalaries = await Promise.all(
      salaries.map(async (salary) => {
        const driver = await ctx.db.get(salary.driverId);
        return {
          ...salary,
          driverName: driver?.name || "Unknown Driver",
          driverEmail: driver?.email,
          driverEmployeeId: driver?.employeeId || "N/A",
        };
      })
    );

    return enrichedSalaries;
  },
});

export const getSalaries = query({
  args: {},
  handler: async (ctx) => {
    const salaries = await ctx.db.query("salaries").order("desc").take(50);
    
    // Enrich with driver details
    const enrichedSalaries = await Promise.all(
      salaries.map(async (salary) => {
        const driver = await ctx.db.get(salary.driverId);
        return {
          ...salary,
          driverName: driver?.name || "Unknown Driver",
          driverEmail: driver?.email
        };
      })
    );

    return enrichedSalaries;
  },
});

export const processSalary = mutation({
  args: { id: v.id("salaries") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "processed" });
  },
});

export const processAllSalariesInPeriod = mutation({
  args: {
    month: v.number(),
    year: v.number(),
    period: v.number(),
  },
  handler: async (ctx, args) => {
    let startDate: number;
    let endDate: number;

    if (args.period === 1) {
      startDate = new Date(args.year, args.month, 1).getTime();
      endDate = new Date(args.year, args.month, 15, 23, 59, 59, 999).getTime();
    } else {
      startDate = new Date(args.year, args.month, 16).getTime();
      endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();
    }

    const salaries = await ctx.db
      .query("salaries")
      .withIndex("by_period", (q) => q.eq("periodStart", startDate).eq("periodEnd", endDate))
      .collect();

    for (const salary of salaries) {
      if (salary.status === "draft") {
        await ctx.db.patch(salary._id, { status: "processed" });
      }
    }
  },
});

export const getSalarySummary = query({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const year = args.year || new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1).getTime();
    const endOfYear = new Date(year + 1, 0, 0).getTime(); // Last day of current year

    // Fetch all salaries for the year
    // We use the range on periodStart which is the first field in by_period index
    const salaries = await ctx.db
      .query("salaries")
      .withIndex("by_period", (q) => 
        q.gte("periodStart", startOfYear).lte("periodStart", endOfYear)
      )
      .collect();

    // Aggregation Variables
    let totalPaidThisYear = 0;
    let pendingCount = 0;
    const monthlyAggregates = new Map<string, {
      month: string;
      monthIndex: number;
      year: number;
      totalAmount: number;
      driverTotal: number;
      regularTotal: number;
      employeeCount: Set<string>;
      status: "Paid" | "Pending";
      processedDate: number;
    }>();

    const currentMonthIndex = new Date().getMonth();
    let currentMonthTotal = 0;
    let currentMonthDriverBase = 0;
    let currentMonthDriverCommission = 0;

    for (const salary of salaries) {
      const date = new Date(salary.periodStart);
      const monthIndex = date.getMonth();
      const monthKey = `${monthIndex}-${date.getFullYear()}`;
      const monthName = date.toLocaleString('default', { month: 'long' });

      // Update yearly stats
      if (salary.status === "processed") {
        totalPaidThisYear += salary.totalAmount;
      } else {
        pendingCount++;
      }

      // Update Monthly Aggregates for Table and Trend
      if (!monthlyAggregates.has(monthKey)) {
        monthlyAggregates.set(monthKey, {
          month: `${monthName} ${date.getFullYear()}`,
          monthIndex,
          year: date.getFullYear(),
          totalAmount: 0,
          driverTotal: 0,
          regularTotal: 0, // Placeholder as we only have driver salaries
          employeeCount: new Set(),
          status: "Paid", // Default to Paid, switch to Pending if any draft found
          processedDate: salary.periodEnd, // Use period end as proxy for processed date
        });
      }

      const agg = monthlyAggregates.get(monthKey)!;
      agg.totalAmount += salary.totalAmount;
      agg.driverTotal += salary.totalAmount;
      agg.employeeCount.add(salary.driverId);
      if (salary.status === "draft") {
        agg.status = "Pending";
      }
      // Update processed date to the latest period end in the month
      if (salary.periodEnd > agg.processedDate) {
        agg.processedDate = salary.periodEnd;
      }

      // Current Month Breakdown
      if (monthIndex === currentMonthIndex && date.getFullYear() === year) {
        currentMonthTotal += salary.totalAmount;
        currentMonthDriverBase += salary.baseAmount;
        currentMonthDriverCommission += salary.commissionAmount;
      }
    }

    // Format Monthly Records
    const monthlyRecords = Array.from(monthlyAggregates.values())
      .sort((a, b) => b.monthIndex - a.monthIndex) // Descending order
      .map(agg => ({
        month: agg.month,
        dateProcessed: agg.processedDate,
        employees: agg.employeeCount.size,
        regularStaff: agg.regularTotal,
        drivers: agg.driverTotal,
        grandTotal: agg.totalAmount,
        status: agg.status
      }));

    // Format Trend Data (Last 6 months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mIndex = d.getMonth();
      const y = d.getFullYear();
      const key = `${mIndex}-${y}`;
      const agg = monthlyAggregates.get(key);
      trendData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        amount: agg ? agg.totalAmount : 0
      });
    }

    // Calculate Avg Monthly
    const monthsWithData = monthlyAggregates.size || 1;
    const avgMonthly = totalPaidThisYear / monthsWithData;

    return {
      stats: {
        thisMonth: currentMonthTotal,
        paidThisYear: totalPaidThisYear,
        avgMonthly,
        pending: pendingCount
      },
      trend: trendData,
      breakdown: [
        { name: "Regular Employees", value: 0, fill: "var(--color-chart-1)" }, // Placeholder
        { name: "Driver Base", value: currentMonthDriverBase, fill: "var(--color-chart-2)" },
        { name: "Driver Commission", value: currentMonthDriverCommission, fill: "var(--color-chart-3)" }
      ],
      records: monthlyRecords
    };
  }
});