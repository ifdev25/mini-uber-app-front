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
import { useMercure } from '@/hooks/useMercure';
import { RIDE_STATUS, VEHICLE_TYPES, MAP_CONFIG } from '@/lib/constants';
import { Driver, User, Ride } from '@/lib/types';
import toast from 'react-hot-toast';

export default function RideTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoadingUser: userLoading } = useAuth();
  const rideId = parseInt(params.id as string);

  // ✅ Chargement initial de la course via API REST
  const { data: initialRide, isLoading: rideLoading, error, refetch } = useRide(rideId);

  // ✅ Abonnement aux mises à jour temps réel via Mercure
  const { ride: mercureRide, isConnected: mercureConnected, error: mercureError } = useMercure(rideId);

  const cancelRide = useCancelRide();

  // État local pour la course (fusion des données API REST + Mercure)
  const [ride, setRide] = useState<Ride | null>(null);

  // Fusionner les données initiales (REST) et les mises à jour temps réel (Mercure)
  useEffect(() => {
    if (mercureRide && initialRide) {
      // ✅ Fusionner les données REST et Mercure pour éviter de perdre des champs
      const mergedRide = {
        ...initialRide,      // Données de base de l'API REST
        ...mercureRide,       // Mises à jour en temps réel de Mercure (écrase les champs présents)
      };
      setRide(mergedRide);
    } else if (mercureRide) {
      // ✅ Uniquement Mercure (cas rare)
      setRide(mercureRide);
    } else if (initialRide) {
      // ✅ Uniquement API REST (Mercure pas encore connecté)
      setRide(initialRide);
    }
  }, [mercureRide, initialRide]);

  // Afficher une notification quand un chauffeur accepte la course
  useEffect(() => {
    if (ride && ride.status === 'accepted' && initialRide?.status === 'pending') {
      // La course vient d'être acceptée (transition pending → accepted)
      const driverUser = ride.driver && typeof ride.driver === 'object' && 'user' in ride.driver
        ? (typeof ride.driver.user === 'object' ? ride.driver.user as User : null)
        : (ride.driver as User | null);

      const driverName = driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : 'Un chauffeur';

      toast.success(`🎉 ${driverName} a accepté votre course !`, {
        duration: 5000,
        icon: '🚗',
      });
    }
  }, [ride?.status, initialRide?.status]);

  // Rediriger si non connecté
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // ✅ Polling de secours si Mercure échoue (fallback)
  // Seulement si Mercure n'est PAS connecté
  useEffect(() => {
    if (!ride || ride.status === 'completed' || ride.status === 'cancelled') {
      return;
    }

    // Si Mercure est connecté, pas besoin de polling
    if (mercureConnected) {
      console.log('✅ [Polling] Désactivé - Mercure est connecté');
      return;
    }

    // Mercure non connecté → activer le polling de secours
    console.log('⚠️ [Polling] Activé - Mercure non disponible');
    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [ride, refetch, mercureConnected]);

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
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

  // ========== Extraction intelligente du driver ==========
  // Le backend peut renvoyer 2 formats :
  // 1. driver est un User direct (format actuel du backend)
  // 2. driver est un Driver avec user imbriqué (format documenté)

  const driver = ride.driver && typeof ride.driver === 'object' ? ride.driver as any : null;

  // Si driver a une propriété 'user', c'est un Driver complet
  // Sinon, c'est un User direct
  const driverUser: User | null = driver
    ? (driver.user && typeof driver.user === 'object'
        ? driver.user as User
        : driver as User) // driver EST l'user
    : null;

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
    markers.push({
      position: [driver.currentLatitude, driver.currentLongitude] as [number, number],
      popup: `Chauffeur: ${driverUser?.firstName || 'Chauffeur'}`,
      icon: 'driver' as const,
    });
  }


  // Centre de la carte (position du chauffeur ou milieu entre pickup et dropoff)
  // Valeur par défaut : Paris
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  let mapCenter: [number, number] = defaultCenter;

  // Si le driver existe et a des coordonnées valides, centrer sur lui
  if (driver && ride.status !== 'pending' &&
      typeof driver.currentLatitude === 'number' &&
      typeof driver.currentLongitude === 'number' &&
      !isNaN(driver.currentLatitude) &&
      !isNaN(driver.currentLongitude)) {
    mapCenter = [driver.currentLatitude, driver.currentLongitude];
  }
  // Sinon, si les coordonnées pickup/dropoff sont valides, centrer entre les deux
  else if (typeof ride.pickupLatitude === 'number' &&
           typeof ride.pickupLongitude === 'number' &&
           typeof ride.dropoffLatitude === 'number' &&
           typeof ride.dropoffLongitude === 'number' &&
           !isNaN(ride.pickupLatitude) &&
           !isNaN(ride.pickupLongitude) &&
           !isNaN(ride.dropoffLatitude) &&
           !isNaN(ride.dropoffLongitude)) {
    mapCenter = [
      (ride.pickupLatitude + ride.dropoffLatitude) / 2,
      (ride.pickupLongitude + ride.dropoffLongitude) / 2,
    ];
  }

  const statusConfig = RIDE_STATUS[ride.status] || {
    label: 'Statut inconnu',
    icon: '❓',
    description: 'Statut non reconnu',
    color: 'gray'
  };
  const vehicleConfig = VEHICLE_TYPES[ride.vehicleType] || VEHICLE_TYPES.standard;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Suivi de course #{ride.id}</h1>
          <p className="text-gray-600 mt-2">
            {statusConfig.icon} {statusConfig.label} - {statusConfig.description}
          </p>
          {/* Indicateur de connexion Mercure */}
          {mercureConnected && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <span className="animate-pulse">⚡</span>
              <span>Notifications instantanées actives</span>
            </div>
          )}
          {mercureError && !mercureConnected && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              <span>⚠️</span>
              <span>Mode polling activé (3s)</span>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push('/passenger/history')}>
          ← Retour
        </Button>
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
                {driverUser.rating && (
                  <p>
                    <span className="font-medium">Note:</span> ⭐ {driverUser.rating.toFixed(1)}
                  </p>
                )}
                {driver.vehicleModel && (
                  <p>
                    <span className="font-medium">Véhicule:</span>{' '}
                    {vehicleConfig.icon} {driver.vehicleModel} ({driver.vehicleColor})
                  </p>
                )}
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
                <p className="font-medium">
                  {ride.estimatedDistance ? ride.estimatedDistance.toFixed(1) : 'N/A'} km
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Durée estimée</p>
                <p className="font-medium">
                  {ride.estimatedDuration || 'N/A'} min
                </p>
              </div>
            </div>
          </Card>

          {/* Prix */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h2 className="font-semibold mb-2">Prix</h2>
            <p className="text-2xl font-bold text-blue-600">
              {ride.finalPrice
                ? (typeof ride.finalPrice === 'number' ? ride.finalPrice.toFixed(2) : ride.finalPrice)
                : ride.estimatedPrice
                  ? (typeof ride.estimatedPrice === 'number' ? ride.estimatedPrice.toFixed(2) : ride.estimatedPrice)
                  : 'N/A'} €
            </p>
            {!ride.finalPrice && ride.estimatedPrice && (
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
