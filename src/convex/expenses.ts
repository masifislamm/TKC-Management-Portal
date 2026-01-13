import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingClaims = expenses.filter((e) => e.status === "pending").length;
    const approvedClaims = expenses.filter((e) => e.status === "approved").length;
    const flaggedClaims = expenses.filter((e) => e.status === "rejected").length;

    // Group by Type for Pie Chart
    const expensesByType = expenses.reduce((acc, curr) => {
      const type = curr.type || "Other";
      acc[type] = (acc[type] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const typeData = Object.entries(expensesByType).map(([name, value], index) => ({
      name,
      value,
      fill: `var(--color-chart-${(index % 5) + 1})`,
    }));

    // Group by Month for Bar Chart (Last 6 months)
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const monthlyTrend = expenses.reduce((acc, curr) => {
      const date = new Date(curr.date);
      const month = date.toLocaleString('default', { month: 'short' });
      // Only count if it's in our months list (simple check)
      if (months.includes(month)) {
        acc[month] = (acc[month] || 0) + curr.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const trendData = months.map((month) => ({
      month,
      amount: monthlyTrend[month] || 0,
    }));

    // Get recent claims (last 5)
    const recentClaims = await ctx.db
      .query("expenses")
      .order("desc")
      .take(5);
      
    // Enrich recent claims with user details if needed, but for now we'll just return them
    // In a real app we'd join with users table
    const recentClaimsWithUser = await Promise.all(
      recentClaims.map(async (claim) => {
        const user = await ctx.db.get(claim.submittedBy);
        return {
          ...claim,
          userName: user?.name || user?.email || "Unknown User",
        };
      })
    );

    return {
      totalExpenses,
      pendingClaims,
      approvedClaims,
      flaggedClaims,
      typeData,
      trendData,
      recentClaims: recentClaimsWithUser,
    };
  },
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getMyExpenses = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    return await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("submittedBy", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getMyRecentExpenses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("submittedBy", userId))
      .order("desc")
      .take(20);
  },
});

export const getPendingClaims = query({
  args: {},
  handler: async (ctx) => {
    const claims = await ctx.db
      .query("expenses")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Enrich with user details
    const claimsWithUser = await Promise.all(
      claims.map(async (claim) => {
        const user = await ctx.db.get(claim.submittedBy);
        let receiptImageUrl = null;
        if (claim.receiptImage) {
          receiptImageUrl = await ctx.storage.getUrl(claim.receiptImage);
        }
        return {
          ...claim,
          userName: user?.name || user?.email || "Unknown User",
          userEmployeeId: user?.employeeId || "N/A",
          userImage: user?.image,
          receiptImageUrl,
        };
      })
    );

    return claimsWithUser;
  },
});

export const getExpensesForExport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    accountCode: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let expenses = await ctx.db.query("expenses").collect();

    // Filter by date
    if (args.startDate) {
      expenses = expenses.filter(e => e.date >= args.startDate!);
    }
    if (args.endDate) {
      expenses = expenses.filter(e => e.date <= args.endDate!);
    }

    // Filter by account code
    if (args.accountCode && args.accountCode !== "all") {
      expenses = expenses.filter(e => e.accountCode === args.accountCode);
    }

    // Filter by type
    if (args.type && args.type !== "all") {
      expenses = expenses.filter(e => e.type === args.type);
    }

    // Filter by status
    if (args.status && args.status !== "all") {
      expenses = expenses.filter(e => e.status === args.status);
    }

    // Enrich with user data for "Submitted By"
    const expensesWithUser = await Promise.all(
      expenses.map(async (e) => {
        const user = await ctx.db.get(e.submittedBy);
        return {
          ...e,
          submittedByName: user?.name || user?.email || "Unknown",
        };
      })
    );

    return expensesWithUser;
  },
});

export const create = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    date: v.number(),
    type: v.string(),
    receiptImage: v.optional(v.id("_storage")),
    accountCode: v.optional(v.string()),
    deliveryOrderId: v.optional(v.id("deliveryOrders")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("expenses", {
      ...args,
      submittedBy: userId,
      status: "pending",
    });
  },
});

export const createBulk = mutation({
  args: {
    expenses: v.array(
      v.object({
        description: v.string(),
        amount: v.number(),
        date: v.number(),
        type: v.string(),
        submittedBy: v.id("users"),
        accountCode: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // We could add more validation here
    
    const promises = args.expenses.map(expense => 
      ctx.db.insert("expenses", {
        ...expense,
        status: "pending",
      })
    );

    await Promise.all(promises);
    return { count: args.expenses.length };
  },
});

export const reviewClaim = mutation({
  args: { 
    id: v.id("expenses"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    managerComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In a real app, check for admin/manager role here
    await ctx.db.patch(args.id, { 
      status: args.status,
      managerComments: args.managerComments
    });
  },
});

export const approve = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    // In a real app, check for admin role here
    await ctx.db.patch(args.id, { status: "approved" });
  },
});

export const reject = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "rejected" });
  },
});