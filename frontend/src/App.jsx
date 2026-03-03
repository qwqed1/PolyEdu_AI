import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import LandingPage from './pages/public/LandingPage';
import JoinGamePage from './pages/public/JoinGamePage';
import PlayGamePage from './pages/public/PlayGamePage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TeacherDashboardPage from './pages/dashboard/TeacherDashboardPage';
import AIChatPage from './pages/dashboard/AIChatPage';
import MaterialsPage from './pages/dashboard/MaterialsPage';
import ExchangePage from './pages/dashboard/ExchangePage';
import SchedulePage from './pages/dashboard/SchedulePage';
import GroupsPage from './pages/dashboard/GroupsPage';
import GroupDetailPage from './pages/dashboard/GroupDetailPage';
import StatisticsPage from './pages/dashboard/StatisticsPage';
import LessonPlanPage from './pages/dashboard/LessonPlanPage';
import InteractiveGamesPage from './pages/dashboard/InteractiveGamesPage';
import CreateQuizPage from './pages/dashboard/CreateQuizPage';
import QuizResultsPage from './pages/dashboard/QuizResultsPage';
import GameGeneratorPage from './pages/dashboard/GameGeneratorPage';
import GroupSplitterPage from './pages/dashboard/GroupSplitterPage';
import StudentGamesPage from './pages/dashboard/StudentGamesPage';
import StudentReflectionsPage from './pages/dashboard/StudentReflectionsPage';
import TeacherLobbyPage from './pages/dashboard/TeacherLobbyPage';

function RoleDashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <TeacherDashboardPage />;
  }

  return <DashboardPage />;
}

function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Игровые страницы (без Header/Footer) */}
            <Route path="/join" element={<JoinGamePage />} />
            <Route path="/play/:code" element={<PlayGamePage />} />

            {/* Остальные страницы с Header/Footer */}
            <Route
              path="/*"
              element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-1">
                    <Routes>
                      {/* Public routes */}
                      <Route path="/landing" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Protected routes */}
                      <Route path="/dashboard" element={<PrivateRoute><RoleDashboardPage /></PrivateRoute>} />
                      <Route path="/ai-chat" element={<PrivateRoute><AIChatPage /></PrivateRoute>} />
                      <Route path="/materials" element={<PrivateRoute roles={['student']}><MaterialsPage /></PrivateRoute>} />
                      <Route path="/exchange" element={<PrivateRoute roles={['student']}><ExchangePage /></PrivateRoute>} />
                      <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />

                      {/* Student routes */}
                      <Route path="/games" element={<PrivateRoute roles={['student']}><StudentGamesPage /></PrivateRoute>} />
                      <Route path="/reflections" element={<PrivateRoute roles={['student']}><StudentReflectionsPage /></PrivateRoute>} />

                      {/* Teacher routes */}
                      <Route path="/groups" element={<PrivateRoute roles={['teacher']}><GroupsPage /></PrivateRoute>} />
                      <Route path="/groups/:id" element={<PrivateRoute roles={['teacher']}><GroupDetailPage /></PrivateRoute>} />
                      <Route path="/statistics" element={<PrivateRoute roles={['teacher']}><StatisticsPage /></PrivateRoute>} />
                      <Route path="/lesson-plans" element={<PrivateRoute roles={['teacher']}><LessonPlanPage /></PrivateRoute>} />
                      <Route path="/interactive-games" element={<PrivateRoute roles={['teacher']}><InteractiveGamesPage /></PrivateRoute>} />
                      <Route path="/interactive-games/create" element={<PrivateRoute roles={['teacher']}><CreateQuizPage /></PrivateRoute>} />
                      <Route path="/interactive-games/ai-generator" element={<PrivateRoute roles={['teacher']}><GameGeneratorPage /></PrivateRoute>} />
                      <Route path="/interactive-games/:id/edit" element={<PrivateRoute roles={['teacher']}><CreateQuizPage /></PrivateRoute>} />
                      <Route path="/interactive-games/:id/results" element={<PrivateRoute roles={['teacher']}><QuizResultsPage /></PrivateRoute>} />
                      <Route path="/interactive-games/:id/lobby" element={<PrivateRoute roles={['teacher']}><TeacherLobbyPage /></PrivateRoute>} />
                      <Route path="/group-splitter" element={<PrivateRoute roles={['teacher']}><GroupSplitterPage /></PrivateRoute>} />

                      <Route path="/profile" element={<PrivateRoute><RoleDashboardPage /></PrivateRoute>} />

                      {/* Default redirect */}
                      <Route path="/" element={<HomePage />} />
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
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

