import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { AuthPage } from './pages/Auth/AuthPage';
import { HomePage } from './pages/Home/HomePage';
import { ProviderSearchPage } from './pages/Providers/ProviderSearchPage';
import { ProviderProfilePage } from './pages/Providers/ProviderProfilePage';
import { ProviderOnboardingPage } from './pages/Providers/ProviderOnboardingPage';
import { PostRequestPage } from './pages/Requests/PostRequestPage';
import { RequestDetailsPage } from './pages/Requests/RequestDetailsPage';
import { OpenRequestsPage } from './pages/Requests/OpenRequestsPage';
import { BookingsPage } from './pages/Bookings/BookingsPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { ReportPage } from './pages/Tickets/ReportPage';
import { SupportPage } from './pages/Tickets/SupportPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

const ProtectedRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-sage-light flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-teal text-white flex items-center justify-center font-black text-xl animate-pulse shadow-md">
          LL
        </div>
        <p className="text-xs font-bold text-navy mt-3 animate-pulse">Loading LocalLink...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="providers" element={<ProviderSearchPage />} />
        <Route path="provider/:id" element={<ProviderProfilePage />} />
        <Route path="provider/onboarding" element={<ProviderOnboardingPage />} />
        <Route path="post-request" element={<PostRequestPage />} />
        <Route path="request/:id" element={<RequestDetailsPage />} />
        <Route path="requests" element={<OpenRequestsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
