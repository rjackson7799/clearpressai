import { Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";
import FeedbackPage from "@/pages/FeedbackPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/f/:token" element={<FeedbackPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
