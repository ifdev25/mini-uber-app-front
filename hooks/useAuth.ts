/**
 * Hook personnalisé pour gérer l'authentification
 * Utilise React Query pour la gestion du cache et des états
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api, ValidationError } from '@/lib/api';
import { User, RegisterData, RegisterResponse } from '@/lib/types';
import { ROUTES, STORAGE_KEYS } from '@/lib/constants';
import { formatValidationErrors, getContextError } from '@/lib/errorMessages';

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
        // Si on ne peut pas récupérer le profil, nettoyer le token
        api.clearToken();
        throw error;
      }
    },
    onError: (error) => {
      // Gérer les erreurs de validation avec un toast formaté
      if (error instanceof ValidationError) {
        const formattedMessage = formatValidationErrors(error.violations);

        toast.error(formattedMessage, {
          duration: 6000,
          style: {
            whiteSpace: 'pre-line',
            maxWidth: '500px',
          },
        });
      } else {
        // Afficher un toast pour les autres erreurs
        let message = error.message || 'Une erreur est survenue';

        // Messages plus clairs pour les erreurs courantes
        if (message.includes('401') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('credentials')) {
          message = getContextError('auth', 'invalidCredentials');
        } else if (message.toLowerCase().includes('access denied') || message.toLowerCase().includes('vérifier votre email')) {
          message = getContextError('auth', 'accountNotVerified');
        } else if (message.toLowerCase().includes('connexion') || message.toLowerCase().includes('serveur')) {
          message = getContextError('network', 'serverUnreachable');
        } else if (message.includes('500')) {
          message = getContextError('server', 'internalError');
        }

        toast.error(message);
      }
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

      // Afficher un toast de succès
      toast.success('Inscription réussie ! Vérifiez votre email pour activer votre compte.');

      // La réponse contient le user avec isVerified: false
      // On ne redirige plus automatiquement pour permettre d'afficher le message de succès
    },
    onError: (error) => {
      // Gérer les erreurs de validation avec un toast formaté
      if (error instanceof ValidationError) {
        const formattedMessage = formatValidationErrors(error.violations);

        toast.error(formattedMessage, {
          duration: 6000,
          style: {
            whiteSpace: 'pre-line',
            maxWidth: '500px',
          },
        });
      } else {
        // Afficher un toast pour les autres erreurs
        let message = error.message || 'Une erreur est survenue';

        // Messages plus clairs pour les erreurs courantes
        if (message.toLowerCase().includes('existe déjà') || message.toLowerCase().includes('already exists')) {
          message = 'Un compte avec cet email existe déjà. Essayez de vous connecter.';
        } else if (message.toLowerCase().includes('connexion')) {
          message = getContextError('network', 'serverUnreachable');
        } else if (message.includes('500')) {
          message = getContextError('server', 'internalError');
        }

        toast.error(message);
      }
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
