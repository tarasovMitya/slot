import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Calculator } from "./components/Calculator";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/calculator" element={<Calculator />} />

        {/* Customer dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
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

        {/* Performer onboarding */}
        <Route path="/performer/onboarding" element={<PerformerOnboarding />} />

        {/* Performer dashboard */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
