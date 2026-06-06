import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Calculator } from "./components/Calculator";
import { LandingPage } from "./pages/LandingPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { StaffAuthPage } from "./pages/StaffAuthPage";
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
import { OnboardingGuidePage } from "./performer/pages/OnboardingGuidePage";
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
import { SecurityPage } from "./dashboard/pages/SecurityPage";
import { ClientDisputesPage } from "./dashboard/pages/ClientDisputesPage";
import { AdminEventLogsPage } from "./admin/pages/EventLogsPage";
import { AdminAffiliateTasksPage } from "./admin/pages/AffiliateTasksPage";
import { AdminChatsPage } from "./admin/pages/ChatsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { usePageTracking } from "./hooks/usePageTracking";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { NotificationToast } from "./components/ui/NotificationToast";
import { NotFoundPage } from "./pages/NotFoundPage";
import { initAnalytics } from "./hooks/useAnalytics";
import { ServicePage } from "./pages/services/ServicePage";
import { MoscowPage } from "./pages/geo/MoscowPage";
import { MoscowSlugRouter } from "./pages/geo/MoscowSlugRouter";
import { DistrictServicePage } from "./pages/geo/DistrictServicePage";
import { BlogPage } from "./pages/blog/BlogPage";
import { ArticlePage } from "./pages/blog/ArticlePage";
import { MastersHubPage } from "./pages/masters/MastersHubPage";
import { MasterServicePage } from "./pages/masters/MasterServicePage";
import { TermsPage } from "./pages/legal/TermsPage";
import { PrivacyPage } from "./pages/legal/PrivacyPage";
import { ContactsPage } from "./pages/legal/ContactsPage";
import { RulesPage } from "./pages/legal/RulesPage";
import { FinancialModelPage } from "./pages/internal/FinancialModelPage";
import { AffiliateGuard } from "./affiliate/components/AffiliateGuard";
import { AffiliateLayout } from "./affiliate/components/layout/AffiliateLayout";
import { AffiliateOverviewPage } from "./affiliate/pages/OverviewPage";
import { AffiliatePerformersPage } from "./affiliate/pages/PerformersPage";
import { AffiliateOrdersPage } from "./affiliate/pages/OrdersPage";
import { AffiliateDisputesPage } from "./affiliate/pages/DisputesPage";
import { AffiliateChatsPage } from "./affiliate/pages/ChatsPage";
import { AffiliateFinancePage } from "./affiliate/pages/FinancePage";
import { AffiliateTasksPage } from "./affiliate/pages/TasksPage";
import { AffiliateReferralPage } from "./affiliate/pages/ReferralPage";
import { AffiliateSettingsPage } from "./affiliate/pages/SettingsPage";
import { TMAApp } from "./pages/tma/TMAApp";
import { PricePage } from "./pages/price/PricePage";

function PageTracker() {
  usePageTracking();
  return null;
}

function PushSetup() {
  const { user } = useAuthStore();
  const { askOnce } = usePushNotifications();
  useEffect(() => {
    if (user) askOnce();
  }, [user?.id]);
  return null;
}

function App() {
  const { initialize } = useAuthStore();
  const loadSettings = usePlatformSettingsStore((s) => s.load);

  useEffect(() => {
    initialize();
    loadSettings();
    initAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PageTracker />
        <PushSetup />
        <NotificationToast />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/app" element={<TMAApp />} />

        {/* Service pages */}
        <Route path="/services/:slug" element={<ServicePage />} />

        {/* Price pages — Стоимость [услуга] в Москве */}
        <Route path="/price/:slug" element={<PricePage />} />

        {/* Geo pages — Moscow */}
        <Route path="/moscow" element={<MoscowPage />} />
        <Route path="/moscow/:district/:service" element={<DistrictServicePage />} />
        <Route path="/moscow/:slug" element={<MoscowSlugRouter />} />

        {/* Blog */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<ArticlePage />} />

        {/* Performer SEO */}
        <Route path="/masters" element={<MastersHubPage />} />
        <Route path="/masters/:service" element={<MasterServicePage />} />

        {/* Legal */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/rules" element={<RulesPage />} />

        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/staff" element={<StaffAuthPage />} />
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
          <Route path="security" element={<SecurityPage />} />
          <Route path="disputes" element={<ClientDisputesPage />} />
        </Route>

        {/* Performer auth */}
        <Route path="/performer/auth" element={<PerformerAuthPage />} />

        {/* Redirect legacy /performer/dashboard → /performer */}
        <Route path="/performer/dashboard" element={<Navigate to="/performer" replace />} />

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
            <Route path="guide" element={<OnboardingGuidePage />} />
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
            <Route path="financial-model" element={<FinancialModelPage />} />
            <Route path="affiliate-tasks" element={<AdminAffiliateTasksPage />} />
          </Route>
        </Route>

        {/* Affiliate manager cabinet */}
        <Route element={<AffiliateGuard />}>
          <Route path="/affiliate" element={<AffiliateLayout />}>
            <Route index element={<AffiliateOverviewPage />} />
            <Route path="performers" element={<AffiliatePerformersPage />} />
            <Route path="orders" element={<AffiliateOrdersPage />} />
            <Route path="disputes" element={<AffiliateDisputesPage />} />
            <Route path="chats" element={<AffiliateChatsPage />} />
            <Route path="finance" element={<AffiliateFinancePage />} />
            <Route path="tasks" element={<AffiliateTasksPage />} />
            <Route path="referral" element={<AffiliateReferralPage />} />
            <Route path="settings" element={<AffiliateSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
