import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("invoices")
        .withSearchIndex("search_client", (q) => 
          q.search("clientName", args.search!)
        )
        .paginate(args.paginationOpts);
    }

    let q = ctx.db.query("invoices").order("desc");

    if (args.status && args.status !== "all") {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await q.paginate(args.paginationOpts);
  },
});

export const matchToDelivery = mutation({
  args: {
    invoiceId: v.id("invoices"),
    deliveryOrderId: v.id("deliveryOrders"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    const delivery = await ctx.db.get(args.deliveryOrderId);

    if (!invoice || !delivery) {
      throw new Error("Document not found");
    }

    // Update invoice
    await ctx.db.patch(args.invoiceId, {
      deliveryOrderId: args.deliveryOrderId,
    });

    // Update delivery
    await ctx.db.patch(args.deliveryOrderId, {
      status: "invoiced",
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("invoices").collect();
    
    const totalOutstanding = invoices
      .filter(i => i.status !== "paid" && i.status !== "draft")
      .reduce((sum, i) => sum + i.amount, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const sentThisMonth = invoices.filter(i => 
      i.status === "sent" && i._creationTime >= startOfMonth
    ).length;

    const pendingPayment = invoices.filter(i => 
      i.status === "pending" || i.status === "sent" || i.status === "overdue"
    ).length;

    const draft = invoices.filter(i => i.status === "draft").length;

    return {
      totalOutstanding,
      sentThisMonth,
      pendingPayment,
      draft
    };
  },
});

export const getById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unit: v.string(),
        unitPrice: v.number(),
        total: v.number(),
      })
    ),
    deliveryOrderId: v.optional(v.id("deliveryOrders")),
    dueDate: v.number(),
    source: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate amount including tax if applicable
    const subtotal = args.items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = args.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    
    const id = await ctx.db.insert("invoices", {
      invoiceId,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientAddress: args.clientAddress,
      items: args.items,
      amount: totalAmount,
      deliveryOrderId: args.deliveryOrderId,
      status: "draft",
      dueDate: args.dueDate,
      source: args.source || "manual",
      taxRate: args.taxRate,
      paymentTerms: args.paymentTerms,
    });

    if (args.deliveryOrderId) {
      await ctx.db.patch(args.deliveryOrderId, {
        status: "invoiced",
      });
    }

    return id;
  },
});

export const createBulk = mutation({
  args: {
    invoices: v.array(
      v.object({
        clientName: v.string(),
        clientEmail: v.optional(v.string()),
        clientAddress: v.optional(v.string()),
        items: v.array(
          v.object({
            description: v.string(),
            quantity: v.number(),
            unit: v.string(),
            unitPrice: v.number(),
            total: v.number(),
          })
        ),
        deliveryOrderId: v.optional(v.id("deliveryOrders")),
        dueDate: v.number(),
        source: v.optional(v.string()),
        taxRate: v.optional(v.number()),
        paymentTerms: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const invoice of args.invoices) {
      const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = invoice.taxRate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      
      const id = await ctx.db.insert("invoices", {
        invoiceId,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientAddress: invoice.clientAddress,
        items: invoice.items,
        amount: totalAmount,
        deliveryOrderId: invoice.deliveryOrderId,
        status: "draft",
        dueDate: invoice.dueDate,
        source: invoice.source || "manual",
        taxRate: invoice.taxRate,
        paymentTerms: invoice.paymentTerms,
      });

      if (invoice.deliveryOrderId) {
        await ctx.db.patch(invoice.deliveryOrderId, {
          status: "invoiced",
        });
      }
      ids.push(id);
    }
    return ids;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("approved"),
      v.literal("pending")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteInvoice = mutation({
  args: {
    id: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // If invoice was linked to a delivery order, reset its status
    if (invoice.deliveryOrderId) {
      await ctx.db.patch(invoice.deliveryOrderId, {
        status: "delivered",
      });
    }

    // Delete the invoice
    await ctx.db.delete(args.id);
  },
});