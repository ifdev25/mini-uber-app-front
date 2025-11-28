/**
 * Hook pour gérer les notations/reviews
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateReviewData, Review, HydraCollection } from '@/lib/types';
import toast from 'react-hot-toast';

/**
 * Hook pour créer une notation
 */
export function useCreateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewData) => {
      console.log('📝 Création d\'une notation:', data);
      return api.createReview(data);
    },
    onSuccess: (review: Review) => {
      console.log('✅ Notation créée avec succès:', review);
      toast.success('Merci pour votre évaluation !');

      // Invalider le cache des ratings
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
    onError: (error: Error) => {
      console.error('❌ Erreur lors de la création de la notation:', error);

      let userMessage = error.message;

      // Messages d'erreur personnalisés
      if (error.message.includes('403')) {
        userMessage = 'Vous n\'êtes pas autorisé à créer cette notation.';
      } else if (error.message.includes('404')) {
        userMessage = 'Course ou utilisateur introuvable.';
      } else if (error.message.includes('400')) {
        userMessage = 'Données invalides. Vérifiez la note (1-5) et les informations.';
      }

      toast.error(userMessage);
    },
  });
}

/**
 * Hook pour récupérer les notations
 */
export function useRatings(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['ratings', filters],
    queryFn: () => api.getReviews(filters),
  });
}

/**
 * Hook pour récupérer les notations d'un utilisateur spécifique
 */
export function useUserRatings(userId: number) {
  return useQuery({
    queryKey: ['ratings', 'user', userId],
    queryFn: () => api.getReviews({ rated: userId }),
    enabled: !!userId,
  });
}
