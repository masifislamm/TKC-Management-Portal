import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    driverId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("deliveryOrders")
        .withSearchIndex("search_client", (q) => 
          q.search("clientName", args.search!)
        )
        .paginate(args.paginationOpts);
    }

    let q = ctx.db.query("deliveryOrders").order("desc");

    if (args.status && args.status !== "all") {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.driverId) {
      q = q.filter((q) => q.eq(q.field("driverId"), args.driverId));
    }

    return await q.paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { id: v.id("deliveryOrders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getById = query({
  args: { id: v.id("deliveryOrders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithDetails = query({
  args: { id: v.id("deliveryOrders") },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.id);
    if (!delivery) return null;

    let driver = null;
    if (delivery.driverId) {
      driver = await ctx.db.get(delivery.driverId);
    }

    // Get the image URL if proof exists
    let deliveryProofUrl = null;
    if (delivery.deliveryProof) {
      deliveryProofUrl = await ctx.storage.getUrl(delivery.deliveryProof);
    }

    return {
      ...delivery,
      driver,
      deliveryProofUrl,
    };
  },
});

export const create = mutation({
  args: {
    clientName: v.string(),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unit: v.string(),
      })
    ),
    notes: v.optional(v.string()),
    driverId: v.optional(v.id("users")),
    deliveryDate: v.optional(v.number()),
    expectedTonnage: v.optional(v.number()),
    destinationAddress: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if client exists, if not create it
    const existingClient = await ctx.db
      .query("clients")
      .withIndex("by_name", (q) => q.eq("name", args.clientName))
      .first();

    if (!existingClient) {
      await ctx.db.insert("clients", {
        name: args.clientName,
        contactPerson: args.contactPerson,
        phone: args.contactPhone,
        address: args.destinationAddress,
      });
    }

    // Check if materials exist, if not create them
    for (const item of args.items) {
      const existingMaterial = await ctx.db
        .query("materials")
        .withIndex("by_name", (q) => q.eq("name", item.description))
        .first();

      if (!existingMaterial) {
        await ctx.db.insert("materials", {
          name: item.description,
        });
      }
    }

    const deliveryOrderId = `DO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return await ctx.db.insert("deliveryOrders", {
      deliveryOrderId,
      clientName: args.clientName,
      items: args.items,
      status: args.driverId ? "assigned" : "pending",
      notes: args.notes,
      driverId: args.driverId,
      deliveryDate: args.deliveryDate,
      expectedTonnage: args.expectedTonnage,
      destinationAddress: args.destinationAddress,
      contactPerson: args.contactPerson,
      contactPhone: args.contactPhone,
    });
  },
});

export const assignDriver = mutation({
  args: {
    id: v.id("deliveryOrders"),
    driverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      driverId: args.driverId,
      status: "assigned",
    });
  },
});

export const confirmDelivery = mutation({
  args: {
    id: v.id("deliveryOrders"),
    deliveryProof: v.id("_storage"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      deliveryProof: args.deliveryProof,
      status: "delivered",
      deliveryDate: Date.now(),
      notes: args.notes,
    });
  },
});

export const getPendingDeliveries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("deliveryOrders")
      .withIndex("by_status", (q) => q.eq("status", "delivered"))
      .take(50);
  },
});