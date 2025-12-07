'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRides, useAcceptRide } from '@/hooks/useRides';
import { RIDE_STATUS, VEHICLE_TYPES } from '@/lib/constants';
import { Ride } from '@/lib/types';
import { api } from '@/lib/api';

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, isLoadingUser, logout, refetch: refetchUser } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [acceptingRideId, setAcceptingRideId] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'inactive' | 'active' | 'error' | 'not_implemented'>('inactive');

  // Récupérer toutes les courses
  const { data: ridesData, isLoading: ridesLoading, refetch } = useRides();
  const acceptRide = useAcceptRide();

  // Polling pour rafraîchir les courses toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

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
        } else {
          // Endpoint non implémenté dans le backend (404)
          setGpsStatus('not_implemented');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la position:', error);
        setGpsStatus('error');
      }
    };

    // Fonction de gestion d'erreur
    const handleError = (error: GeolocationPositionError) => {
      console.error('❌ Erreur de géolocalisation:', error.message);
      setGpsStatus('error');
      if (error.code === error.PERMISSION_DENIED) {
        alert('Veuillez autoriser la géolocalisation pour que les passagers puissent vous localiser.');
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
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.error('❌ La géolocalisation n\'est pas supportée par ce navigateur');
      setGpsStatus('error');
      alert('Votre navigateur ne supporte pas la géolocalisation');
    }

    // Nettoyage : arrêter le suivi quand le composant est démonté ou quand le driver devient indisponible
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setGpsStatus('inactive');
      }
    };
  }, [isAvailable, user?.driverProfile]);

  // Récupérer toutes les courses
  const allRides = ridesData?.['hydra:member'] || ridesData?.member || [];

  // Filtrer les courses en attente (pending)
  const pendingRides = allRides.filter((ride: Ride) => ride.status === 'pending');

  // Trouver la course active du chauffeur (accepted ou in_progress)
  const activeRide = allRides.find(
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

  // Gérer le toggle de disponibilité
  const handleToggleAvailability = async () => {
    setIsTogglingAvailability(true);
    try {
      const newAvailability = !isAvailable;
      await api.updateDriverAvailability(newAvailability);
      setIsAvailable(newAvailability);

      // Rafraîchir les données utilisateur pour synchroniser user.driverProfile.isAvailable
      await refetchUser();
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la disponibilité:', error);
      alert('Impossible de mettre à jour votre disponibilité');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Accepter une course
  const handleAcceptRide = (rideId: number) => {
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

    // 4. Vérifier que le type de véhicule correspond
    const ride = pendingRides.find((r: Ride) => r.id === rideId);
    if (ride && driverProfile.vehicleType !== ride.vehicleType) {
      alert(`❌ Type de véhicule incompatible\n\nCette course nécessite un véhicule de type "${ride.vehicleType}" mais votre véhicule est de type "${driverProfile.vehicleType}".\n\nVous ne pouvez accepter que des courses correspondant à votre type de véhicule.`);
      return;
    }

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
  };

  if (isLoadingUser || ridesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  // Statistiques du jour (à implémenter avec de vraies données)
  const todayStats = {
    totalRides: allRides.filter((r: Ride) => r.status === 'completed').length,
    earnings: allRides
      .filter((r: Ride) => r.status === 'completed')
      .reduce((sum: number, r: Ride) => sum + (r.finalPrice || r.estimatedPrice), 0),
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
            disabled={isTogglingAvailability}
            variant={isAvailable ? 'default' : 'outline'}
            className={isAvailable ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isTogglingAvailability
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
              <Button variant="outline" size="sm" onClick={() => refetch()}>
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
                  const isVehicleTypeMatch = driverProfile && driverProfile.vehicleType === ride.vehicleType;
                  const canAcceptRide = user?.isVerified && driverProfile?.isAvailable && isVehicleTypeMatch;

                  return (
                    <Card
                      key={ride.id}
                      className={`p-4 border-2 transition ${
                        !isVehicleTypeMatch
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'hover:border-blue-300'
                      }`}
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
                            <span className={!isVehicleTypeMatch ? 'text-orange-600 font-semibold' : ''}>
                              {vehicleConfig.icon} {vehicleConfig.label}
                            </span>
                          </div>
                          {!isVehicleTypeMatch && driverProfile && (
                            <p className="text-xs text-orange-600 font-medium">
                              ⚠️ Type de véhicule incompatible (vous avez: {VEHICLE_TYPES[driverProfile.vehicleType]?.label})
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Prix estimé</p>
                            <p className="text-2xl font-bold text-green-600">
                              {ride.estimatedPrice.toFixed(2)} €
                            </p>
                          </div>
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
                              : !isVehicleTypeMatch
                              ? '❌ Incompatible'
                              : '✅ Accepter'}
                          </Button>
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
                  {todayStats.earnings.toFixed(2)} €
                </p>
              </div>
            </div>
          </Card>

          {/* Infos chauffeur */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">👤 Mon profil</h2>
            <div className="space-y-3">
              <p>
                <span className="text-sm text-gray-600">Nom:</span>{' '}
                <span className="font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </p>
              <p>
                <span className="text-sm text-gray-600">Email:</span>{' '}
                <span className="font-medium">{user?.email}</span>
              </p>
              <p>
                <span className="text-sm text-gray-600">Type:</span>{' '}
                <span className="font-medium">Chauffeur</span>
              </p>

              {/* Statut de vérification */}
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600 mb-1">Statut du compte:</p>
                <div className="flex items-center gap-2">
                  {user?.isVerified ? (
                    <span className="text-sm font-medium text-green-600">✅ Vérifié</span>
                  ) : (
                    <span className="text-sm font-medium text-orange-600">⚠️ Non vérifié</span>
                  )}
                </div>
                {!user?.isVerified && (
                  <p className="text-xs text-gray-500 mt-1">
                    Votre compte doit être vérifié pour accepter des courses
                  </p>
                )}
              </div>

              {/* Infos véhicule */}
              {user?.driverProfile && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-1">Véhicule:</p>
                  <p className="text-sm font-medium">
                    {user.driverProfile.vehicleModel} ({user.driverProfile.vehicleColor})
                  </p>
                  <p className="text-xs text-gray-500">
                    Type: {VEHICLE_TYPES[user.driverProfile.vehicleType]?.label || user.driverProfile.vehicleType}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Aide rapide */}
          <Card className="p-6 bg-gray-50">
            <h2 className="text-lg font-bold mb-3">💡 Conditions pour accepter une course</h2>
            <div className="space-y-2 text-sm">
              <p className={user?.isVerified ? 'text-green-600' : 'text-orange-600'}>
                {user?.isVerified ? '✅' : '❌'} Compte vérifié
              </p>
              <p className={user?.driverProfile?.isAvailable ? 'text-green-600' : 'text-orange-600'}>
                {user?.driverProfile?.isAvailable ? '✅' : '❌'} Disponibilité activée
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
      </div>
    </div>
  );
}
