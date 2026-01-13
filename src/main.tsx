import { Toaster } from "@/components/ui/sonner";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router";
import "./index.css";
import "./types/global.d.ts";
import DashboardLayout from "./layouts/DashboardLayout";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const DriverAuthPage = lazy(() => import("./pages/DriverAuth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Dashboard Pages
const DashboardHome = lazy(() => import("./pages/dashboard/Home.tsx"));
const Deliveries = lazy(() => import("./pages/dashboard/Deliveries.tsx"));
const CreateDelivery = lazy(() => import("./pages/dashboard/CreateDelivery.tsx"));
const DeliveryDetails = lazy(() => import("./pages/dashboard/DeliveryDetails.tsx"));
const UploadWeighTicket = lazy(() => import("./pages/dashboard/UploadWeighTicket.tsx"));
const Invoices = lazy(() => import("./pages/dashboard/Invoices.tsx"));
const InvoiceDetails = lazy(() => import("./pages/dashboard/InvoiceDetails.tsx"));
const GenerateInvoiceFromDO = lazy(() => import("./pages/dashboard/GenerateInvoiceFromDO.tsx"));
const GenerateInvoiceFromSummary = lazy(() => import("./pages/dashboard/GenerateInvoiceFromSummary.tsx"));
const Expenses = lazy(() => import("./pages/dashboard/Expenses.tsx"));
const ReviewClaims = lazy(() => import("./pages/dashboard/ReviewClaims.tsx"));
const ImportExpenses = lazy(() => import("./pages/dashboard/ImportExpenses.tsx"));
const HR = lazy(() => import("./pages/dashboard/HR.tsx"));
const Employees = lazy(() => import("./pages/dashboard/Employees.tsx"));
const MatchDocuments = lazy(() => import("./pages/dashboard/MatchDocuments.tsx"));
const UploadExpenseOCR = lazy(() => import("./pages/dashboard/UploadExpenseOCR.tsx"));
const ExportExpenses = lazy(() => import("./pages/dashboard/ExportExpenses.tsx"));
const LeaveApproval = lazy(() => import("./pages/dashboard/LeaveApproval.tsx"));
const LeaveCalendar = lazy(() => import("./pages/dashboard/LeaveCalendar.tsx"));
const SalaryCalculation = lazy(() => import("./pages/dashboard/hr/SalaryCalculation.tsx"));
const SalarySummary = lazy(() => import("./pages/dashboard/hr/SalarySummary.tsx"));
const AllClaims = lazy(() => import("./pages/dashboard/AllClaims.tsx"));
const InvoicePrint = lazy(() => import("./pages/dashboard/InvoicePrint.tsx"));
const AdminControl = lazy(() => import("./pages/dashboard/AdminControl.tsx"));

// Driver Pages
const DriverDashboard = lazy(() => import("./pages/driver/Dashboard.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              <Route path="/driver-login" element={<DriverAuthPage redirectAfterAuth="/driver-dashboard" />} />
              <Route path="/driver-dashboard" element={<DriverDashboard />} />
              <Route path="/print/invoices/:id" element={<InvoicePrint />} />

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="deliveries" element={<Deliveries />} />
                <Route path="deliveries/create" element={<CreateDelivery />} />
                <Route path="deliveries/:id" element={<DeliveryDetails />} />
                <Route path="deliveries/upload-ticket" element={<UploadWeighTicket />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/:id" element={<InvoiceDetails />} />
                <Route path="invoices/create-from-do" element={<GenerateInvoiceFromDO />} />
                <Route path="invoices/create-from-summary" element={<GenerateInvoiceFromSummary />} />
                <Route path="match" element={<MatchDocuments />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="expenses/review" element={<ReviewClaims />} />
                <Route path="expenses/all" element={<AllClaims />} />
                <Route path="expenses/import" element={<ImportExpenses />} />
                <Route path="expenses/upload-ocr" element={<UploadExpenseOCR />} />
                <Route path="expenses/export" element={<ExportExpenses />} />
                <Route path="hr" element={<HR />} />
                <Route path="hr/leave-approval" element={<LeaveApproval />} />
                <Route path="hr/leave-calendar" element={<LeaveCalendar />} />
                <Route path="hr/salary-calculation" element={<SalaryCalculation />} />
                <Route path="hr/salary-summary" element={<SalarySummary />} />
                <Route path="employees" element={<Employees />} />
                <Route path="admin" element={<AdminControl />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);