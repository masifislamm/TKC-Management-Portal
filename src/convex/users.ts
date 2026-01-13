import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, mutation } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

export const listDrivers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "driver"))
      .collect();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Claim employee invitation when user logs in for the first time
export const claimEmployeeInvitation = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || !currentUser.email) {
      return null;
    }

    // Find unclaimed invitation for this email
    const invitation = await ctx.db
      .query("employeeInvitations")
      .withIndex("by_email", (q) => q.eq("email", currentUser.email!))
      .filter((q) => q.eq(q.field("claimed"), false))
      .first();

    if (invitation) {
      // Update user with employee data
      await ctx.db.patch(userId, {
        name: `${invitation.firstName} ${invitation.lastName}`,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        role: invitation.role,
        streetAddress: invitation.streetAddress,
        city: invitation.city,
        postalCode: invitation.postalCode,
        employeeId: invitation.employeeId,
        joinDate: invitation.joinDate,
        department: invitation.department,
        status: "active",
        emergencyContactName: invitation.emergencyContactName,
        emergencyContactRelationship: invitation.emergencyContactRelationship,
        emergencyContactPhone: invitation.emergencyContactPhone,
        initialAnnualLeave: invitation.initialAnnualLeave,
        initialSickLeave: invitation.initialSickLeave,
        notes: invitation.notes,
      });

      // Mark invitation as claimed
      await ctx.db.patch(invitation._id, {
        claimed: true,
        claimedByUserId: userId,
      });

      return { claimed: true, invitationId: invitation._id };
    }

    return { claimed: false };
  },
});