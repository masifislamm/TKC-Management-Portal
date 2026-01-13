import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listLeaveRequests = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaveRequests")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getMyLeaveRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("leaveRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const requestLeave = mutation({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("leaveRequests", {
      userId,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      type: args.type,
      status: "pending",
    });
  },
});

export const updateLeaveStatus = mutation({
  args: {
    id: v.id("leaveRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getLeaveApprovalStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const allRequests = await ctx.db.query("leaveRequests").collect();
    
    const pending = allRequests.filter(r => r.status === "pending").length;
    const thisMonth = allRequests.filter(r => r.startDate >= startOfMonth.getTime()).length;
    const approved = allRequests.filter(r => r.status === "approved").length;
    const rejected = allRequests.filter(r => r.status === "rejected").length;

    return {
      pending,
      thisMonth,
      approved,
      rejected
    };
  }
});

export const getPendingLeaveRequestsWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const pendingRequests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const results = await Promise.all(pendingRequests.map(async (request) => {
      const user = await ctx.db.get(request.userId);
      if (!user) return null;

      // Calculate duration
      const duration = Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1; // Inclusive

      // Calculate balance (simplified: initial - approved of same type)
      const userApprovedRequests = await ctx.db
        .query("leaveRequests")
        .withIndex("by_user", (q) => q.eq("userId", request.userId))
        .collect();
      
      const approvedOfType = userApprovedRequests.filter(
        r => r.status === "approved" && r.type === request.type
      );
      
      const usedDays = approvedOfType.reduce((acc, req) => {
        return acc + (Math.ceil((req.endDate - req.startDate) / (1000 * 60 * 60 * 24)) + 1);
      }, 0);

      // Determine initial leave based on type (simple heuristic)
      // In a real app, this might be more complex or stored in a separate table
      let initialLeave = 0;
      const typeLower = request.type.toLowerCase();
      if (typeLower.includes("sick")) {
        initialLeave = user.initialSickLeave || 10; // Default 10 if not set
      } else {
        initialLeave = user.initialAnnualLeave || 20; // Default 20 if not set
      }

      const balance = initialLeave - usedDays;

      return {
        ...request,
        user,
        duration,
        balance
      };
    }));

    return results.filter(r => r !== null);
  }
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const leaveRequests = await ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "pending")).collect();

    const totalEmployees = users.length;
    const activeEmployees = users.filter(u => u.status === "active" || !u.status).length; // Default to active if not set
    const onLeaveEmployees = users.filter(u => u.status === "on_leave").length;
    const drivers = users.filter(u => u.role === "driver").length;
    const pendingLeaveRequests = leaveRequests.length;

    return {
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      drivers,
      pendingLeaveRequests
    };
  },
});

export const getAllLeaveRequestsForCalendar = query({
  args: {},
  handler: async (ctx) => {
    const leaveRequests = await ctx.db
      .query("leaveRequests")
      .order("desc")
      .take(500);

    const results = await Promise.all(leaveRequests.map(async (request) => {
      const user = await ctx.db.get(request.userId);
      if (!user) return null;

      return {
        _id: request._id,
        _creationTime: request._creationTime,
        userId: request.userId,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason,
        status: request.status,
        type: request.type,
        user: {
          _id: user._id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          name: user.name || "",
          employeeId: user.employeeId || "",
          department: user.department || "",
        }
      };
    }));

    return results.filter(r => r !== null);
  }
});