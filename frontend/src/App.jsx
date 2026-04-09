import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/common/PrivateRoute';
import MojibakeGuard from './components/common/MojibakeGuard';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import LandingPage from './pages/public/LandingPage';
import LibraryPage from './pages/public/LibraryPage';
import PublicLessonPlanPage from './pages/public/PublicLessonPlanPage';
import PublicQuizPage from './pages/public/PublicQuizPage';
import PublicGamePage from './pages/public/PublicGamePage';
import TeacherDashboardPage from './pages/dashboard/TeacherDashboardPage';
import AIChatPage from './pages/dashboard/AIChatPage';
import GroupsPage from './pages/dashboard/GroupsPage';
import GroupDetailPage from './pages/dashboard/GroupDetailPage';
import StatisticsPage from './pages/dashboard/StatisticsPage';
import LessonPlanPage from './pages/dashboard/LessonPlanPage';
import InteractiveGamesPage from './pages/dashboard/InteractiveGamesPage';
import CreateQuizPage from './pages/dashboard/CreateQuizPage';
import QuizResultsPage from './pages/dashboard/QuizResultsPage';
import GameGeneratorPage from './pages/dashboard/GameGeneratorPage';
import GroupSplitterPage from './pages/dashboard/GroupSplitterPage';

const LabPage = lazy(() => import('./pages/dashboard/LabPage'));
const BrainBreakPage = lazy(() => import('./pages/dashboard/BrainBreakPage'));
const LabArenaPage = lazy(() => import('./pages/dashboard/LabArenaPage'));

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
            <MojibakeGuard />
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <Routes>
                <Route
                  path="/brain-break"
                  element={
                    <PrivateRoute roles={['teacher']}>
                      <BrainBreakPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/lab-arena/:mode"
                  element={
                    <PrivateRoute roles={['teacher']}>
                      <LabArenaPage />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/*"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/landing" element={<LandingPage />} />
                          <Route path="/library" element={<LibraryPage />} />
                          <Route path="/library/lesson-plans/:id" element={<PublicLessonPlanPage />} />
                          <Route path="/library/quizzes/:id" element={<PublicQuizPage />} />
                          <Route path="/library/games/:id" element={<PublicGamePage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegisterPage />} />

                          <Route
                            path="/dashboard"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <TeacherDashboardPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/ai-chat"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <AIChatPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/groups"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <GroupsPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/groups/:id"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <GroupDetailPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/statistics"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <StatisticsPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/lesson-plans"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <LessonPlanPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/interactive-games"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <InteractiveGamesPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/interactive-games/create"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <CreateQuizPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/interactive-games/ai-generator"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <GameGeneratorPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/interactive-games/:id/edit"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <CreateQuizPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/interactive-games/:id/results"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <QuizResultsPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/group-splitter"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <GroupSplitterPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/lab"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <LabPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/lab/:subjectKey"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <LabPage />
                              </PrivateRoute>
                            }
                          />
                          <Route
                            path="/profile"
                            element={
                              <PrivateRoute roles={['teacher']}>
                                <TeacherDashboardPage />
                              </PrivateRoute>
                            }
                          />

                          <Route path="/" element={<HomePage />} />
                          <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
