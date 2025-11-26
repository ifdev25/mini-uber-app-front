'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic';

// Force dynamic rendering (Leaflet requires client-side)
export const dynamic = 'force-dynamic';

// Charger MapComponent côté client uniquement
const MapComponent = dynamicImport(() => import('@/components/map').then(mod => ({ default: mod.MapComponent })), { ssr: false });
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRide, useCancelRide } from '@/hooks/useRides';
import { RIDE_STATUS, VEHICLE_TYPES, MAP_CONFIG } from '@/lib/constants';
import { Driver, User } from '@/lib/types';

export default function RideTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoadingUser: userLoading } = useAuth();
  const rideId = parseInt(params.id as string);
  const { data: ride, isLoading: rideLoading, error, refetch } = useRide(rideId);
  const cancelRide = useCancelRide();

  // Polling pour rafraîchir la course toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Rediriger si non connecté
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Annuler la course
  const handleCancelRide = () => {
    if (!ride) return;

    const confirmed = confirm('Êtes-vous sûr de vouloir annuler cette course ?');
    if (confirmed) {
      cancelRide.mutate(ride.id);
    }
  };

  if (userLoading || rideLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Course introuvable</h1>
          <p className="text-gray-600 mb-4">
            La course demandée n'existe pas ou vous n'avez pas accès à celle-ci.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </Card>
      </div>
    );
  }

  // ========== DEBUG: Affichage des données du chauffeur ==========
  console.log('🔍 DEBUG RIDE:', {
    rideId: ride.id,
    status: ride.status,
    driver: ride.driver,
    driverType: typeof ride.driver,
  });

  // Extraire les informations du chauffeur
  const driver = typeof ride.driver === 'object' ? ride.driver : null;
  const driverUser = driver && typeof driver.user === 'object' ? driver.user as User : null;

  if (driver) {
    console.log('✅ Driver détecté:', {
      id: driver.id,
      lat: driver.currentLatitude,
      lng: driver.currentLongitude,
      vehicleModel: driver.vehicleModel,
      user: driverUser,
    });
  } else {
    console.warn('❌ Pas de driver (IRI ou null):', ride.driver);
  }

  // Préparer les marqueurs pour la carte
  const markers: Array<{
    position: [number, number];
    popup?: string;
    icon?: 'default' | 'pickup' | 'dropoff' | 'driver';
  }> = [
    {
      position: [ride.pickupLatitude, ride.pickupLongitude] as [number, number],
      popup: `Départ: ${ride.pickupAddress}`,
      icon: 'pickup' as const,
    },
    {
      position: [ride.dropoffLatitude, ride.dropoffLongitude] as [number, number],
      popup: `Arrivée: ${ride.dropoffAddress}`,
      icon: 'dropoff' as const,
    },
  ];

  // Ajouter le marqueur du chauffeur si disponible
  if (driver && ride.status !== 'pending' && ride.status !== 'cancelled') {
    console.log('🚗 Ajout du marqueur chauffeur à la position:', [driver.currentLatitude, driver.currentLongitude]);
    markers.push({
      position: [driver.currentLatitude, driver.currentLongitude] as [number, number],
      popup: `Chauffeur: ${driverUser?.firstName || 'Chauffeur'}`,
      icon: 'driver' as const,
    });
  } else {
    console.warn('⚠️ Marqueur chauffeur NON ajouté:', {
      hasDriver: !!driver,
      status: ride.status,
      reason: !driver ? 'Pas de driver' : `Status incompatible: ${ride.status}`,
    });
  }

  console.log('📍 Total markers:', markers.length, markers);

  // Centre de la carte (position du chauffeur ou milieu entre pickup et dropoff)
  const mapCenter: [number, number] = driver && ride.status !== 'pending'
    ? [driver.currentLatitude, driver.currentLongitude]
    : [
        (ride.pickupLatitude + ride.dropoffLatitude) / 2,
        (ride.pickupLongitude + ride.dropoffLongitude) / 2,
      ];

  const statusConfig = RIDE_STATUS[ride.status];
  const vehicleConfig = VEHICLE_TYPES[ride.vehicleType];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Suivi de course #{ride.id}</h1>
        <p className="text-gray-600 mt-2">
          {statusConfig.icon} {statusConfig.label} - {statusConfig.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte - 2/3 de la largeur */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <MapComponent
              center={mapCenter}
              zoom={MAP_CONFIG.DEFAULT_ZOOM}
              className="h-[600px] w-full rounded-lg"
              markers={markers}
              showUserLocation={false}
            />
          </Card>
        </div>

        {/* Détails - 1/3 de la largeur */}
        <div className="space-y-4">
          {/* Statut */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Statut de la course</h2>
            <div
              className={`px-4 py-3 rounded-lg ${
                ride.status === 'completed'
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
              <div className="font-semibold">
                {statusConfig.icon} {statusConfig.label}
              </div>
              <div className="text-sm mt-1">{statusConfig.description}</div>
            </div>
          </Card>

          {/* Informations du chauffeur */}
          {driver && driverUser && ride.status !== 'pending' && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Votre chauffeur</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Nom:</span> {driverUser.firstName}{' '}
                  {driverUser.lastName}
                </p>
                {driver.rating && (
                  <p>
                    <span className="font-medium">Note:</span> ⭐ {driver.rating.toFixed(1)}
                  </p>
                )}
                <p>
                  <span className="font-medium">Véhicule:</span>{' '}
                  {vehicleConfig.icon} {driver.vehicleModel} ({driver.vehicleColor})
                </p>
                {driver.licenceNumber && (
                  <p>
                    <span className="font-medium">Licence:</span> {driver.licenceNumber}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Recherche d'un chauffeur */}
          {ride.status === 'pending' && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <h2 className="font-semibold mb-2">Recherche en cours...</h2>
              <p className="text-sm text-gray-600">
                Nous recherchons un chauffeur disponible pour votre course.
              </p>
              <div className="mt-3 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
              </div>
            </Card>
          )}

          {/* Détails du trajet */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Détails du trajet</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Départ</p>
                <p className="font-medium">📍 {ride.pickupAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Arrivée</p>
                <p className="font-medium">📍 {ride.dropoffAddress}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500">Véhicule</p>
                <p className="font-medium">
                  {vehicleConfig.icon} {vehicleConfig.label}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Distance estimée</p>
                <p className="font-medium">{ride.estimatedDistance.toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Durée estimée</p>
                <p className="font-medium">{ride.estimatedDuration} min</p>
              </div>
            </div>
          </Card>

          {/* Prix */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h2 className="font-semibold mb-2">Prix</h2>
            <p className="text-2xl font-bold text-blue-600">
              {ride.finalPrice ? ride.finalPrice.toFixed(2) : ride.estimatedPrice.toFixed(2)} €
            </p>
            {!ride.finalPrice && (
              <p className="text-xs text-gray-500 mt-1">Prix estimé</p>
            )}
          </Card>

          {/* Actions */}
          {ride.status === 'pending' && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancelRide}
              disabled={cancelRide.isPending}
            >
              {cancelRide.isPending ? 'Annulation en cours...' : 'Annuler la course'}
            </Button>
          )}

          {ride.status === 'completed' && (
            <Button
              className="w-full"
              onClick={() => router.push(`/passenger/ride/${ride.id}/rate`)}
            >
              Noter le chauffeur
            </Button>
          )}

          {(ride.status === 'cancelled' || ride.status === 'completed') && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              Retour au tableau de bord
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
