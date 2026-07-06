import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AppShell } from "@/components/shared/AppShell";
import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";
import FeedbackPage from "@/pages/FeedbackPage";
import ClientsListPage from "@/pages/ClientsListPage";
import ClientNewPage from "@/pages/ClientNewPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import ProjectsListPage from "@/pages/ProjectsListPage";
import NewProjectPage from "@/pages/NewProjectPage";
import VariantReviewPage from "@/pages/VariantReviewPage";
import AuditReportPage from "@/pages/AuditReportPage";
import DeliveriesListPage from "@/pages/DeliveriesListPage";
import DeliveryComposerPage from "@/pages/DeliveryComposerPage";
import PrintAuditReportPage from "@/pages/PrintAuditReportPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <>
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
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  );
}
