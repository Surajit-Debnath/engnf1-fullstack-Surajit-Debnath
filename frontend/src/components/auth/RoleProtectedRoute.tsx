import { useEffect, useState } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { LoaderCircle, AlertCircle } from 'lucide-react';

import axios from 'axios';

import { api } from '../../services/api';

import type { User, Role } from '../../types/dashboard';

interface RoleProtectedRouteProps {
  allowedRoles: Role[];
}

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User }
  | { status: 'error' };

export default function RoleProtectedRoute({
  allowedRoles,
}: RoleProtectedRouteProps) {
  const [auth, setAuth] = useState<AuthState>({
    status: 'loading',
  });

  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function verifyUser() {
      const token = localStorage.getItem('token');

      if (!token) {
        setAuth({
          status: 'unauthenticated',
        });
        return;
      }

      try {
        const response = await api.get<{
          resp: User[];
        }>('/auth/me', {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const user = response.data.resp?.[0];

        if (!user || !['USER', 'ADMIN'].includes(user.role)) {
          localStorage.removeItem('token');

          setAuth({
            status: 'unauthenticated',
          });

          return;
        }

        setAuth({
          status: 'authenticated',
          user,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        if (
          axios.isAxiosError(error) &&
          [401, 403].includes(error.response?.status ?? 0)
        ) {
          localStorage.removeItem('token');

          setAuth({
            status: 'unauthenticated',
          });
        } else {
          setAuth({
            status: 'error',
          });
        }
      }
    }

    const timer = setTimeout(verifyUser, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [retryKey]);

  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <LoaderCircle size={40} className="animate-spin text-indigo-600" />

        <p className="text-sm text-slate-500">Verifying your session...</p>
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (auth.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle size={40} className="text-red-500" />

        <h2 className="text-xl font-semibold">Unable to verify your session</h2>

        <button
          onClick={() => {
            setAuth({ status: 'loading' });
            setRetryKey((prev) => prev + 1);
          }}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-white"
        >
          Try Again
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('token');

            setAuth({
              status: 'unauthenticated',
            });
          }}
          className="text-sm text-indigo-600"
        >
          Return to Login
        </button>
      </div>
    );
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return (
      <Navigate
        to={auth.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
        replace
      />
    );
  }

  return <Outlet context={{ user: auth.user }} />;
}
