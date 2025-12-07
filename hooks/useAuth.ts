/**
 * Hook personnalisé pour gérer l'authentification
 * Utilise React Query pour la gestion du cache et des états
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User, RegisterData, RegisterResponse } from '@/lib/types';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Récupérer l'utilisateur connecté
   */
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = api.getToken();
      if (!token) {
        return null;
      }

      try {
        const userData = await api.getMe();
        return userData;
      } catch (error) {
        // Si le token est invalide ou le backend indisponible, le nettoyer
        api.clearToken();
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Ne pas attendre indéfiniment si le backend est down
    gcTime: 0,
  });

  /**
   * Mutation de connexion
   */
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.login(email, password);
      return response;
    },
    onSuccess: async (response) => {
      try {
        // Récupérer et mettre en cache l'utilisateur
        const user = await api.getMe();
        queryClient.setQueryData(['auth', 'user'], user);

        // Stocker les données utilisateur dans localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        }

        // Rediriger selon le type d'utilisateur
        if (user.userType === 'driver') {
          router.push(ROUTES.DASHBOARD);
        } else {
          router.push(ROUTES.HOME);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        // Si on ne peut pas récupérer le profil, nettoyer le token
        api.clearToken();
        throw error;
      }
    },
    onError: (error) => {
      console.error('❌ Erreur de connexion:', error);
    },
  });

  /**
   * Mutation d'inscription
   */
  const registerMutation = useMutation<RegisterResponse, Error, RegisterData>({
    mutationFn: async (data: RegisterData) => {
      return await api.register(data);
    },
    onSuccess: async (response) => {
      // Le token est déjà stocké dans api.register()
      // Mettre à jour le cache avec l'utilisateur
      queryClient.setQueryData(['auth', 'user'], response.user);

      // Stocker les données utilisateur dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      }

      // La réponse contient le user avec isVerified: false
      // On ne redirige plus automatiquement pour permettre d'afficher le message de succès
    },
  });

  /**
   * Fonction de déconnexion
   */
  const logout = () => {
    api.clearToken();
    queryClient.setQueryData(['auth', 'user'], null);
    queryClient.clear();
    router.push(ROUTES.LOGIN);
  };

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  const isAuthenticated = !!user && !!api.getToken();

  /**
   * Vérifier si l'utilisateur est un chauffeur
   */
  const isDriver = user?.userType === 'driver';

  /**
   * Vérifier si l'utilisateur est un passager
   */
  const isPassenger = user?.userType === 'passenger';

  /**
   * Vérifier si l'utilisateur est un admin
   */
  const isAdmin = user?.userType === 'admin';

  return {
    // État de l'utilisateur
    user,
    isLoadingUser,
    userError,
    isAuthenticated,
    isDriver,
    isPassenger,
    isAdmin,

    // Actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    refetch,

    // États des mutations
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    registerData: registerMutation.data, // Données de la réponse d'inscription
    registerSuccess: registerMutation.isSuccess, // Indicateur de succès
  };
}
