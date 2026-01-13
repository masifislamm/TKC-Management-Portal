import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { roleValidator } from "./schema";

// Store pending employee invitations
export const createEmployeeInvitation = mutation({
  args: {
    // Basic Info
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    
    // Address
    streetAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    
    // Employment
    role: v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("member"),
      v.literal("driver"),
      v.literal("hr")
    ),
    employeeId: v.optional(v.string()),
    joinDate: v.number(),
    department: v.string(),
    
    // Emergency Contact
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    
    // Leave Balance
    initialAnnualLeave: v.optional(v.number()),
    initialSickLeave: v.optional(v.number()),
    
    // Notes
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "hr")) {
      throw new Error("Not authorized to create employees");
    }

    // Check if invitation already exists for this email
    const existingInvitation = await ctx.db
      .query("employeeInvitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let finalEmployeeId = args.employeeId;
    if (!finalEmployeeId) {
      finalEmployeeId = `EMP-${Date.now().toString().slice(-4)}`;
    }

    if (existingInvitation) {
      // Update existing invitation
      await ctx.db.patch(existingInvitation._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        role: args.role,
        streetAddress: args.streetAddress,
        city: args.city,
        postalCode: args.postalCode,
        employeeId: finalEmployeeId,
        joinDate: args.joinDate,
        department: args.department,
        emergencyContactName: args.emergencyContactName,
        emergencyContactRelationship: args.emergencyContactRelationship,
        emergencyContactPhone: args.emergencyContactPhone,
        initialAnnualLeave: args.initialAnnualLeave || 15,
        initialSickLeave: args.initialSickLeave || 10,
        notes: args.notes,
      });
      return existingInvitation._id;
    }

    // Create new invitation
    const invitationId = await ctx.db.insert("employeeInvitations", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      role: args.role,
      streetAddress: args.streetAddress,
      city: args.city,
      postalCode: args.postalCode,
      employeeId: finalEmployeeId,
      joinDate: args.joinDate,
      department: args.department,
      emergencyContactName: args.emergencyContactName,
      emergencyContactRelationship: args.emergencyContactRelationship,
      emergencyContactPhone: args.emergencyContactPhone,
      initialAnnualLeave: args.initialAnnualLeave || 15,
      initialSickLeave: args.initialSickLeave || 10,
      notes: args.notes,
      claimed: false,
    });

    return invitationId;
  },
});

// Keep the old function name for compatibility
export const createEmployee = createEmployeeInvitation;

export const listAllEmployees = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "hr")) {
      throw new Error("Not authorized");
    }

    // Get all users
    const users = await ctx.db.query("users").collect();
    
    // Get all unclaimed invitations
    const invitations = await ctx.db
      .query("employeeInvitations")
      .withIndex("by_claimed", (q) => q.eq("claimed", false))
      .collect();

    // Combine them - invitations appear as "pending" users
    const combined = [
      ...users,
      ...invitations.map(inv => ({
        _id: inv._id,
        _creationTime: inv._creationTime,
        name: `${inv.firstName} ${inv.lastName}`,
        firstName: inv.firstName,
        lastName: inv.lastName,
        email: inv.email,
        phone: inv.phone,
        role: inv.role,
        streetAddress: inv.streetAddress,
        city: inv.city,
        postalCode: inv.postalCode,
        employeeId: inv.employeeId,
        joinDate: inv.joinDate,
        department: inv.department,
        status: "pending" as const,
        emergencyContactName: inv.emergencyContactName,
        emergencyContactRelationship: inv.emergencyContactRelationship,
        emergencyContactPhone: inv.emergencyContactPhone,
        initialAnnualLeave: inv.initialAnnualLeave,
        initialSickLeave: inv.initialSickLeave,
        notes: inv.notes,
      }))
    ];

    return combined;
  },
});

export const searchEmployees = query({
  args: {
    searchTerm: v.optional(v.string()),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let employees;

    if (args.role && args.role !== "all") {
      employees = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role as any))
        .collect();
    } else {
      employees = await ctx.db.query("users").collect();
    }

    if (args.status && args.status !== "all") {
      employees = employees.filter(e => e.status === args.status);
    }

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      employees = employees.filter(e => 
        e.name?.toLowerCase().includes(term) || 
        e.email?.toLowerCase().includes(term) ||
        e.employeeId?.toLowerCase().includes(term)
      );
    }

    return employees;
  },
});

export const updateEmployee = mutation({
  args: {
    id: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(roleValidator),
    department: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "hr")) {
      throw new Error("Not authorized");
    }

    const userRecordId = ctx.db.normalizeId("users", args.id);
    const inviteRecordId = ctx.db.normalizeId("employeeInvitations", args.id);

    const updates: any = {};
    if (args.firstName) updates.firstName = args.firstName;
    if (args.lastName) updates.lastName = args.lastName;
    if (args.email) updates.email = args.email;
    if (args.phone) updates.phone = args.phone;
    if (args.role) updates.role = args.role;
    if (args.department) updates.department = args.department;
    if (args.employeeId) updates.employeeId = args.employeeId;
    if (args.status) updates.status = args.status;

    if (userRecordId) {
      await ctx.db.patch(userRecordId, updates);
    } else if (inviteRecordId) {
      await ctx.db.patch(inviteRecordId, updates);
    } else {
      throw new Error("Employee not found");
    }
  },
});

export const deleteEmployee = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Not authorized");
    }

    const userRecordId = ctx.db.normalizeId("users", args.id);
    const inviteRecordId = ctx.db.normalizeId("employeeInvitations", args.id);

    if (userRecordId) {
      await ctx.db.delete(userRecordId);
    } else if (inviteRecordId) {
      await ctx.db.delete(inviteRecordId);
    }
  },
});