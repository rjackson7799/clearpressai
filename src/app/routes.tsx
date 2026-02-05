/**
 * ClearPress AI - Application Routes
 * Route configuration for PR Portal and Client Portal
 *
 * Uses React.lazy for code splitting to improve initial load performance
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// Lazy wrapper with error boundary and suspense handling
function LazyPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </RouteErrorBoundary>
  );
}

// Auth pages - loaded eagerly since they're entry points
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { AcceptInvitePage } from '@/pages/auth/AcceptInvitePage';

// Layout components - loaded eagerly since they wrap everything
import { PRPortalLayout } from '@/components/common/pr-portal';
import { ClientPortalLayout } from '@/components/common/client-portal';

// PR Portal pages - lazy loaded
const PRDashboard = lazy(() => import('@/pages/pr-portal/PRDashboard').then(m => ({ default: m.PRDashboard })));
const ProfilePage = lazy(() => import('@/pages/pr-portal/ProfilePage').then(m => ({ default: m.ProfilePage })));
const TeamPage = lazy(() => import('@/pages/pr-portal/TeamPage').then(m => ({ default: m.TeamPage })));
const ClientsPage = lazy(() => import('@/pages/pr-portal/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import('@/pages/pr-portal/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));
const ProjectsPage = lazy(() => import('@/pages/pr-portal/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/pr-portal/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ContentEditorPage = lazy(() => import('@/pages/pr-portal/ContentEditorPage').then(m => ({ default: m.ContentEditorPage })));
const ContentPage = lazy(() => import('@/pages/pr-portal/ContentPage').then(m => ({ default: m.ContentPage })));
const GuidedContentPage = lazy(() => import('@/pages/pr-portal/GuidedContentPage').then(m => ({ default: m.GuidedContentPage })));
const AnalyticsPage = lazy(() => import('@/pages/pr-portal/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const PRNotificationsPage = lazy(() => import('@/pages/pr-portal/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const PRSettingsPage = lazy(() => import('@/pages/pr-portal/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Client Portal pages - lazy loaded
const ClientDashboard = lazy(() => import('@/pages/client-portal/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
const ClientProjectsPage = lazy(() => import('@/pages/client-portal/ClientProjectsPage').then(m => ({ default: m.ClientProjectsPage })));
const ClientProjectDetailPage = lazy(() => import('@/pages/client-portal/ClientProjectDetailPage').then(m => ({ default: m.ClientProjectDetailPage })));
const ContentReviewPage = lazy(() => import('@/pages/client-portal/ContentReviewPage').then(m => ({ default: m.ContentReviewPage })));
const NewRequestPage = lazy(() => import('@/pages/client-portal/NewRequestPage').then(m => ({ default: m.NewRequestPage })));
const GuidedRequestPage = lazy(() => import('@/pages/client-portal/GuidedRequestPage').then(m => ({ default: m.GuidedRequestPage })));
const ClientNotificationsPage = lazy(() => import('@/pages/client-portal/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ReferenceDocumentsPage = lazy(() => import('@/pages/client-portal/ReferenceDocumentsPage').then(m => ({ default: m.ReferenceDocumentsPage })));
const ClientSettingsPage = lazy(() => import('@/pages/client-portal/ClientSettingsPage').then(m => ({ default: m.ClientSettingsPage })));

function RoleBasedRedirect() {
  const { role } = useAuth();

  if (role === 'client_user') {
    return <Navigate to="/client" replace />;
  }

  return <Navigate to="/pr" replace />;
}

export const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleBasedRedirect />
      </ProtectedRoute>
    ),
  },

  // Auth routes (public)
  {
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/signup',
    element: <SignupPage />,
  },
  {
    path: '/auth/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/auth/reset-password',
    element: <ResetPasswordPage />,
  },
  // Accept invite route (must be at root level, not under /auth)
  {
    path: '/accept-invite',
    element: <AcceptInvitePage />,
  },

  // PR Portal routes (pr_admin, pr_staff)
  {
    path: '/pr',
    element: (
      <ProtectedRoute allowedRoles={['pr_admin', 'pr_staff']}>
        <PRPortalLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <LazyPage component={PRDashboard} />,
      },
      {
        path: 'projects',
        element: <LazyPage component={ProjectsPage} />,
      },
      {
        path: 'projects/:id',
        element: <LazyPage component={ProjectDetailPage} />,
      },
      {
        path: 'projects/:projectId/content/new',
        element: <LazyPage component={ContentEditorPage} />,
      },
      {
        path: 'projects/:projectId/content/:contentId',
        element: <LazyPage component={ContentEditorPage} />,
      },
      {
        path: 'clients',
        element: <LazyPage component={ClientsPage} />,
      },
      {
        path: 'clients/:id',
        element: <LazyPage component={ClientDetailPage} />,
      },
      {
        path: 'content',
        element: <LazyPage component={ContentPage} />,
      },
      {
        path: 'content/new/guided',
        element: <LazyPage component={GuidedContentPage} />,
      },
      {
        path: 'team',
        element: <LazyPage component={TeamPage} />,
      },
      {
        path: 'analytics',
        element: <LazyPage component={AnalyticsPage} />,
      },
      {
        path: 'settings',
        element: <LazyPage component={PRSettingsPage} />,
      },
      {
        path: 'profile',
        element: <LazyPage component={ProfilePage} />,
      },
      {
        path: 'notifications',
        element: <LazyPage component={PRNotificationsPage} />,
      },
    ],
  },

  // Client Portal routes (client_user)
  {
    path: '/client',
    element: (
      <ProtectedRoute allowedRoles={['client_user']}>
        <ClientPortalLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <LazyPage component={ClientDashboard} />,
      },
      {
        path: 'projects',
        element: <LazyPage component={ClientProjectsPage} />,
      },
      {
        path: 'projects/:id',
        element: <LazyPage component={ClientProjectDetailPage} />,
      },
      {
        path: 'projects/:projectId/content/:contentId',
        element: <LazyPage component={ContentReviewPage} />,
      },
      {
        path: 'request-new',
        element: <LazyPage component={NewRequestPage} />,
      },
      {
        path: 'request-new/guided',
        element: <LazyPage component={GuidedRequestPage} />,
      },
      {
        path: 'notifications',
        element: <LazyPage component={ClientNotificationsPage} />,
      },
      {
        path: 'settings',
        element: <LazyPage component={ClientSettingsPage} />,
      },
      {
        path: 'profile',
        element: <LazyPage component={ProfilePage} />,
      },
      {
        path: 'reference-documents',
        element: <LazyPage component={ReferenceDocumentsPage} />,
      },
    ],
  },

  // Catch all - redirect to login
  {
    path: '*',
    element: <Navigate to="/auth/login" replace />,
  },
]);

export default router;
