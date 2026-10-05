import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TableDetails from './pages/TableDetails';
import Reports from './pages/Reports';
import Menu from './pages/Menu';
import Layout from './layouts/Layout';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tables" element={<Dashboard />} />
            <Route path="tables/:id" element={<TableDetails />} />
            <Route path="orders" element={<div>Orders Page</div>} />
            <Route path="menu" element={<Menu />} />
            <Route path="payments" element={<div>Payments</div>} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
