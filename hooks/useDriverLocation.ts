/**
 * Hook pour gérer la position GPS du chauffeur en temps réel
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';

/**
 * Hook pour mettre à jour la position du chauffeur
 */
export function useUpdateDriverLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) => {
      return api.updateDriverLocation(lat, lng);
    },
    onSuccess: (driver) => {
      // Invalider le cache du driver pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
    onError: (error: Error) => {
      console.error('❌ Erreur lors de la mise à jour de la position:', error);
      toast.error('Impossible de mettre à jour votre position.');
    },
  });
}

/**
 * Hook pour démarrer le suivi GPS automatique du chauffeur
 * Utilise la géolocalisation du navigateur et met à jour la position toutes les 5 secondes
 */
export function useDriverLocationTracking(isActive: boolean = false) {
  const updateLocation = useUpdateDriverLocation();
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const UPDATE_INTERVAL = 5000; // 5 secondes

  useEffect(() => {
    if (!isActive) {
      // Arrêter le suivi si inactif
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Vérifier si la géolocalisation est supportée
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    // Fonction de succès lors de la récupération de la position
    const handleSuccess = (position: GeolocationPosition) => {
      const now = Date.now();
      const { latitude, longitude } = position.coords;

      // Mettre à jour seulement toutes les 5 secondes pour éviter trop de requêtes
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        updateLocation.mutate({ lat: latitude, lng: longitude });
        lastUpdateRef.current = now;
      }
    };

    // Fonction d'erreur
    const handleError = (error: GeolocationPositionError) => {
      console.error('❌ Erreur de géolocalisation:', error);

      let message = 'Impossible d\'obtenir votre position.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Vous avez refusé l\'accès à votre position. Veuillez l\'activer dans les paramètres.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Position indisponible. Veuillez vérifier votre GPS.';
          break;
        case error.TIMEOUT:
          message = 'Le délai pour obtenir votre position a expiré.';
          break;
      }

      toast.error(message);
    };

    // Options de géolocalisation
    const options: PositionOptions = {
      enableHighAccuracy: true, // Haute précision
      timeout: 10000, // 10 secondes max
      maximumAge: 0, // Ne pas utiliser de cache
    };

    // Démarrer le suivi de la position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Nettoyer le suivi lors du démontage
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, updateLocation]);

  return {
    isTracking: watchIdRef.current !== null,
    updateLocation,
  };
}

/**
 * Hook pour mettre à jour manuellement la position une seule fois
 */
export function useGetCurrentLocation() {
  const updateLocation = useUpdateDriverLocation();

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    toast.loading('Obtention de votre position...', { id: 'get-location' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        toast.dismiss('get-location');
        updateLocation.mutate({ lat: latitude, lng: longitude });
      },
      (error) => {
        toast.dismiss('get-location');
        let message = 'Impossible d\'obtenir votre position.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Accès à la position refusé.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position indisponible.';
            break;
          case error.TIMEOUT:
            message = 'Délai expiré.';
            break;
        }

        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return {
    getCurrentLocation,
    isLoading: updateLocation.isPending,
  };
}
