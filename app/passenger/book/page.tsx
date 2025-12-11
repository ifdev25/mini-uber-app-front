'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic';

// Force dynamic rendering (Leaflet requires client-side)
export const dynamic = 'force-dynamic';

// Charger les composants de carte côté client uniquement
const MapComponent = dynamicImport(() => import('@/components/map').then(mod => ({ default: mod.MapComponent })), { ssr: false });
const AddressAutocomplete = dynamicImport(() => import('@/components/map').then(mod => ({ default: mod.AddressAutocomplete })), { ssr: false });
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useCreateRide, useAvailableDrivers } from '@/hooks/useRides';
import { VEHICLE_TYPES, MAP_CONFIG } from '@/lib/constants';
import { VehicleType, RideEstimate, Driver, User } from '@/lib/types';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

export default function BookRidePage() {
  const router = useRouter();
  const { user, isLoadingUser, logout } = useAuth();
  const createRide = useCreateRide();
  const { data: driversData, isLoading: isLoadingDrivers, error: driversError } = useAvailableDrivers();

  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [dropoff, setDropoff] = useState<LocationData | null>(null);
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('standard');
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Rediriger si non connecté ou pas un passager
  useEffect(() => {
    if (!isLoadingUser) {

      if (!user) {
        router.push('/login');
      } else if (user.userType?.toLowerCase() !== 'passenger') {
        router.push('/login');
      } else {
      }
    }
  }, [user, isLoadingUser, router]);

  // Calculer l'estimation de prix
  const calculateEstimate = () => {
    if (!pickup || !dropoff) return;

    setIsEstimating(true);

    // Calcul de la distance (haversine approximatif)
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
    const dLon = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickup.lat * Math.PI) / 180) *
      Math.cos((dropoff.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimation de la durée (50 km/h en moyenne en ville)
    const duration = (distance / 50) * 60;

    // Calcul du prix
    const vehicleConfig = VEHICLE_TYPES[selectedVehicle];
    const price = vehicleConfig.basePrice + distance * vehicleConfig.pricePerKm;

    setEstimate({
      distance: parseFloat(distance.toFixed(2)),
      duration: Math.ceil(duration),
      price: parseFloat(price.toFixed(2)),
      vehicleType: selectedVehicle,
    });

    setIsEstimating(false);
  };

  // Recalculer l'estimation quand les paramètres changent
  useEffect(() => {
    if (pickup && dropoff) {
      calculateEstimate();
    } else {
      setEstimate(null);
    }
  }, [pickup, dropoff, selectedVehicle]);

  // Réserver la course
  const handleBookRide = () => {
    if (!pickup || !dropoff || !estimate || !user) return;

    // Vérifier que l'utilisateur a vérifié son email
    if (!user.isVerified) {
      alert('❌ Compte non vérifié\n\nVous devez vérifier votre email avant de pouvoir réserver une course.\n\nVeuillez consulter votre boîte email et cliquer sur le lien de vérification.');
      return;
    }

    const rideData = {
      passenger: `/api/users/${user.id}`,
      pickupAddress: pickup.address,
      pickupLatitude: pickup.lat,
      pickupLongitude: pickup.lng,
      dropoffAddress: dropoff.address,
      dropoffLatitude: dropoff.lat,
      dropoffLongitude: dropoff.lng,
      vehicleType: selectedVehicle,
      estimatedPrice: estimate.price,
      estimatedDistance: estimate.distance,
      estimatedDuration: estimate.duration,
    };

    createRide.mutate(rideData);
  };

  // Obtenir la position actuelle de l'utilisateur
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationData: LocationData = {
          address: `Ma position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          lat: latitude,
          lng: longitude,
        };
        setPickup(locationData);
        setPickupInput(locationData.address);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Impossible d\'obtenir votre position. Veuillez vérifier vos permissions.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  // Gérer les clics sur la carte
  const handleMapClick = (lat: number, lng: number) => {
    const locationData: LocationData = {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
    };

    if (!pickup) {
      setPickup(locationData);
      setPickupInput(locationData.address);
    } else if (!dropoff) {
      setDropoff(locationData);
      setDropoffInput(locationData.address);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  // Fonction pour calculer la distance entre deux points GPS (formule haversine)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Marqueurs pour la carte
  const allDrivers = driversData?.['hydra:member'] || driversData?.member || [];

  // Filtrer les chauffeurs à proximité
  // DÉVELOPPEMENT: Rayon augmenté à 500 km pour permettre les tests hors Paris
  // PRODUCTION: Remettre à 20 km pour filtrer par proximité réelle
  const PROXIMITY_RADIUS_KM = 500;
  const userLocation = pickup || (typeof window !== 'undefined' && navigator.geolocation ? null : null);

  const nearbyDrivers = userLocation
    ? allDrivers.filter((driver: Driver) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          driver.currentLatitude,
          driver.currentLongitude
        );
        return distance <= PROXIMITY_RADIUS_KM;
      })
    : allDrivers; // Si pas de position utilisateur, afficher tous les drivers

  const drivers = nearbyDrivers;

  const markers = [
    ...(pickup
      ? [
        {
          position: [pickup.lat, pickup.lng] as [number, number],
          popup: `Départ: ${pickup.address}`,
          icon: 'pickup' as const,
        },
      ]
      : []),
    ...(dropoff
      ? [
        {
          position: [dropoff.lat, dropoff.lng] as [number, number],
          popup: `Arrivée: ${dropoff.address}`,
          icon: 'dropoff' as const,
        },
      ]
      : []),
    // Marqueurs des chauffeurs disponibles
    ...drivers.map((driver: Driver) => {
      const driverUser = typeof driver.user === 'object' ? driver.user as User : null;
      const driverName = driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : 'Chauffeur';

      // Protection contre les types de véhicules inconnus
      const vehicleConfig = VEHICLE_TYPES[driver.vehicleType] || VEHICLE_TYPES.standard;
      const vehicleInfo = `${vehicleConfig.label} - ${driver.vehicleModel}`;

      return {
        position: [driver.currentLatitude, driver.currentLongitude] as [number, number],
        popup: `🚗 ${driverName}\n${vehicleInfo}`,
        icon: 'driver' as const,
      };
    }),
  ];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Réserver une course</h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez vos adresses de départ et d'arrivée
          </p>
          {isLoadingDrivers && (
            <p className="text-blue-600 text-sm mt-1">
              ⏳ Recherche de chauffeurs disponibles...
            </p>
          )}
          {driversError && (
            <p className="text-red-600 text-sm mt-1">
              ⚠️ Impossible de charger les chauffeurs
            </p>
          )}
          {!isLoadingDrivers && !driversError && drivers.length > 0 && (
            <p className="text-green-600 text-sm mt-1">
              🚗 {drivers.length} chauffeur{drivers.length > 1 ? 's' : ''} {userLocation ? `à proximité (${PROXIMITY_RADIUS_KM} km)` : 'disponible' + (drivers.length > 1 ? 's' : '')}
              {userLocation && allDrivers.length > drivers.length && (
                <span className="text-gray-500"> • {allDrivers.length - drivers.length} autre{allDrivers.length - drivers.length > 1 ? 's' : ''} plus loin</span>
              )}
            </p>
          )}
          {!isLoadingDrivers && !driversError && drivers.length === 0 && allDrivers.length > 0 && (
            <p className="text-orange-600 text-sm mt-1">
              😔 Aucun chauffeur à proximité • {allDrivers.length} disponible{allDrivers.length > 1 ? 's' : ''} plus loin
            </p>
          )}
          {!isLoadingDrivers && !driversError && allDrivers.length === 0 && (
            <p className="text-orange-600 text-sm mt-1">
              😔 Aucun chauffeur disponible pour le moment
            </p>
          )}
          {!isLoadingDrivers && !driversError && !userLocation && allDrivers.length > 0 && (
            <p className="text-blue-600 text-xs mt-1">
              💡 Définissez un point de départ pour voir les chauffeurs à proximité
            </p>
          )}
        </div>
        <Button onClick={logout} variant="outline">
          Déconnexion
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carte */}
        <div className="order-2 lg:order-1">
          <Card className="p-4">
            <MapComponent
              center={[MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng]}
              zoom={MAP_CONFIG.DEFAULT_ZOOM}
              className="h-[500px] w-full rounded-lg"
              onMapClick={handleMapClick}
              markers={markers}
              showUserLocation={true}
            />
            <p className="text-sm text-gray-500 mt-2">
              Cliquez sur la carte pour définir le point de départ puis le point d'arrivée
            </p>
          </Card>
        </div>

        {/* Formulaire */}
        <div className="order-1 lg:order-2 space-y-4">
          {/* Adresse de départ */}
          <Card className="p-4">
            <Label htmlFor="pickup">Adresse de départ</Label>
            <div className="mt-2">
              <AddressAutocomplete
                value={pickupInput}
                onChange={setPickupInput}
                onSelect={(address, lat, lng) => {
                  setPickup({ address, lat, lng });
                  setPickupInput(address);
                }}
                placeholder="Entrez une adresse de départ..."
                showCurrentLocation={true}
              />
            </div>
          </Card>

          {/* Adresse d'arrivée */}
          <Card className="p-4">
            <Label htmlFor="dropoff">Adresse d'arrivée</Label>
            <div className="mt-2">
              <AddressAutocomplete
                value={dropoffInput}
                onChange={setDropoffInput}
                onSelect={(address, lat, lng) => {
                  setDropoff({ address, lat, lng });
                  setDropoffInput(address);
                }}
                placeholder="Entrez une adresse d'arrivée..."
                showCurrentLocation={true}
              />
            </div>
          </Card>

          {/* Choix du véhicule */}
          <Card className="p-4">
            <Label>Type de véhicule</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
              {(Object.keys(VEHICLE_TYPES) as VehicleType[]).map((type) => {
                const vehicle = VEHICLE_TYPES[type];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedVehicle(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${selectedVehicle === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-3xl mb-1">{vehicle.icon}</div>
                    <div className="font-semibold">{vehicle.label}</div>
                    <div className="text-xs text-gray-500">{vehicle.description}</div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Estimation */}
          {estimate && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2">Estimation de la course</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Distance:</span> {estimate.distance} km
                </p>
                <p>
                  <span className="font-medium">Durée estimée:</span>{' '}
                  {estimate.duration} min
                </p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  Prix: {estimate.price.toFixed(2)} €
                </p>
              </div>
            </Card>
          )}

          {/* Bouton de réservation */}
          <Button
            onClick={handleBookRide}
            disabled={!user || !pickup || !dropoff || !estimate || createRide.isPending}
            className="w-full"
            size="lg"
          >
            {createRide.isPending ? 'Réservation en cours...' : 'Réserver cette course'}
          </Button>

          {/* Message d'erreur */}
          {createRide.isError && (
            <Card className="p-4 bg-red-50 border-red-300 mt-4">
              <h3 className="font-bold text-red-900 mb-3 text-lg">❌ Erreur de réservation</h3>
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-red-700 font-mono text-sm whitespace-pre-wrap">
                  {createRide.error?.message || 'Une erreur est survenue'}
                </p>
              </div>
              <div className="mt-3 text-xs text-red-600">
                <p className="font-semibold mb-1">🔍 Pour déboguer:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ouvrez la console (F12)</li>
                  <li>Cherchez les messages avec ❌</li>
                  <li>Vérifiez que le backend est démarré</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
