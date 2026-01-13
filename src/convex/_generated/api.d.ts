/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as clients from "../clients.js";
import type * as dashboard from "../dashboard.js";
import type * as deliveries from "../deliveries.js";
import type * as driver from "../driver.js";
import type * as employees from "../employees.js";
import type * as expenses from "../expenses.js";
import type * as files from "../files.js";
import type * as hr from "../hr.js";
import type * as http from "../http.js";
import type * as invoices from "../invoices.js";
import type * as materials from "../materials.js";
import type * as pdf from "../pdf.js";
import type * as salaries from "../salaries.js";
import type * as users from "../users.js";
import type * as weighTickets from "../weighTickets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  clients: typeof clients;
  dashboard: typeof dashboard;
  deliveries: typeof deliveries;
  driver: typeof driver;
  employees: typeof employees;
  expenses: typeof expenses;
  files: typeof files;
  hr: typeof hr;
  http: typeof http;
  invoices: typeof invoices;
  materials: typeof materials;
  pdf: typeof pdf;
  salaries: typeof salaries;
  users: typeof users;
  weighTickets: typeof weighTickets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
