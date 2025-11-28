'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: 'default' | 'pickup' | 'dropoff' | 'driver';
  }>;
  showUserLocation?: boolean;
}

export function MapComponent({
  center = [48.8566, 2.3522], // Paris par défaut
  zoom = 13,
  className = 'h-96 w-full',
  onMapClick,
  markers = [],
  showUserLocation = true,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Éviter de réinitialiser

    const map = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Gérer les clics sur la carte
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    // Localisation de l'utilisateur
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Vérifier que la carte existe toujours (composant pas démonté)
          if (!mapRef.current) return;

          const { latitude, longitude } = position.coords;
          const userMarker = L.marker([latitude, longitude])
            .addTo(mapRef.current)
            .bindPopup('Votre position')
            .openPopup();
          mapRef.current.setView([latitude, longitude], zoom);
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Mettre à jour le centre et le zoom
  useEffect(() => {
    if (mapRef.current) {
      // Vérifier que les coordonnées sont valides avant de mettre à jour
      if (
        Array.isArray(center) &&
        center.length === 2 &&
        typeof center[0] === 'number' &&
        typeof center[1] === 'number' &&
        !isNaN(center[0]) &&
        !isNaN(center[1])
      ) {
        mapRef.current.setView(center, zoom);
      } else {
        console.error('❌ MapComponent: coordonnées invalides:', center);
      }
    }
  }, [center, zoom]);

  // Gérer les marqueurs
  useEffect(() => {
    if (!mapRef.current) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Créer les icônes personnalisées
    const createIcon = (type: string) => {
      const colors: Record<string, string> = {
        pickup: '#22c55e',   // vert
        dropoff: '#ef4444',  // rouge
        driver: '#3b82f6',   // bleu
        default: '#6b7280',  // gris
      };

      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 30px;
            height: 30px;
            background-color: ${colors[type] || colors.default};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
    };

    // Ajouter les nouveaux marqueurs
    markers.forEach(({ position, popup, icon = 'default' }) => {
      // Vérifier que la position est valide
      if (
        !Array.isArray(position) ||
        position.length !== 2 ||
        typeof position[0] !== 'number' ||
        typeof position[1] !== 'number' ||
        isNaN(position[0]) ||
        isNaN(position[1])
      ) {
        console.warn('⚠️ MapComponent: marqueur ignoré, position invalide:', position);
        return;
      }

      const marker = L.marker(position, {
        icon: createIcon(icon),
      }).addTo(mapRef.current!);

      if (popup) {
        marker.bindPopup(popup);
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  return <div ref={mapContainerRef} className={className} />;
}
