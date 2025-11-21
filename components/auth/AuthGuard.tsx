'use client';

/**
 * Composant de protection des routes
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireDriver?: boolean;
  requirePassenger?: boolean;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireDriver = false,
  requirePassenger = false,
}: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoadingUser, isAuthenticated, isDriver, isPassenger } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoadingUser) {
      return;
    }

    // Si l'authentification est requise et que l'utilisateur n'est pas connecté
    if (requireAuth && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Si un rôle de chauffeur est requis
    if (requireDriver && !isDriver) {
      router.push(ROUTES.HOME);
      return;
    }

    // Si un rôle de passager est requis
    if (requirePassenger && !isPassenger) {
      router.push(ROUTES.DASHBOARD);
      return;
    }
  }, [
    isMounted,
    isLoadingUser,
    isAuthenticated,
    isDriver,
    isPassenger,
    requireAuth,
    requireDriver,
    requirePassenger,
    router,
  ]);

  // Afficher un loader pendant le montage ou la vérification
  if (!isMounted || isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si toutes les vérifications passent, afficher le contenu
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireDriver && !isDriver) {
    return null;
  }

  if (requirePassenger && !isPassenger) {
    return null;
  }

  return <>{children}</>;
}
