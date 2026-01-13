import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  DRIVER: "driver",
  HR: "hr",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.DRIVER),
  v.literal(ROLES.HR),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      
      // New fields for HR
      phone: v.optional(v.string()),
      salaryType: v.optional(v.string()),
      status: v.optional(v.string()), // "active", "inactive", "on_leave"
      employeeId: v.optional(v.string()), // "EMP-001"

      // Extended Employee Details
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      streetAddress: v.optional(v.string()),
      city: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      
      joinDate: v.optional(v.number()),
      department: v.optional(v.string()),
      
      emergencyContactName: v.optional(v.string()),
      emergencyContactRelationship: v.optional(v.string()),
      emergencyContactPhone: v.optional(v.string()),
      
      initialAnnualLeave: v.optional(v.number()),
      initialSickLeave: v.optional(v.number()),
      
      notes: v.optional(v.string()),
    }).index("email", ["email"]) // index for the email. do not remove or modify
      .index("by_role", ["role"])
      .index("by_status", ["status"]),

    // Employee invitations - stores employee data before they log in
    employeeInvitations: defineTable({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      
      streetAddress: v.optional(v.string()),
      city: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      
      role: roleValidator,
      employeeId: v.string(),
      joinDate: v.number(),
      department: v.string(),
      
      emergencyContactName: v.optional(v.string()),
      emergencyContactRelationship: v.optional(v.string()),
      emergencyContactPhone: v.optional(v.string()),
      
      initialAnnualLeave: v.number(),
      initialSickLeave: v.number(),
      
      notes: v.optional(v.string()),
      
      // Track if this invitation has been claimed
      claimed: v.optional(v.boolean()),
      claimedByUserId: v.optional(v.id("users")),
    })
      .index("by_email", ["email"])
      .index("by_claimed", ["claimed"]),

    // Delivery Orders
    deliveryOrders: defineTable({
      deliveryOrderId: v.optional(v.string()),
      clientName: v.string(),
      items: v.array(
        v.object({
          description: v.string(),
          quantity: v.number(),
          unit: v.string(),
        })
      ),
      status: v.union(
        v.literal("pending"),
        v.literal("assigned"),
        v.literal("in-progress"),
        v.literal("delivered"),
        v.literal("invoiced")
      ),
      driverId: v.optional(v.id("users")),
      deliveryProof: v.optional(v.id("_storage")), // Image of delivery confirmation
      deliveryDate: v.optional(v.number()),
      notes: v.optional(v.string()),
      
      // New fields for the Create DO form
      expectedTonnage: v.optional(v.number()),
      destinationAddress: v.optional(v.string()),

      // Contact details
      contactPerson: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
    })
      .index("by_status", ["status"])
      .index("by_driver", ["driverId"])
      .searchIndex("search_client", { searchField: "clientName" }),

    // Clients
    clients: defineTable({
      name: v.string(),
      contactPerson: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
    }).index("by_name", ["name"]),

    // Materials
    materials: defineTable({
      name: v.string(),
    }).index("by_name", ["name"]),

    // Weigh Tickets
    weighTickets: defineTable({
      ticketNumber: v.string(),
      truckNumber: v.string(),
      tonnage: v.number(),
      date: v.number(),
      clientName: v.string(),
      materialType: v.string(),
      image: v.id("_storage"),
    }).index("by_date", ["date"]),

    // Invoices
    invoices: defineTable({
      invoiceId: v.optional(v.string()),
      clientName: v.string(),
      clientEmail: v.optional(v.string()), // Added
      clientAddress: v.optional(v.string()), // Added
      amount: v.number(),
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
      status: v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("paid"),
        v.literal("overdue"),
        v.literal("approved"),
        v.literal("pending")
      ),
      dueDate: v.number(),
      generatedFile: v.optional(v.id("_storage")), // PDF file
      source: v.optional(v.string()), // manual, summary_file, delivery_order
      
      // New fields for invoice generation
      taxRate: v.optional(v.number()),
      paymentTerms: v.optional(v.string()),
    })
      .index("by_status", ["status"])
      .index("by_client", ["clientName"])
      .index("by_delivery_order", ["deliveryOrderId"])
      .searchIndex("search_client", { searchField: "clientName" }),

    // Expenses
    expenses: defineTable({
      description: v.string(),
      amount: v.number(),
      date: v.number(),
      type: v.string(), // e.g., "Fuel", "Maintenance", "Meals"
      receiptImage: v.optional(v.id("_storage")),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("reimbursed")
      ),
      submittedBy: v.id("users"),
      accountCode: v.optional(v.string()),
      managerComments: v.optional(v.string()), // Added for review process
      deliveryOrderId: v.optional(v.id("deliveryOrders")), // Link to a delivery
    })
      .index("by_status", ["status"])
      .index("by_user", ["submittedBy"])
      .index("by_delivery_order", ["deliveryOrderId"]), // Index for looking up expenses by delivery

    // Leave Requests
    leaveRequests: defineTable({
      userId: v.id("users"),
      startDate: v.number(),
      endDate: v.number(),
      reason: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      ),
      type: v.string(), // e.g., "Sick", "Vacation"
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"]),

    // Salaries / Payroll
    salaries: defineTable({
      driverId: v.id("users"),
      periodStart: v.number(),
      periodEnd: v.number(),
      baseAmount: v.number(),
      commissionAmount: v.number(),
      totalAmount: v.number(),
      deductions: v.optional(v.number()), // Added for manual adjustments
      status: v.union(v.literal("draft"), v.literal("processed")),
      details: v.string(), // JSON string for breakdown
    })
      .index("by_driver", ["driverId"])
      .index("by_period", ["periodStart", "periodEnd"]) // Added index for querying by period
      .index("by_driver_period", ["driverId", "periodStart"]), // Compound index for efficient lookups
  },
  {
    schemaValidation: false,
  },
);

export default schema;