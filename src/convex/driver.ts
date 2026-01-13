import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Enforce driver role check
    if (user.role !== "driver") {
      throw new Error("Access denied. Only drivers can access this dashboard.");
    }

    // Get all deliveries for this driver
    const deliveries = await ctx.db
      .query("deliveryOrders")
      .withIndex("by_driver", (q) => q.eq("driverId", userId))
      .collect();

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).getTime();
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Filter for today's deliveries (assigned, in-progress, or delivered today)
    // Include assigned deliveries even without a delivery date
    const todaysDeliveries = deliveries.filter(d => {
        // Always include assigned and in-progress deliveries
        if (d.status === "assigned" || d.status === "in-progress") return true;
        
        // For other statuses, check if they're scheduled for today
        if (!d.deliveryDate) return false;
        return d.deliveryDate >= startOfDay && d.deliveryDate <= endOfDay;
    });

    // Get active deliveries for dropdown (assigned or in-progress)
    const activeDeliveries = deliveries.filter(d => 
        d.status === "assigned" || d.status === "in-progress"
    );

    const completedThisWeek = deliveries.filter(d => 
        (d.status === "delivered" || d.status === "invoiced") && 
        d.deliveryDate && 
        d.deliveryDate >= startOfWeek.getTime()
    ).length;

    // Get expenses with pending status
    const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_user", (q) => q.eq("submittedBy", userId))
        .collect();
    
    const pendingExpenses = expenses.filter(e => e.status === "pending");
    const pendingClaimsCount = pendingExpenses.length;
    const pendingClaimsTotal = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
        user: {
            name: user.name || "Driver",
            userId: userId,
            role: user.role,
        },
        stats: {
            todaysCount: todaysDeliveries.length,
            pendingClaims: pendingClaimsCount,
            pendingClaimsTotal,
            completedThisWeek
        },
        todaysDeliveries,
        activeDeliveries,
        allDeliveries: deliveries,
        pendingExpenses,
        debugInfo: {
            totalDeliveries: deliveries.length,
            userId: userId,
        }
    };
  }
});

export const startDelivery = mutation({
  args: { id: v.id("deliveryOrders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const delivery = await ctx.db.get(args.id);
    if (!delivery || delivery.driverId !== userId) {
        throw new Error("Invalid delivery");
    }

    await ctx.db.patch(args.id, { status: "in-progress" });
  }
});