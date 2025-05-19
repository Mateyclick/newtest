import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import History from "./pages/History";
import Calendar from "./pages/Calendar";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Results from "./pages/Results";
import Courses from "./pages/Courses";
import Store from "./pages/Store";
import NotFound from "@/pages/NotFound";
import InfoSocios from "@/pages/InfoSocios";
import AdminPage from "@/pages/AdminPage";
import Profile from "./pages/Profile";
import GamePage from "./pages/GamePage";
import ProtectedRoute from "./components/ProtectedRoute";


import { historyMilestones } from "@/lib/data/data-historia";
import { pastTournaments } from "@/lib/data/data-resultados";
import { courses } from "@/lib/data/data-cursos";

// Create QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

import { GameSocketProvider } from '@/contexts/GameSocketContext';

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GameSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/historia" element={<History milestones={historyMilestones} />} />
              <Route path="/calendario" element={<Calendar />} />
              <Route path="/resultados" element={<Results tournaments={pastTournaments} />} />
              <Route path="/cursos" element={<Courses courses={courses} />} />
              <Route path="/tienda" element={<Store />} />
              <Route path="/registrarse" element={<SignUp />} />
              <Route path="/iniciar-sesion" element={<SignIn />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/juego" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
              <Route path="/info-socios" element={<InfoSocios />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />

            </Routes>
          </TooltipProvider>
        </GameSocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;