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
  const { user, isLoadingUser, logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

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
      }
    }
  }, [user, isLoadingUser, router]);

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
      console.log(`✅ Disponibilité mise à jour: ${newAvailability ? 'Disponible' : 'Indisponible'}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la disponibilité:', error);
      alert('Impossible de mettre à jour votre disponibilité');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Accepter une course
  const handleAcceptRide = (rideId: number) => {
    const confirmed = confirm('Voulez-vous accepter cette course ?');
    if (confirmed) {
      acceptRide.mutate(rideId, {
        onSuccess: (ride) => {
          console.log('✅ Course acceptée:', ride);
          router.push(`/driver/ride/${ride.id}`);
        },
        onError: (error) => {
          console.error('❌ Erreur:', error);
          alert(`Impossible d'accepter la course: ${error.message}`);
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
                  return (
                    <Card key={ride.id} className="p-4 border-2 hover:border-blue-300 transition">
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
                          <Button
                            className="w-full mt-2"
                            onClick={() => handleAcceptRide(ride.id)}
                            disabled={acceptRide.isPending || !!activeRide}
                          >
                            {acceptRide.isPending ? '⏳ Acceptation...' : '✅ Accepter'}
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
            <div className="space-y-2">
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
            </div>
          </Card>

          {/* Aide rapide */}
          <Card className="p-6 bg-gray-50">
            <h2 className="text-lg font-bold mb-3">💡 Aide rapide</h2>
            <div className="space-y-2 text-sm">
              <p>• Activez votre disponibilité pour recevoir des courses</p>
              <p>• Les courses en attente s'affichent automatiquement</p>
              <p>• Acceptez une course pour commencer</p>
              <p>• Vous ne pouvez avoir qu'une seule course active</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
