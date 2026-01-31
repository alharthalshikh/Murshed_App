import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";

// Lazy Load Pages
const Home = lazy(() => import("./pages/Home"));
const Reports = lazy(() => import("./pages/Reports"));
const NewReport = lazy(() => import("./pages/NewReport"));
const ReportDetails = lazy(() => import("./pages/ReportDetails"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const MyReports = lazy(() => import("./pages/MyReports"));
const EditReport = lazy(() => import("./pages/EditReport"));
const Achievements = lazy(() => import("./pages/Achievements"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminMatches = lazy(() => import("./pages/admin/AdminMatches"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminContactPage = lazy(() => import("./pages/admin/AdminContactPage"));
const MatchDebugger = lazy(() => import("./pages/admin/MatchDebugger"));

// Moderator Pages
const ModeratorDashboard = lazy(() => import("./pages/moderator/ModeratorDashboard"));
const ModeratorReports = lazy(() => import("./pages/moderator/ModeratorReports"));
const ModeratorMatches = lazy(() => import("./pages/moderator/ModeratorMatches"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data is always fresh (unless manually invalidated)
      gcTime: 1000 * 60 * 60 * 24, // 24 hours: Keep in cache for 24 hours
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
              <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <Routes>
                  {/* Public & Main App Routes wrapped in MainLayout for transitions/persistent navbar */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected User Routes */}
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    } />
                    <Route path="/reports/:id" element={
                      <ProtectedRoute>
                        <ReportDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/new-report" element={
                      <ProtectedRoute>
                        <NewReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/reports/:id/edit" element={
                      <ProtectedRoute>
                        <EditReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-reports" element={
                      <ProtectedRoute>
                        <MyReports />
                      </ProtectedRoute>
                    } />
                  </Route>

                  {/* Profile Route - Separate Layout (Hidden Bottom Bar) */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes - Separate Layout */}
                  <Route path="/admin" element={<ProtectedRoute requireAdmin />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="matches" element={<AdminMatches />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="contact" element={<AdminContactPage />} />
                    <Route path="debug" element={<MatchDebugger />} />
                    <Route path="achievements" element={<Achievements />} />
                  </Route>

                  {/* Moderator Routes - Separate Layout */}
                  <Route path="/moderator" element={<ProtectedRoute requireModerator />}>
                    <Route index element={<ModeratorDashboard />} />
                    <Route path="reports" element={<ModeratorReports />} />
                    <Route path="matches" element={<ModeratorMatches />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <InstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
