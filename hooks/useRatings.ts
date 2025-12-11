/**
 * Hook pour gérer les notations/reviews
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateReviewData, Review } from '@/lib/types';
import { useApiMutation } from './useApiMutation';

/**
 * Hook pour créer une notation
 */
export function useCreateRating() {
  return useApiMutation<Review, CreateReviewData>({
    mutationFn: (data: CreateReviewData) => api.createReview(data),
    successMessage: 'Merci pour votre évaluation !',
    errorContext: 'création de la notation',
    invalidateQueries: [['ratings']],
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
