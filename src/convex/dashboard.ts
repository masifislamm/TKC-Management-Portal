import { query } from "./_generated/server";
import { v } from "convex/values";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Get active delivery orders (pending or assigned)
    const activeDeliveries = await ctx.db
      .query("deliveryOrders")
      .withIndex("by_status")
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"), 
          q.eq(q.field("status"), "assigned")
        )
      )
      .collect();

    // Get pending invoices (draft)
    const pendingInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .collect();

    // Get pending claims (expenses)
    const pendingClaims = await ctx.db
      .query("expenses")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Get drivers on delivery (drivers with assigned orders)
    // We can approximate this by counting unique driverIds in active deliveries
    const activeDriverIds = new Set(
      activeDeliveries
        .map((d) => d.driverId)
        .filter((id) => id !== undefined)
    );

    return {
      activeDeliveries: activeDeliveries.length,
      pendingInvoices: pendingInvoices.length,
      pendingClaims: pendingClaims.length,
      driversOnDelivery: activeDriverIds.size || 0,
    };
  },
});

export const getChartData = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000);
    
    // Get all deliveries from the last 6 months
    const allDeliveries = await ctx.db
      .query("deliveryOrders")
      .filter((q) => q.gte(q.field("_creationTime"), sixMonthsAgo))
      .collect();
    
    // Get all expenses from the last 6 months
    const allExpenses = await ctx.db
      .query("expenses")
      .filter((q) => q.gte(q.field("_creationTime"), sixMonthsAgo))
      .collect();
    
    // Group deliveries by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const deliveryByMonth = new Map<string, number>();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now - (i * 30 * 24 * 60 * 60 * 1000));
      const monthKey = monthNames[date.getMonth()];
      deliveryByMonth.set(monthKey, 0);
    }
    
    // Count deliveries per month
    allDeliveries.forEach(delivery => {
      const date = new Date(delivery._creationTime);
      const monthKey = monthNames[date.getMonth()];
      if (deliveryByMonth.has(monthKey)) {
        deliveryByMonth.set(monthKey, (deliveryByMonth.get(monthKey) || 0) + 1);
      }
    });
    
    // Group expenses by type and calculate percentages
    const expenseByType = new Map<string, number>();
    let totalExpenseAmount = 0;
    
    allExpenses.forEach(expense => {
      const type = expense.type || "Other";
      expenseByType.set(type, (expenseByType.get(type) || 0) + expense.amount);
      totalExpenseAmount += expense.amount;
    });
    
    // Convert to percentage values
    const expenseData = Array.from(expenseByType.entries())
      .map(([type, amount]) => ({
        type,
        value: totalExpenseAmount > 0 ? Math.round((amount / totalExpenseAmount) * 100) : 0,
        fill: type === "Fuel" ? "var(--color-blue-500)" :
              type === "Maintenance" ? "var(--color-purple-500)" :
              type === "Meals" ? "var(--color-amber-500)" :
              "var(--color-gray-500)"
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4); // Top 4 expense types
    
    // If no expenses, return default structure
    if (expenseData.length === 0) {
      expenseData.push(
        { type: "Fuel", value: 45, fill: "var(--color-blue-500)" },
        { type: "Maintenance", value: 28, fill: "var(--color-purple-500)" },
        { type: "Meals", value: 15, fill: "var(--color-amber-500)" },
        { type: "Other", value: 12, fill: "var(--color-gray-500)" }
      );
    }
    
    return {
      deliveries: Array.from(deliveryByMonth.entries()).map(([month, count]) => ({
        month,
        count
      })),
      expenses: expenseData
    };
  }
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const deliveries = await ctx.db.query("deliveryOrders").order("desc").take(5);
    const expenses = await ctx.db.query("expenses").order("desc").take(5);
    const invoices = await ctx.db.query("invoices").order("desc").take(5);

    // Combine and sort by creation time
    const activity = [
      ...deliveries.map(d => ({ 
        type: "delivery", 
        id: d._id,
        title: `Delivery ${d.status}`,
        desc: `${d.clientName} - ${d.items.length} items`,
        timestamp: d._creationTime,
        status: d.status
      })),
      ...expenses.map(e => ({ 
        type: "expense", 
        id: e._id,
        title: `Expense ${e.status}`,
        desc: `${e.description} - $${e.amount}`,
        timestamp: e._creationTime,
        status: e.status
      })),
      ...invoices.map(i => ({ 
        type: "invoice", 
        id: i._id,
        title: `Invoice ${i.status}`,
        desc: `${i.clientName} - $${i.amount}`,
        timestamp: i._creationTime,
        status: i.status
      })),
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    return activity;
  }
});

export const getSystemActivity = query({
  args: {},
  handler: async (ctx) => {
    // Get recent user activities from various tables
    const recentDeliveries = await ctx.db.query("deliveryOrders").order("desc").take(3);
    const recentExpenses = await ctx.db.query("expenses").order("desc").take(3);
    const users = await ctx.db.query("users").collect();
    
    // Create a map of user IDs to user info
    const userMap = new Map(users.map(u => [u._id, u]));
    
    const activities = [];
    
    // Add delivery activities
    for (const delivery of recentDeliveries) {
      if (delivery.status === "delivered" && delivery.driverId) {
        const driver = userMap.get(delivery.driverId);
        activities.push({
          type: "upload",
          title: "Uploaded Proof",
          description: `Uploaded delivery proof for ${delivery.deliveryOrderId || "delivery"}`,
          userEmail: driver?.email || "driver@tkc.com",
          timestamp: delivery._creationTime,
          icon: "upload",
          color: "purple"
        });
      } else if (delivery.status === "assigned" && delivery.driverId) {
        const driver = userMap.get(delivery.driverId);
        activities.push({
          type: "delivery",
          title: "Delivery Assigned",
          description: `Assigned delivery to ${delivery.clientName}`,
          userEmail: driver?.email || "driver@tkc.com",
          timestamp: delivery._creationTime,
          icon: "truck",
          color: "blue"
        });
      }
    }
    
    // Add expense activities
    for (const expense of recentExpenses) {
      if (expense.status === "approved") {
        const user = userMap.get(expense.submittedBy);
        activities.push({
          type: "approval",
          title: "Claim Approved",
          description: `Approved expense claim for ${expense.description}`,
          userEmail: user?.email || "hr@tkc.com",
          timestamp: expense._creationTime,
          icon: "check",
          color: "green"
        });
      } else if (expense.status === "pending") {
        const user = userMap.get(expense.submittedBy);
        activities.push({
          type: "claim",
          title: "Claim Submitted",
          description: `Submitted expense claim: ${expense.description}`,
          userEmail: user?.email || "employee@tkc.com",
          timestamp: expense._creationTime,
          icon: "dollar",
          color: "amber"
        });
      }
    }
    
    // Sort by timestamp and take top 3
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
  }
});