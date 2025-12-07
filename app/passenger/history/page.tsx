'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRides } from '@/hooks/useRides';
import { RIDE_STATUS, VEHICLE_TYPES } from '@/lib/constants';
import { Ride, RideStatus, Driver, User } from '@/lib/types';

export default function RideHistoryPage() {
  const router = useRouter();
  const { user, isLoadingUser: userLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<RideStatus | 'all'>('all');

  // Construire les filtres pour l'API
  const filters: Record<string, any> = {};

  // IMPORTANT: Filtrer par l'utilisateur connecté (passager)
  // Format API Platform: passenger={id}
  if (user?.id) {
    filters.passenger = user.id;
  }

  // Filtrer par statut si sélectionné
  if (statusFilter !== 'all') {
    filters.status = statusFilter;
  }

  // Trier par date décroissante (plus récentes en premier)
  filters['order[createdAt]'] = 'desc';

  const { data: ridesCollection, isLoading: ridesLoading } = useRides(filters);

  // Rediriger si non connecté ou pas un passager
  useEffect(() => {
    if (!userLoading && (!user || user.userType !== 'passenger')) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || ridesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  // Support des deux formats : 'hydra:member' (JSON) et 'member' (JS parsé)
  const rides = ridesCollection?.['hydra:member'] || ridesCollection?.member || [];

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
  const RideCard = ({ ride }: { ride: Ride }) => {
    const statusConfig = RIDE_STATUS[ride.status];
    const vehicleConfig = VEHICLE_TYPES[ride.vehicleType];

    // Extraction intelligente du driver (peut être User direct ou Driver avec user)
    const driver = typeof ride.driver === 'object' ? ride.driver as any : null;
    const driverUser: User | null = driver
      ? (driver.user && typeof driver.user === 'object'
        ? driver.user as User
        : driver as User) // driver EST l'user
      : null;

    return (
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => router.push(`/passenger/ride/${ride.id}`)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{statusConfig.icon}</span>
              <span className="font-semibold">Course #{ride.id}</span>
            </div>
            <p className="text-sm text-gray-500">
              {formatDate(ride.createdAt)}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${ride.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
                : ride.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : ride.status === 'in_progress'
                    ? 'bg-green-100 text-green-800'
                    : ride.status === 'accepted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
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
                {ride.pickupAddress || <span className="text-red-500">Non disponible</span>}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-600 mt-1">📍</span>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Arrivée</p>
              <p className="text-sm font-medium truncate">
                {ride.dropoffAddress || <span className="text-red-500">Non disponible</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{vehicleConfig?.icon || '🚗'} {vehicleConfig?.label || 'Standard'}</span>
            <span>
              {ride.estimatedDistance ? `${ride.estimatedDistance.toFixed(1)} km` : <span className="text-red-500">? km</span>}
            </span>
            <span>
              {ride.estimatedDuration ? `${ride.estimatedDuration} min` : <span className="text-red-500">? min</span>}
            </span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {ride.finalPrice
              ? `${ride.finalPrice.toFixed(2)} €`
              : ride.estimatedPrice
              ? `${ride.estimatedPrice.toFixed(2)} €`
              : <span className="text-red-500">? €</span>
            }
          </div>
        </div>

        {driverUser && ride.status !== 'pending' && (
          <div className="mt-3 pt-3 border-t text-sm">
            <span className="text-gray-500">Chauffeur: </span>
            <span className="font-medium">
              {driverUser.firstName} {driverUser.lastName}
            </span>
            {driverUser.rating && (
              <span className="ml-2">⭐ {driverUser.rating.toFixed(1)}</span>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Historique des courses</h1>
          <p className="text-gray-600 mt-2">
            Consultez toutes vos courses passées et en cours
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/passenger/book')}>
          ← Nouvelle course
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Courses totales</p>
          <p className="text-3xl font-bold text-blue-600">{rides.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Courses terminées</p>
          <p className="text-3xl font-bold text-green-600">
            {rides.filter((r) => r.status === 'completed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total dépensé</p>
          <p className="text-3xl font-bold text-blue-600">
            {rides
              .filter((r) => r.finalPrice)
              .reduce((sum, r) => sum + (r.finalPrice || 0), 0)
              .toFixed(2)}{' '}
            €
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Note moyenne</p>
          <p className="text-3xl font-bold text-yellow-600">⭐ {(user?.rating || 0).toFixed(1)}</p>
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
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            {RIDE_STATUS.pending.icon} En attente
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
          <Button onClick={() => router.push('/passenger/book')}>
            Réserver une course
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 mb-4">
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
