'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDriverHistory } from '@/hooks/useRides';
import { RIDE_STATUS, VEHICLE_TYPES } from '@/lib/constants';
import { DriverHistoryRide, RideStatus } from '@/lib/types';
import toast from 'react-hot-toast';

export default function DriverHistoryPage() {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState<RideStatus | 'all'>('all');

  // Récupérer TOUTES les courses du driver (sans filtre status)
  // pour que les statistiques soient toujours correctes
  const { data: historyData, isLoading: ridesLoading } = useDriverHistory({
    limit: 1000, // Récupérer toutes les courses
  });

  // Extraire toutes les courses de la réponse
  const allRides = historyData?.data || [];

  // Filtrer les courses côté client selon le statusFilter
  // Cela permet de garder les stats globales constantes
  const rides = statusFilter === 'all'
    ? allRides
    : allRides.filter(r => r.status === statusFilter);

  // Rediriger si non connecté ou pas un driver
  useEffect(() => {
    if (!isLoadingUser) {
      if (!user) {
        toast.error('Vous devez être connecté');
        router.push('/login');
      } else if (user.userType?.toLowerCase() !== 'driver') {
        toast.error('Cette page est réservée aux chauffeurs');
        router.push('/dashboard');
      }
    }
  }, [user, isLoadingUser, router]);

  // Afficher un loader pendant le chargement
  if (isLoadingUser || ridesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Composant pour une carte de course
  const RideCard = ({ ride }: { ride: DriverHistoryRide }) => {
    const statusConfig = RIDE_STATUS[ride.status];
    const vehicleConfig = VEHICLE_TYPES[ride.vehicleType];

    return (
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => router.push(`/driver/ride/${ride.id}`)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{statusConfig.icon}</span>
              <span className="font-semibold">Course #{ride.id}</span>
            </div>
            <p className="text-sm text-gray-500">
              {formatDate(ride.dates.created)}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              ride.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : ride.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : ride.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800'
                : ride.status === 'accepted'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusConfig.label}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-1">📍</span>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Départ</p>
              <p className="text-sm font-medium truncate">
                {ride.pickup.address || <span className="text-red-500">Non disponible</span>}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-600 mt-1">📍</span>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Arrivée</p>
              <p className="text-sm font-medium truncate">
                {ride.dropoff.address || <span className="text-red-500">Non disponible</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{vehicleConfig?.icon || '🚗'} {vehicleConfig?.label || 'Standard'}</span>
            <span>
              {ride.distance ? `${ride.distance.toFixed(1)} km` : <span className="text-red-500">? km</span>}
            </span>
            <span>
              {ride.duration ? `${ride.duration} min` : <span className="text-red-500">? min</span>}
            </span>
          </div>
          <div className="text-lg font-bold text-green-600">
            {ride.price.final
              ? `${ride.price.final.toFixed(2)} €`
              : ride.price.estimated
              ? `${ride.price.estimated.toFixed(2)} €`
              : <span className="text-red-500">? €</span>
            }
          </div>
        </div>

        <div className="mt-3 pt-3 border-t text-sm">
          <span className="text-gray-500">Passager: </span>
          <span className="font-medium">{ride.passenger.name}</span>
          {ride.passenger.rating && (
            <span className="ml-2">⭐ {ride.passenger.rating.toFixed(1)}</span>
          )}
        </div>
      </Card>
    );
  };

  // Calcul des statistiques sur TOUTES les courses (pas sur les courses filtrées)
  // pour que les stats restent constantes même quand on change de filtre
  const completedRides = allRides.filter((r) => r.status === 'completed');
  const totalEarnings = completedRides.reduce((sum, r) => sum + (r.price.final || r.price.estimated), 0);
  const totalDistance = completedRides.reduce((sum, r) => sum + r.distance, 0);
  const averageRating = user?.rating || 0;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Historique des courses</h1>
          <p className="text-gray-600 mt-2">
            Consultez toutes vos courses et vos statistiques
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/driver/dashboard')}>
          ← Retour au dashboard
        </Button>
      </div>

      {/* Statistiques globales - Basées sur TOUTES les courses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Courses totales</p>
          <p className="text-3xl font-bold text-blue-600">{allRides.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Courses terminées</p>
          <p className="text-3xl font-bold text-green-600">{completedRides.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Gains totaux</p>
          <p className="text-3xl font-bold text-green-600">{totalEarnings.toFixed(2)} €</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Note moyenne</p>
          <p className="text-3xl font-bold text-yellow-600">⭐ {averageRating.toFixed(1)}</p>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Toutes
          </Button>
          <Button
            variant={statusFilter === 'accepted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('accepted')}
          >
            {RIDE_STATUS.accepted.icon} Acceptées
          </Button>
          <Button
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('in_progress')}
          >
            {RIDE_STATUS.in_progress.icon} En cours
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            {RIDE_STATUS.completed.icon} Terminées
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('cancelled')}
          >
            {RIDE_STATUS.cancelled.icon} Annulées
          </Button>
        </div>
      </Card>

      {/* Liste des courses */}
      {rides.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">
            {statusFilter === 'all'
              ? 'Vous n\'avez encore aucune course.'
              : `Aucune course avec le statut "${RIDE_STATUS[statusFilter].label}".`}
          </p>
          <Button onClick={() => router.push('/driver/dashboard')}>
            Retour au dashboard
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 mb-4">
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>

          {/* Statistiques détaillées pour les courses filtrées */}
          {statusFilter === 'completed' && completedRides.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Statistiques des courses terminées</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {totalEarnings.toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-500">Gains totaux</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {totalDistance.toFixed(1)} km
                  </p>
                  <p className="text-sm text-gray-500">Distance totale</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {(totalEarnings / completedRides.length).toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-500">Gain moyen/course</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
