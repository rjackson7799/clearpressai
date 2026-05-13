import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AppShell } from "@/components/shared/AppShell";
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

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/f/:token" element={<FeedbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/clients/new" element={<ClientNewPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
