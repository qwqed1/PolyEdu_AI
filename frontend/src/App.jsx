import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import LandingPage from './pages/public/LandingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AIChatPage from './pages/dashboard/AIChatPage';
import MaterialsPage from './pages/dashboard/MaterialsPage';
import ExchangePage from './pages/dashboard/ExchangePage';
import SchedulePage from './pages/dashboard/SchedulePage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Все страницы с Header/Footer */}
            <Route
              path="/*"
              element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-1">
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Protected routes */}
                      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                      <Route path="/ai-chat" element={<PrivateRoute><AIChatPage /></PrivateRoute>} />
                      <Route path="/materials" element={<PrivateRoute><MaterialsPage /></PrivateRoute>} />
                      <Route path="/exchange" element={<PrivateRoute><ExchangePage /></PrivateRoute>} />
                      <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
                      <Route path="/profile" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

                      {/* Default redirect */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

