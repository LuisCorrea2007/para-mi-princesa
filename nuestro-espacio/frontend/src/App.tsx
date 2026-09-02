import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Stores
import { useAuthStore, selectIsAuthenticated, selectIsLoading } from './stores/authStore';

// Páginas (placeholders - se irán implementando)
const LoginPage = () => <div className="p-8"><h1>Login</h1></div>;
const RegisterPage = () => <div className="p-8"><h1>Register</h1></div>;
const DashboardPage = () => <div className="p-8"><h1>Dashboard</h1></div>;
const NotesPage = () => <div className="p-8"><h1>Notes</h1></div>;
const PhotosPage = () => <div className="p-8"><h1>Photos</h1></div>;
const CalendarPage = () => <div className="p-8"><h1>Calendar</h1></div>;
const WishesPage = () => <div className="p-8"><h1>Wishes</h1></div>;
const SettingsPage = () => <div className="p-8"><h1>Settings</h1></div>;

// Componente de carga
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center gradient-primary">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-primary-300 border-t-primary-500 rounded-full mx-auto mb-4"
      />
      <p className="text-neutral-600 dark:text-neutral-400 font-display text-xl">
        Cargando Nuestro Espacio...
      </p>
    </motion.div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore(selectIsLoading);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <NotesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/photos"
          element={
            <ProtectedRoute>
              <PhotosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishes"
          element={
            <ProtectedRoute>
              <WishesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 - Redirigir al dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
