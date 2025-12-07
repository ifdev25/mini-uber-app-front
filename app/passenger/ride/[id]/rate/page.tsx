'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRide } from '@/hooks/useRides';
import { api } from '@/lib/api';
import { Driver, User } from '@/lib/types';
import toast from 'react-hot-toast';

export default function RateDriverPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoadingUser: userLoading } = useAuth();
  const rideId = parseInt(params.id as string);
  const { data: ride, isLoading: rideLoading } = useRide(rideId);

  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rediriger si non connecté
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Rediriger si la course n'est pas terminée
  useEffect(() => {
    if (ride && ride.status !== 'completed') {
      router.push(`/passenger/ride/${ride.id}`);
    }
  }, [ride, router]);

  // Soumettre la notation
  const handleSubmit = async () => {
    if (!ride || !user) return;

    // Extraction intelligente du driver (peut être User direct ou Driver avec user)
    const driver = ride.driver && typeof ride.driver === 'object' ? ride.driver as any : null;
    const driverUser: User | null = driver
      ? (driver.user && typeof driver.user === 'object'
          ? driver.user as User
          : driver as User) // driver EST l'user
      : null;

    if (!driver || !driverUser) {
      toast.error('Erreur: Impossible de trouver les informations du chauffeur');
      return;
    }

    setIsSubmitting(true);

    const loadingToastId = toast.loading('Envoi de votre évaluation...');

    try {
      // Appeler l'API pour enregistrer la notation
      const reviewData = {
        ride: `/api/rides/${ride.id}`,
        rater: `/api/users/${user.id}`, // Le passager qui note
        rated: `/api/users/${driverUser.id}`, // Le chauffeur noté
        score: rating,
        comment: comment.trim() || undefined,
      };

      const review = await api.createReview(reviewData);

      toast.success('Merci pour votre évaluation !', { id: loadingToastId });

      // Attendre 1 seconde avant de rediriger pour que l'utilisateur voie le message
      setTimeout(() => {
        router.push('/passenger/history');
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      toast.error(`Erreur lors de l'envoi: ${errorMessage}`, { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // État de chargement
  if (userLoading || rideLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Course introuvable</h1>
          <Button onClick={() => router.push('/passenger/history')}>
            Retour à l'historique
          </Button>
        </Card>
      </div>
    );
  }

  // ========== Extraction intelligente du driver ==========
  // Le backend peut renvoyer 2 formats :
  // 1. driver est un User direct (format actuel)
  // 2. driver est un Driver avec user imbriqué (format documenté)

  const driver = ride.driver && typeof ride.driver === 'object' ? ride.driver as any : null;

  // Si driver a une propriété 'user', c'est un Driver complet
  // Sinon, c'est un User direct
  const driverUser: User | null = driver
    ? (driver.user && typeof driver.user === 'object'
        ? driver.user as User
        : driver as User) // driver EST l'user
    : null;

  if (!driver || !driverUser) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Chauffeur introuvable</h1>
          <p className="text-gray-600 mb-4">
            Impossible de charger les informations du chauffeur pour cette course.
          </p>

          {/* Debug info pour aider au diagnostic */}
          <div className="bg-gray-100 p-4 rounded mb-4 text-xs font-mono">
            <p className="font-bold mb-2">🔍 Debug Info:</p>
            <p>• Status de la course: {ride.status}</p>
            <p>• ride.driver est null: {ride.driver === null ? 'OUI' : 'NON'}</p>
            <p>• ride.driver est objet: {ride.driver && typeof ride.driver === 'object' ? 'OUI' : 'NON'}</p>
            {driver && (
              <>
                <p>• driver.id: {driver.id}</p>
                <p>• driver.user existe: {driver.user ? 'OUI' : 'NON'}</p>
                <p>• driver.user type: {typeof driver.user}</p>
              </>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600">Voir données brutes</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(ride.driver, null, 2)}
              </pre>
            </details>
          </div>

          <Button onClick={() => router.push('/passenger/history')}>
            Retour à l'historique
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={() => router.push('/passenger/history')}
        className="mb-4"
      >
        ← Retour à l'historique
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">Noter le chauffeur</h1>
        <p className="text-gray-600 mb-6">
          Comment s'est passée votre course avec {driverUser.firstName} ?
        </p>

        {/* Informations du chauffeur */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <p className="font-semibold text-lg">
                {driverUser.firstName} {driverUser.lastName}
              </p>
              {driver.vehicleModel && (
                <p className="text-sm text-gray-600">
                  {driver.vehicleModel}
                  {driver.licenceNumber && ` - ${driver.licenceNumber}`}
                </p>
              )}
              {driverUser.rating && (
                <p className="text-sm text-gray-600">
                  ⭐ {driverUser.rating.toFixed(1)}
                  {driver.totalRides && ` (${driver.totalRides} courses)`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Détails de la course */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Détails de la course</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600">📍</span>
              <div>
                <p className="text-gray-500">Départ</p>
                <p className="font-medium">{ride.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600">📍</span>
              <div>
                <p className="text-gray-500">Arrivée</p>
                <p className="font-medium">{ride.dropoffAddress}</p>
              </div>
            </div>
            <div className="pt-2 border-t mt-2">
              <span className="text-gray-500">Prix: </span>
              <span className="font-bold text-blue-600">
                {ride.finalPrice?.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        {/* Sélection de la note */}
        <div className="mb-6">
          <label className="block font-semibold mb-3">
            Votre note
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <span
                  className={`text-5xl ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ⭐
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-2">
            {rating === 1 && 'Très mauvais'}
            {rating === 2 && 'Mauvais'}
            {rating === 3 && 'Moyen'}
            {rating === 4 && 'Bon'}
            {rating === 5 && 'Excellent'}
          </p>
        </div>

        {/* Commentaire optionnel */}
        <div className="mb-6">
          <label htmlFor="comment" className="block font-semibold mb-2">
            Commentaire (optionnel)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience avec ce chauffeur..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma note'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/passenger/history')}
            disabled={isSubmitting}
          >
            Passer
          </Button>
        </div>
      </Card>
    </div>
  );
}
