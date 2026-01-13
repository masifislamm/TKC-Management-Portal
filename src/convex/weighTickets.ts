import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    ticketNumber: v.string(),
    truckNumber: v.string(),
    tonnage: v.number(),
    date: v.number(),
    clientName: v.string(),
    materialType: v.string(),
    image: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("weighTickets", args);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("weighTickets").order("desc").take(100);
  },
});
