'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRide, useUpdateRideStatus } from '@/hooks/useRides';
import { RIDE_STATUS, VEHICLE_TYPES } from '@/lib/constants';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DriverRidePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const rideId = parseInt(params.id as string);

  const { data: ride, isLoading: rideLoading, refetch } = useRide(rideId);
  const updateStatus = useUpdateRideStatus();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // État local optimiste pour afficher immédiatement le bon bouton
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  // ✅ Réinitialiser l'état optimiste SEULEMENT quand les vraies données correspondent
  useEffect(() => {
    if (optimisticStatus && ride && ride.status === optimisticStatus) {
      setOptimisticStatus(null);
    }
  }, [ride?.status, optimisticStatus]);

  // Note: Polling géré automatiquement par React Query dans useRide
  // avec polling intelligent adapté au statut de la course (optimisation performance)

  // Rediriger si non connecté ou pas un chauffeur
  useEffect(() => {
    if (!isLoadingUser) {
      if (!user) {
        router.push('/login');
      } else if (user.userType?.toLowerCase() !== 'driver') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoadingUser, router]);

  // Rediriger si la course n'appartient pas au chauffeur
  useEffect(() => {
    if (ride && user) {
      // Vérifier si le driver.user de la course correspond à l'utilisateur connecté
      if (typeof ride.driver === 'object' && ride.driver) {
        if (typeof ride.driver.user === 'object' && ride.driver.user) {
          if (ride.driver.user.id !== user.id) {
            toast.error('Cette course ne vous appartient pas');
            router.push('/driver/dashboard');
          }
        }
      }
    }
  }, [ride, user, router]);

  // Mise à jour automatique de la position GPS pendant la course
  useEffect(() => {
    // Mettre à jour la position uniquement si la course est acceptée ou en cours
    if (!ride || (ride.status !== 'accepted' && ride.status !== 'in_progress')) {
      return;
    }


    let watchId: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 10000; // 10 secondes (plus fréquent pendant une course)

    // Fonction pour mettre à jour la position
    const updatePosition = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const now = Date.now();

      // Limiter les mises à jour à une toutes les 10 secondes
      if (now - lastUpdateTime < UPDATE_INTERVAL) {
        return;
      }

      lastUpdateTime = now;

      try {
        await api.updateDriverLocation(latitude, longitude);
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la position:', error);
      }
    };

    // Fonction de gestion d'erreur
    const handleError = (error: GeolocationPositionError) => {
      console.error('❌ Erreur de géolocalisation:', error.message);
    };

    // Démarrer le suivi GPS
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }

    // Nettoyage
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [ride?.id, ride?.status]);

  // Fonction pour mettre à jour le statut de la course
  const handleUpdateStatus = async (newStatus: string) => {
    if (!ride) return;

    const confirmMessages: Record<string, string> = {
      in_progress: 'Le passager est monté ? Démarrer la course ?',
      completed: 'La course est terminée ? Confirmer la fin de la course ?',
    };

    const confirmed = confirm(confirmMessages[newStatus] || 'Confirmer le changement de statut ?');
    if (!confirmed) return;

    // ✅ Mise à jour optimiste : afficher immédiatement le nouveau statut dans l'UI
    setOptimisticStatus(newStatus);
    setIsUpdatingStatus(true);

    updateStatus.mutate(
      { rideId: ride.id, status: newStatus },
      {
        onSuccess: (updatedRide) => {
          // NE PAS réinitialiser l'état optimiste ici !
          // Il sera réinitialisé automatiquement par le useEffect quand ride.status sera à jour

          // Rediriger vers le dashboard si la course est terminée
          if (newStatus === 'completed') {
            setTimeout(() => {
              router.push('/driver/dashboard');
            }, 1500);
          }
        },
        onError: (error) => {
          toast.error(`Impossible de mettre à jour le statut: ${error.message}`);
          // Annuler la mise à jour optimiste en cas d'erreur
          setOptimisticStatus(null);
        },
        onSettled: () => {
          setIsUpdatingStatus(false);
        },
      }
    );
  };

  if (isLoadingUser || rideLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Course introuvable</h1>
          <Button onClick={() => router.push('/driver/dashboard')}>
            Retour au dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const passenger = typeof ride.passenger === 'object' ? ride.passenger as User : null;
  const vehicleConfig = VEHICLE_TYPES[ride.vehicleType];

  // Utiliser le statut optimiste si disponible, sinon le statut réel
  const currentStatus = optimisticStatus || ride.status;
  const statusConfig = RIDE_STATUS[currentStatus];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course #{ride.id}</h1>
          <p className="text-gray-600 mt-1">
            {statusConfig.icon} {statusConfig.label}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/driver/dashboard')}>
          ← Retour
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Détails de la course */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statut et actions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="space-y-3">
              {/* Statut actuel */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Statut actuel</p>
                <p className="text-2xl font-bold">
                  {statusConfig.icon} {statusConfig.label}
                </p>
                <p className="text-sm text-gray-600 mt-1">{statusConfig.description}</p>
              </div>

              {/* Boutons d'action selon le statut */}
              {/* DÉMARRER : Afficher si accepted ET pas optimiste in_progress */}
              {currentStatus === 'accepted' && optimisticStatus !== 'in_progress' && (
                <Button
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={isUpdatingStatus}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isUpdatingStatus ? '⏳ Démarrage...' : '🚗 Démarrer la course'}
                </Button>
              )}

              {/* TERMINER : Afficher si in_progress OU optimiste in_progress */}
              {(currentStatus === 'in_progress' || optimisticStatus === 'in_progress') && (
                <div className="space-y-3">
                  {/* Badge indicateur "Course en cours" */}
                  <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="animate-pulse text-2xl">🚗</span>
                      <div>
                        <p className="font-bold text-green-800">Course en cours</p>
                        <p className="text-sm text-green-700">Le passager est à bord</p>
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour terminer la course */}
                  <Button
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={isUpdatingStatus}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isUpdatingStatus ? '⏳ Finalisation...' : '🏁 Terminer la course'}
                  </Button>
                </div>
              )}

              {currentStatus === 'completed' && (
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                  <p className="text-lg font-semibold text-green-800">
                    ✅ Course terminée
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Merci pour votre service !
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Itinéraire */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📍 Itinéraire</h2>
            <div className="space-y-4">
              {/* Point de départ */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  A
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Point de départ</p>
                  <p className="font-medium">{ride.pickupAddress}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ride.pickupLatitude.toFixed(6)}, {ride.pickupLongitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {/* Ligne de connexion */}
              <div className="ml-4 border-l-2 border-gray-300 h-8"></div>

              {/* Point d'arrivée */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  B
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-medium">{ride.dropoffAddress}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ride.dropoffLatitude.toFixed(6)}, {ride.dropoffLongitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Détails de la course */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📊 Détails de la course</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Distance</p>
                <p className="text-lg font-semibold">
                  📏 {ride.estimatedDistance.toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durée estimée</p>
                <p className="text-lg font-semibold">
                  ⏱️ {ride.estimatedDuration} min
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type de véhicule</p>
                <p className="text-lg font-semibold">
                  {vehicleConfig.icon} {vehicleConfig.label}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prix</p>
                <p className="text-lg font-bold text-green-600">
                  {(ride.finalPrice || ride.estimatedPrice).toFixed(2)} €
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Colonne droite - Informations passager */}
        <div className="space-y-6">
          {/* Informations du passager */}
          {passenger && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">👤 Passager</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {passenger.firstName} {passenger.lastName}
                    </p>
                    {passenger.rating && (
                      <p className="text-sm text-gray-600">
                        ⭐ {passenger.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{passenger.email}</span>
                  </div>
                  {passenger.phone && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Téléphone</span>
                      <span className="font-medium">{passenger.phone}</span>
                    </div>
                  )}
                  {passenger.totalRides && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Courses</span>
                      <span className="font-medium">{passenger.totalRides}</span>
                    </div>
                  )}
                </div>

                {/* Bouton d'appel */}
                {passenger.phone && ride.status !== 'completed' && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => window.open(`tel:${passenger.phone}`)}
                  >
                    📞 Appeler le passager
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card className="p-6 bg-blue-50">
            <h2 className="text-lg font-bold mb-3">💡 Instructions</h2>
            <div className="space-y-2 text-sm">
              {currentStatus === 'accepted' && (
                <>
                  <p>• Rendez-vous au point de départ</p>
                  <p>• Contactez le passager si nécessaire</p>
                  <p>• Cliquez sur "Démarrer la course" quand le passager est monté</p>
                </>
              )}
              {currentStatus === 'in_progress' && (
                <>
                  <p>• Suivez l'itinéraire vers la destination</p>
                  <p>• Conduisez prudemment</p>
                  <p>• Le bouton "Terminer" est disponible à tout moment</p>
                  <p>• Cliquez sur "Terminer la course" quand vous arrivez</p>
                </>
              )}
              {currentStatus === 'completed' && (
                <>
                  <p>• Course terminée avec succès</p>
                  <p>• Le passager va vous noter</p>
                  <p>• Retournez au dashboard pour accepter de nouvelles courses</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
