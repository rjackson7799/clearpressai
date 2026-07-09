import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AppShell } from "@/components/shared/AppShell";
import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { Toaster } from "@/components/ui/sonner";
// Eager: the first paint for each audience (unauthenticated login, the public
// feedback page, the authenticated landing dashboard). None pulls in the heavy
// editor/parser deps.
import LoginPage from "@/pages/LoginPage";
import FeedbackPage from "@/pages/FeedbackPage";
import DashboardPage from "@/pages/DashboardPage";

// Lazy: everything else. The heavy routes (Tiptap editors, pdfjs/mammoth
// brand-voice extraction, docx) live here, so they no longer ship in the
// initial bundle.
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ClientsListPage = lazy(() => import("@/pages/ClientsListPage"));
const ClientNewPage = lazy(() => import("@/pages/ClientNewPage"));
const ClientDetailPage = lazy(() => import("@/pages/ClientDetailPage"));
const ProjectsListPage = lazy(() => import("@/pages/ProjectsListPage"));
const NewProjectPage = lazy(() => import("@/pages/NewProjectPage"));
const VariantReviewPage = lazy(() => import("@/pages/VariantReviewPage"));
const AuditReportPage = lazy(() => import("@/pages/AuditReportPage"));
const DeliveriesListPage = lazy(() => import("@/pages/DeliveriesListPage"));
const DeliveryComposerPage = lazy(() => import("@/pages/DeliveryComposerPage"));
const PrintAuditReportPage = lazy(() => import("@/pages/PrintAuditReportPage"));
const HelpPage = lazy(() => import("@/pages/HelpPage"));
const InternalFeedbackPage = lazy(() => import("@/pages/InternalFeedbackPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export default function App() {
  return (
    <>
      <DocumentHead />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/f/:token"
            element={
              <AppErrorBoundary variant="minimal">
                <FeedbackPage />
              </AppErrorBoundary>
            }
          />
          <Route element={<ProtectedRoute />}>
            {/* Print routes deliberately render outside AppShell so the
                sidebar/header don't appear in the PDF output. */}
            <Route
              path="/print/audit-report/:id"
              element={<PrintAuditReportPage />}
            />
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsListPage />} />
              <Route path="/clients/new" element={<ClientNewPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/projects" element={<ProjectsListPage />} />
              <Route path="/projects/new" element={<NewProjectPage />} />
              <Route path="/projects/:id/review" element={<VariantReviewPage />} />
              <Route path="/projects/:id/audit" element={<AuditReportPage />} />
              <Route path="/projects/:id/deliver" element={<DeliveryComposerPage />} />
              <Route path="/projects/:id/deliveries" element={<DeliveriesListPage />} />
              <Route path="/feedback" element={<InternalFeedbackPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}
