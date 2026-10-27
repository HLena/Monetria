import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/app/store';

export function ProtectedRoute() {
  const { accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}
