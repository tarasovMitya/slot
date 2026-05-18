import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Calculator } from "./components/Calculator";
import { LandingPage } from "./pages/LandingPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { useAuthStore } from "./store/authStore";
import { usePlatformSettingsStore } from "./store/platformSettingsStore";
import { DashboardLayout } from "./dashboard/components/layout/DashboardLayout";
import { DashboardPage } from "./dashboard/pages/DashboardPage";
import { ActiveOrdersPage } from "./dashboard/pages/ActiveOrdersPage";
import { OrderDetailsPage } from "./dashboard/pages/OrderDetailsPage";
import { OrderHistoryPage } from "./dashboard/pages/OrderHistoryPage";
import { SavedAddressesPage } from "./dashboard/pages/SavedAddressesPage";
import { PaymentMethodsPage } from "./dashboard/pages/PaymentMethodsPage";
import { ProfileSettingsPage } from "./dashboard/pages/ProfileSettingsPage";
import { SupportPage } from "./dashboard/pages/SupportPage";
import { NotificationsPage } from "./dashboard/pages/NotificationsPage";
import { PerformerLayout } from "./performer/components/layout/PerformerLayout";
import { PerformerDashboard } from "./performer/pages/PerformerDashboard";
import { AvailableOrdersPage } from "./performer/pages/AvailableOrdersPage";
import { PerformerActiveOrdersPage } from "./performer/pages/ActiveOrdersPage";
import { PerformerOrderDetailsPage } from "./performer/pages/OrderDetailsPage";
import { EarningsPage } from "./performer/pages/EarningsPage";
import { SchedulePage } from "./performer/pages/SchedulePage";
import { PerformerProfilePage } from "./performer/pages/ProfilePage";
import { PerformerNotificationsPage } from "./performer/pages/NotificationsPage";
import { PerformerOnboarding } from "./performer/onboarding/PerformerOnboarding";
import { PerformerAuthPage } from "./performer/pages/PerformerAuthPage";
import { PerformerVerificationPage } from "./performer/pages/VerificationPage";
import { PerformerGuard } from "./performer/components/PerformerGuard";
import { AdminGuard } from "./admin/components/AdminGuard";
import { AdminLayout } from "./admin/components/layout/AdminLayout";
import { AdminOverviewPage } from "./admin/pages/OverviewPage";
import { AdminOrdersPage } from "./admin/pages/OrdersPage";
import { AdminPerformersPage } from "./admin/pages/PerformersPage";
import { AdminFinancePage } from "./admin/pages/FinancePage";
import { AdminDisputesPage } from "./admin/pages/DisputesPage";
import { AdminVerificationPage } from "./admin/pages/VerificationPage";
import { AdminAnalyticsPage } from "./admin/pages/AnalyticsPage";
import { AdminSettingsPage } from "./admin/pages/SettingsPage";
import { AdminClientsPage } from "./admin/pages/ClientsPage";
import { AdminEventLogsPage } from "./admin/pages/EventLogsPage";
import { AdminChatsPage } from "./admin/pages/ChatsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { usePageTracking } from "./hooks/usePageTracking";

function PageTracker() {
  usePageTracking();
  return null;
}

function App() {
  const { initialize } = useAuthStore();
  const loadSettings = usePlatformSettingsStore((s) => s.load);

  useEffect(() => {
    initialize();
    loadSettings();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PageTracker />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/calculator" element={<Calculator />} />

        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Customer dashboard — protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<ActiveOrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailsPage />} />
          <Route path="history" element={<OrderHistoryPage />} />
          <Route path="addresses" element={<SavedAddressesPage />} />
          <Route path="payments" element={<PaymentMethodsPage />} />
          <Route path="profile" element={<ProfileSettingsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Performer auth */}
        <Route path="/performer/auth" element={<PerformerAuthPage />} />

        {/* Performer verification — requires auth + performer role but NOT verified */}
        <Route element={<PerformerGuard />}>
          <Route path="/performer/verification" element={<PerformerVerificationPage />} />
        </Route>

        {/* Performer onboarding — public, auth happens at the end */}
        <Route path="/performer/onboarding" element={<PerformerOnboarding />} />

        {/* Performer dashboard — requires auth + performer role + onboarded */}
        <Route element={<PerformerGuard />}>
          <Route path="/performer" element={<PerformerLayout />}>
            <Route index element={<PerformerDashboard />} />
            <Route path="available" element={<AvailableOrdersPage />} />
            <Route path="active" element={<PerformerActiveOrdersPage />} />
            <Route path="orders/:id" element={<PerformerOrderDetailsPage />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="profile" element={<PerformerProfilePage />} />
            <Route path="notifications" element={<PerformerNotificationsPage />} />
          </Route>
        </Route>
        {/* Admin panel — requires admin role */}
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="performers" element={<AdminPerformersPage />} />
            <Route path="finance" element={<AdminFinancePage />} />
            <Route path="disputes" element={<AdminDisputesPage />} />
            <Route path="verification" element={<AdminVerificationPage />} />
            <Route path="chats" element={<AdminChatsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="events" element={<AdminEventLogsPage />} />
          </Route>
        </Route>
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
