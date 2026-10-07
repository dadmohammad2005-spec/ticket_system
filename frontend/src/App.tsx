import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { TripDetailsPage } from './pages/TripDetailsPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SupportPage } from './pages/SupportPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TicketVerifyPage } from './pages/TicketVerifyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith('/admin-portal');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {!isAdminPortal && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/trips/:id" element={<TripDetailsPage />} />
          <Route path="/booking/:reference/confirmation" element={<BookingConfirmationPage />} />
          <Route path="/ticket/:reference?" element={<BookingConfirmationPage />} />
          <Route path="/ticket" element={<BookingConfirmationPage />} />
          <Route path="/print-ticket/:reference?" element={<BookingConfirmationPage />} />
          <Route path="/print-ticket" element={<BookingConfirmationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/verify/:ticketCode" element={<TicketVerifyPage />} />
          <Route path="/admin-portal" element={<AdminDashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      {!isAdminPortal && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
