import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import SmartRoutine from "./pages/SmartRoutine";
import SyllabusTracker from "./pages/SyllabusTracker";
import StudyTimer from "./pages/StudyTimer";
import Notes from "./pages/Notes";
import Exams from "./pages/Exams";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/routine" element={<ProtectedRoute><SmartRoutine /></ProtectedRoute>} />
              <Route path="/syllabus" element={<ProtectedRoute><SyllabusTracker /></ProtectedRoute>} />
              <Route path="/timer" element={<ProtectedRoute><StudyTimer /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
