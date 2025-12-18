/**
 * Hook React pour s'abonner aux notifications Mercure en temps réel
 * Basé sur MERCURE_REALTIME_GUIDE.md et MERCURE_INSTANT_RIDE_NOTIFICATION.md
 *
 * @example
 * // Écouter les mises à jour d'une course
 * const { ride, isConnected } = useMercure(rideId);
 */

import { useEffect, useState } from 'react';
import { MERCURE_CONFIG } from '@/lib/constants';
import { Ride } from '@/lib/types';

interface UseMercureReturn {
  /**
   * Dernière donnée reçue via Mercure
   */
  ride: Ride | null;

  /**
   * Statut de la connexion Mercure
   */
  isConnected: boolean;

  /**
   * Erreur de connexion (si applicable)
   */
  error: Error | null;
}

/**
 * Hook pour s'abonner aux mises à jour d'une course via Mercure
 * Implémentation conforme à la documentation MERCURE_REALTIME_GUIDE.md
 *
 * @param rideId - ID de la course à suivre
 * @returns État de la connexion et données de la course
 */
export function useMercure(rideId: number | null): UseMercureReturn {
  const [ride, setRide] = useState<Ride | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!rideId) return;

    // ✅ Format du topic conforme à la documentation
    // MERCURE_INSTANT_RIDE_NOTIFICATION.md ligne 79
    const topic = `${MERCURE_CONFIG.BACKEND_URL}/api/rides/${rideId}`;

    // Construire l'URL du hub Mercure avec le topic
    const url = new URL(MERCURE_CONFIG.HUB_URL);
    url.searchParams.append('topic', topic);

    console.log('🚀 [Mercure] Connexion au topic:', topic);

    // Créer la connexion EventSource (Server-Sent Events)
    const eventSource = new EventSource(url.toString());

    // Gérer les messages reçus
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 [Mercure] Notification brute reçue:', data);

        // Gérer deux formats possibles (selon MERCURE_INSTANT_RIDE_NOTIFICATION.md):
        // 1. Publication automatique API Platform : { id, status, driver, ... } (objet Ride direct)
        // 2. Notification manuelle : { type: 'ride_accepted', ride: { ... } } (objet avec type)
        let updatedRide: Ride;

        if (data.type && data.ride) {
          // Format notification manuelle (avec type)
          console.log('📨 [Mercure] Format notification manuelle détecté:', data.type);
          updatedRide = data.ride;
        } else {
          // Format publication automatique API Platform
          console.log('📨 [Mercure] Format API Platform détecté');
          updatedRide = data;
        }

        console.log('📨 [Mercure] Ride mise à jour:', updatedRide);
        setRide(updatedRide);
        setError(null);
      } catch (parseError) {
        console.error('❌ [Mercure] Erreur de parsing:', parseError);
        setError(new Error('Erreur de parsing des données Mercure'));
      }
    };

    // Gérer la connexion établie
    eventSource.onopen = () => {
      console.log('✅ [Mercure] Connexion établie');
      setIsConnected(true);
      setError(null);
    };

    // Gérer les erreurs de connexion
    eventSource.onerror = (event) => {
      console.error('❌ [Mercure] Erreur de connexion');
      console.error('💡 [Mercure] Vérifiez que :');
      console.error('   1. Mercure est démarré : docker compose ps');
      console.error('   2. CORS est configuré dans docker-compose.yaml :');
      console.error('      MERCURE_CORS_ORIGINS: "http://localhost:3001"');
      console.error('   3. L\'URL du hub est correcte :', MERCURE_CONFIG.HUB_URL);

      setIsConnected(false);
      setError(new Error('Erreur de connexion Mercure - Vérifiez les logs'));

      // Fermer la connexion en erreur
      eventSource.close();
    };

    // Cleanup : fermer la connexion au démontage du composant
    return () => {
      console.log('🔌 [Mercure] Fermeture de la connexion');
      eventSource.close();
    };
  }, [rideId]);

  return {
    ride,
    isConnected,
    error,
  };
}
