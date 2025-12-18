'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRides, useAcceptRide, useAvailableRides, useDriverHistory } from '@/hooks/useRides';
import { useDriverAvailability } from '@/hooks/useDriverAvailability';
import { RIDE_STATUS, VEHICLE_TYPES } from '@/lib/constants';
import { Ride } from '@/lib/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, isLoadingUser, logout, refetch: refetchUser } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [acceptingRideId, setAcceptingRideId] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'inactive' | 'active' | 'error' | 'not_implemented'>('inactive');

  // Hooks pour gérer les courses et la disponibilité
  // Nouveau endpoint: récupère TOUTES les courses pending disponibles
  const { data: availableRidesData, isLoading: availableRidesLoading, refetch: refetchAvailable } = useAvailableRides({
    vehicleType: user?.driverProfile?.vehicleType, // Filtrer par type de véhicule
  });
  // Ancien endpoint: récupère les courses du driver (pour trouver la course active)
  const { data: myRidesData, isLoading: myRidesLoading } = useRides();
  // Historique complet du driver (pour les statistiques du jour)
  const { data: historyData, isLoading: historyLoading } = useDriverHistory({
    status: 'completed', // Uniquement les courses terminées
  });
  const acceptRide = useAcceptRide();
  const availabilityMutation = useDriverAvailability();

  // Note: Polling géré automatiquement par React Query dans les hooks
  // Pas besoin de polling manuel ici (optimisation performance)
  // refetchAvailable() est disponible pour le bouton "Actualiser" manuel

  // Rediriger si non connecté ou pas un chauffeur
  useEffect(() => {
    if (!isLoadingUser) {
      if (!user) {
        router.push('/login');
      } else if (user.userType?.toLowerCase() !== 'driver') {
        router.push('/login');
      } else {
        // Vérifier les conditions requises
        if (user.driverProfile) {
        }
      }
    }
  }, [user, isLoadingUser, router]);

  // Synchroniser isAvailable avec le profil driver au chargement
  useEffect(() => {
    if (user?.driverProfile) {
      setIsAvailable(user.driverProfile.isAvailable);
    }
  }, [user?.driverProfile?.isAvailable]);

  // Mise à jour automatique de la position GPS du driver
  useEffect(() => {
    // Ne pas démarrer la géolocalisation si le driver n'est pas disponible
    if (!isAvailable || !user?.driverProfile) {
      setGpsStatus('inactive');
      return;
    }


    let watchId: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 15000; // 15 secondes

    // Fonction pour mettre à jour la position
    const updatePosition = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const now = Date.now();

      // Indiquer que le GPS est actif dès la première position
      setGpsStatus('active');

      // Limiter les mises à jour à une toutes les 15 secondes
      if (now - lastUpdateTime < UPDATE_INTERVAL) {
        return;
      }

      lastUpdateTime = now;

      try {
        const result = await api.updateDriverLocation(latitude, longitude);

        if (result) {
          // Position mise à jour avec succès
        } else {
          // Endpoint non implémenté dans le backend (404) - non bloquant
          setGpsStatus('not_implemented');
        }
      } catch (error) {
        // Erreur silencieuse - la géolocalisation est optionnelle
        setGpsStatus('error');
      }
    };

    // Fonction de gestion d'erreur - Non bloquante
    const handleError = (error: GeolocationPositionError) => {
      // Gérer les différents types d'erreurs de manière non-blocante
      if (error.code === error.PERMISSION_DENIED) {
        // Erreur importante: permission refusée
        setGpsStatus('error');
        toast.error('⚠️ Veuillez autoriser la géolocalisation pour que les passagers puissent vous localiser.', {
          duration: 5000,
        });
      } else if (error.code === error.TIMEOUT) {
        // Timeout: gérer silencieusement sans bloquer l'app
        // Ne pas changer le statut GPS, simplement ignorer ce timeout
        // Le prochain appel pourrait réussir
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        // Position indisponible: gérer silencieusement
        setGpsStatus('error');
      }
    };

    // Vérifier que la géolocalisation est supportée
    if (navigator.geolocation) {
      // Utiliser watchPosition pour un suivi continu
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 30000, // Augmenté à 30s pour éviter les timeouts fréquents
          maximumAge: 5000, // Accepter une position de moins de 5s
        }
      );
    } else {
      // Navigateur non supporté: afficher un message unique
      setGpsStatus('error');
      toast.error('⚠️ Votre navigateur ne supporte pas la géolocalisation', {
        duration: 5000,
      });
    }

    // Nettoyage : arrêter le suivi quand le composant est démonté ou quand le driver devient indisponible
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setGpsStatus('inactive');
      }
    };
  }, [isAvailable, user?.driverProfile]);

  // Courses pending disponibles (nouveau endpoint - déjà filtrées par le backend)
  // Normaliser le format des données car le nouvel endpoint utilise des noms de champs différents
  const pendingRides = (availableRidesData?.data || []).map((ride: any) => ({
    ...ride,
    // Convertir le nouveau format vers l'ancien format pour compatibilité
    pickupAddress: ride.pickup?.address || ride.pickupAddress,
    dropoffAddress: ride.dropoff?.address || ride.dropoffAddress,
    pickupLatitude: ride.pickup?.latitude || ride.pickupLatitude,
    pickupLongitude: ride.pickup?.longitude || ride.pickupLongitude,
    dropoffLatitude: ride.dropoff?.latitude || ride.dropoffLatitude,
    dropoffLongitude: ride.dropoff?.longitude || ride.dropoffLongitude,
    estimatedDistance: ride.distance || ride.estimatedDistance,
    estimatedDuration: ride.duration || ride.estimatedDuration,
    estimatedPrice: ride.price?.estimated || ride.estimatedPrice,
  }));

  // Récupérer les courses du driver pour trouver la course active
  const myRides = myRidesData?.['hydra:member'] || myRidesData?.member || [];

  // Trouver la course active du chauffeur (accepted ou in_progress)
  const activeRide = myRides.find(
    (ride: Ride) => {
      if (ride.status !== 'accepted' && ride.status !== 'in_progress') return false;
      if (typeof ride.driver !== 'object' || !ride.driver) return false;

      // Vérifier si le driver.user.id correspond à l'utilisateur connecté
      if (typeof ride.driver.user === 'object' && ride.driver.user) {
        return ride.driver.user.id === user?.id;
      }

      return false;
    }
  );

  // Toutes les courses (pour les stats)
  const allRides = [...pendingRides, ...myRides];

  // Gérer le toggle de disponibilité (optimisé avec useCallback)
  const handleToggleAvailability = useCallback(async () => {
    if (!user?.driverProfile) {
      toast.error('Profil chauffeur introuvable. Veuillez créer un profil chauffeur.');
      return;
    }

    const newAvailability = !isAvailable;

    try {
      const result = await availabilityMutation.mutateAsync(newAvailability);

      if (result && result.isAvailable !== undefined) {
        setIsAvailable(result.isAvailable);
        // Rafraîchir les données utilisateur pour synchroniser user.driverProfile.isAvailable
        await refetchUser();
      }
    } catch (error) {
      // L'erreur est déjà gérée par useApiMutation avec toast
    }
  }, [user?.driverProfile, isAvailable, availabilityMutation, refetchUser]);

  // Accepter une course (optimisé avec useCallback)
  const handleAcceptRide = useCallback((rideId: number) => {
    // Ne pas permettre d'accepter si une course est déjà en cours d'acceptation
    if (acceptingRideId !== null) {
      alert('⏳ Une course est déjà en cours d\'acceptation, veuillez patienter...');
      return;
    }

    // Ne pas permettre d'accepter si le chauffeur a déjà une course active
    if (activeRide) {
      alert('⚠️ Vous avez déjà une course active. Terminez-la avant d\'en accepter une nouvelle.');
      return;
    }

    // Vérifier les conditions requises par le backend AVANT d'envoyer la requête
    const driverProfile = user?.driverProfile;

    // 1. Vérifier que le driver a un profil
    if (!driverProfile) {
      alert('❌ Erreur: Vous n\'avez pas de profil chauffeur.\n\nVeuillez créer un profil chauffeur pour accepter des courses.');
      return;
    }

    // 2. Vérifier que le driver est vérifié
    if (!user?.isVerified) {
      alert('❌ Compte non vérifié\n\nVotre compte chauffeur doit être vérifié par un administrateur avant de pouvoir accepter des courses.\n\nVeuillez contacter le support.');
      return;
    }

    // 3. Vérifier que le driver est disponible
    if (!driverProfile.isAvailable) {
      alert('❌ Vous n\'êtes pas disponible\n\nActivez votre disponibilité en cliquant sur le bouton "Disponible" pour accepter des courses.');
      return;
    }

    // Note: La vérification du type de véhicule n'est plus nécessaire ici car
    // les courses incompatibles sont déjà filtrées en amont (lignes 139-151)

    const confirmed = confirm('Voulez-vous accepter cette course ?');
    if (confirmed) {
      // Marquer cette course comme étant en cours d'acceptation
      setAcceptingRideId(rideId);

      acceptRide.mutate(rideId, {
        onSuccess: (ride) => {
          setAcceptingRideId(null);
          router.push(`/driver/ride/${ride.id}`);
        },
        onError: (error) => {
          console.error('❌ Erreur lors de l\'acceptation:', error);
          setAcceptingRideId(null);

          // Messages d'erreur plus clairs basés sur l'API documentation
          let errorMessage = error.message;

          if (errorMessage.includes('Only drivers can accept rides')) {
            errorMessage = 'Seuls les chauffeurs peuvent accepter des courses.';
          } else if (errorMessage.includes('Driver profile not found')) {
            errorMessage = 'Profil chauffeur introuvable. Veuillez créer un profil chauffeur.';
          } else if (errorMessage.includes('Driver account not verified')) {
            errorMessage = 'Votre compte chauffeur n\'est pas vérifié. Contactez le support.';
          } else if (errorMessage.includes('Driver is not available')) {
            errorMessage = 'Vous devez être disponible pour accepter des courses. Activez votre disponibilité.';
          } else if (errorMessage.includes('Ride already accepted') || errorMessage.includes('400')) {
            errorMessage = 'Cette course a déjà été acceptée par un autre chauffeur.';
          } else if (errorMessage.includes('Vehicle type mismatch')) {
            errorMessage = 'Le type de véhicule ne correspond pas aux exigences de la course.';
          } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            errorMessage = 'Vous n\'êtes pas autorisé à accepter cette course.';
          } else if (errorMessage.includes('404')) {
            errorMessage = 'Cette course n\'existe plus ou a été annulée.';
          }

          alert(`❌ Impossible d'accepter la course:\n\n${errorMessage}`);
        },
      });
    }
  }, [acceptingRideId, activeRide, user, acceptRide, router]);

  if (isLoadingUser || availableRidesLoading || myRidesLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  // Statistiques du jour
  // Utiliser l'historique du driver (courses completed)
  const completedRides = historyData?.data || [];

  // Pour l'instant, afficher TOUTES les courses terminées (pas seulement aujourd'hui)
  // pour vérifier que les données arrivent correctement
  const todayStats = {
    totalRides: completedRides.length,
    earnings: completedRides.length > 0
      ? completedRides.reduce((sum: number, ride: any) => {
          // Le prix est un objet {estimated: X, final: Y}
          // On utilise le prix final si disponible, sinon l'estimé
          const price = parseFloat(
            ride.price?.final ||
            ride.price?.estimated ||
            ride.finalPrice ||
            ride.estimatedPrice ||
            0
          );
          return sum + (isNaN(price) ? 0 : price);
        }, 0)
      : 0, // Valeur par défaut si aucune course
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Chauffeur</h1>
          <p className="text-gray-600 mt-2">
            Bienvenue {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Toggle disponibilité */}
          <Button
            onClick={handleToggleAvailability}
            disabled={availabilityMutation.isPending}
            variant={isAvailable ? 'default' : 'outline'}
            className={isAvailable ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {availabilityMutation.isPending
              ? '⏳ Mise à jour...'
              : isAvailable
              ? '✅ Disponible'
              : '⭕ Indisponible'}
          </Button>

          {/* Indicateur GPS */}
          {isAvailable && (
            <div
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                gpsStatus === 'active'
                  ? 'bg-green-100 text-green-800'
                  : gpsStatus === 'error'
                  ? 'bg-red-100 text-red-800'
                  : gpsStatus === 'not_implemented'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {gpsStatus === 'active' && (
                <>
                  <span className="animate-pulse">📍</span>
                  <span>GPS actif</span>
                </>
              )}
              {gpsStatus === 'error' && (
                <>
                  <span>❌</span>
                  <span>GPS erreur</span>
                </>
              )}
              {gpsStatus === 'not_implemented' && (
                <>
                  <span>⚠️</span>
                  <span>Backend manquant</span>
                </>
              )}
              {gpsStatus === 'inactive' && (
                <>
                  <span>⏳</span>
                  <span>GPS démarrage...</span>
                </>
              )}
            </div>
          )}

          <Button onClick={() => router.push('/driver/history')} variant="outline">
            📊 Historique
          </Button>

          <Button onClick={logout} variant="outline">
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Bandeau d'alerte si conditions non remplies */}
      {(!user?.isVerified || !isAvailable || !user?.driverProfile) && (
        <Card className="mb-6 p-4 bg-yellow-50 border-yellow-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-800 mb-2">
                Vous ne pouvez pas accepter de courses pour le moment
              </h3>
              <div className="space-y-1 text-sm">
                {!user?.driverProfile && (
                  <p className="text-yellow-700">
                    ❌ <strong>Profil chauffeur manquant</strong> - Créez votre profil chauffeur pour accepter des courses
                  </p>
                )}
                {!user?.isVerified && (
                  <p className="text-yellow-700">
                    ❌ <strong>Compte non vérifié</strong> - Votre compte doit être vérifié par un administrateur. Contactez le support.
                  </p>
                )}
                {user?.driverProfile && user?.isVerified && !isAvailable && (
                  <p className="text-yellow-700">
                    ❌ <strong>Disponibilité désactivée</strong> - Activez votre disponibilité en cliquant sur le bouton "Disponible" ci-dessus
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course active */}
          {activeRide && (
            <Card className="p-6 bg-blue-50 border-blue-300">
              <h2 className="text-xl font-bold mb-4">🚗 Course active</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <p className="font-semibold">
                    {RIDE_STATUS[activeRide.status].icon} {RIDE_STATUS[activeRide.status].label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Départ</p>
                  <p className="font-medium">📍 {activeRide.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Arrivée</p>
                  <p className="font-medium">📍 {activeRide.dropoffAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prix</p>
                  <p className="text-lg font-bold text-blue-600">
                    {activeRide.estimatedPrice.toFixed(2)} €
                  </p>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => router.push(`/driver/ride/${activeRide.id}`)}
                >
                  Gérer la course
                </Button>
              </div>
            </Card>
          )}

          {/* Courses en attente */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                ⏳ Courses en attente ({pendingRides.length})
              </h2>
              <Button variant="outline" size="sm" onClick={() => refetchAvailable()}>
                🔄 Actualiser
              </Button>
            </div>

            {pendingRides.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">😴 Aucune course en attente</p>
                <p className="text-sm mt-2">
                  Les nouvelles courses apparaîtront ici automatiquement
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRides.map((ride: Ride) => {
                  const vehicleConfig = VEHICLE_TYPES[ride.vehicleType];
                  const driverProfile = user?.driverProfile;
                  // Toutes les courses affichées sont déjà compatibles (filtrées en amont)
                  // FIX: Utiliser l'état local `isAvailable` au lieu de driverProfile?.isAvailable
                  // car l'état local est toujours à jour après le toggle, tandis que driverProfile dépend du refetch
                  const canAcceptRide = user?.isVerified && isAvailable && driverProfile;

                  return (
                    <Card
                      key={ride.id}
                      className="p-4 border-2 transition hover:border-blue-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Départ</p>
                            <p className="font-medium text-sm">📍 {ride.pickupAddress}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Arrivée</p>
                            <p className="font-medium text-sm">📍 {ride.dropoffAddress}</p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span>
                              📏 {ride.estimatedDistance.toFixed(1)} km
                            </span>
                            <span>
                              ⏱️ {ride.estimatedDuration} min
                            </span>
                            <span>
                              {vehicleConfig.icon} {vehicleConfig.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Prix estimé</p>
                            <p className="text-2xl font-bold text-green-600">
                              {ride.estimatedPrice.toFixed(2)} €
                            </p>
                          </div>
                          <div>
                            <Button
                              className="w-full mt-2"
                              onClick={() => handleAcceptRide(ride.id)}
                              disabled={acceptingRideId !== null || !!activeRide || !canAcceptRide}
                              variant={!canAcceptRide ? 'outline' : 'default'}
                            >
                              {acceptingRideId === ride.id
                                ? '⏳ Acceptation...'
                                : acceptingRideId !== null
                                ? '⏳ En cours...'
                                : !user?.isVerified
                                ? '❌ Non vérifié'
                                : !isAvailable
                                ? '❌ Indisponible'
                                : '✅ Accepter'}
                            </Button>
                            {!canAcceptRide && !acceptingRideId && !activeRide && (
                              <p className="text-xs text-red-600 mt-1 text-center">
                                {!user?.isVerified
                                  ? 'Compte non vérifié'
                                  : !isAvailable
                                  ? 'Activez votre disponibilité'
                                  : !driverProfile
                                  ? 'Créez votre profil'
                                  : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Colonne droite - Statistiques */}
        <div className="space-y-6">
          {/* Grille pour Aujourd'hui et Conditions */}
          <div className="grid grid-cols-2 gap-6">
            {/* Statistiques du jour */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">📊 Aujourd'hui</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Courses terminées</p>
                  <p className="text-3xl font-bold">{todayStats.totalRides}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gains</p>
                  <p className="text-3xl font-bold text-green-600">
                    {(todayStats.earnings || 0).toFixed(2)} €
                  </p>
                </div>
              </div>
            </Card>

            {/* Aide rapide */}
            <Card className="p-6 bg-gray-50">
              <h2 className="text-lg font-bold mb-3">💡 Conditions pour accepter une course</h2>
              <div className="space-y-2 text-sm">
                <p className={user?.isVerified ? 'text-green-600' : 'text-orange-600'}>
                  {user?.isVerified ? '✅' : '❌'} Compte vérifié
                </p>
                <p className={isAvailable ? 'text-green-600' : 'text-orange-600'}>
                  {isAvailable ? '✅' : '❌'} Disponibilité activée
                </p>
                <p className={user?.driverProfile ? 'text-green-600' : 'text-orange-600'}>
                  {user?.driverProfile ? '✅' : '❌'} Profil chauffeur créé
                </p>
                <p className="text-gray-600">
                  ℹ️ Type de véhicule correspondant requis
                </p>
                <p className="text-gray-600">
                  ℹ️ Une seule course active à la fois
                </p>
              </div>
            </Card>
          </div>

          {/* Infos chauffeur */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Informations du compte</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Téléphone</span>
                <span className="font-medium">{user?.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Type de compte</span>
                <span className="font-medium capitalize">{user?.userType || 'Non défini'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Note</span>
                <span className="font-medium">{user?.rating ? `${user.rating} / 5` : 'Non noté'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Statut</span>
                <span className={`font-medium ${user?.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {user?.isVerified ? '✅ Vérifié' : '⚠️ Non vérifié'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Membre depuis</span>
                <span className="font-medium">
                  {(user?.createdAt || user?.created_at) ? new Date(user.createdAt || user.created_at!).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Non disponible'}
                </span>
              </div>

              {/* Infos véhicule */}
              {user?.driverProfile && (
                <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Véhicule</span>
                    <span className="font-medium">
                      {user.driverProfile.vehicleModel}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Couleur</span>
                    <span className="font-medium">{user.driverProfile.vehicleColor}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Type de véhicule</span>
                    <span className="font-medium">
                      {VEHICLE_TYPES[user.driverProfile.vehicleType]?.label || user.driverProfile.vehicleType}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
