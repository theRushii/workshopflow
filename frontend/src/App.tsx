import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public pages
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { RequestServicePage } from './pages/RequestServicePage';
import { TrackPage } from './pages/TrackPage';
import { LoginPage } from './pages/LoginPage';

// Admin pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { ServiceRequestsPage } from './pages/admin/ServiceRequestsPage';
import { WorkOrdersPage } from './pages/admin/WorkOrdersPage';
import { TechniciansPage } from './pages/admin/TechniciansPage';
import { ServicesAdminPage } from './pages/admin/ServicesAdminPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { InvoicesPage } from './pages/admin/InvoicesPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { ReportsPage } from './pages/admin/ReportsPage';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="request-service" element={<RequestServicePage />} />
          <Route path="track" element={<TrackPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="service-requests" element={<ServiceRequestsPage />} />
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="technicians" element={<TechniciansPage />} />
          <Route path="services" element={<ServicesAdminPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
