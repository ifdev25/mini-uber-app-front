'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  showCurrentLocation?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Entrez une adresse...',
  showCurrentLocation = true,
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recherche d'adresses avec Nominatim
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data: AddressResult[] = await response.json();
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        searchAddress(value);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sélectionner une adresse
  const handleSelectAddress = (result: AddressResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onSelect(result.display_name, lat, lng);
    setShowDropdown(false);
    setResults([]);
  };

  // Utiliser la position actuelle
  const useCurrentLocation = () => {
    console.log('🔍 Tentative de géolocalisation...');

    if (!navigator.geolocation) {
      const message = "La géolocalisation n'est pas supportée par votre navigateur";
      console.error('❌', message);
      alert(message);
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Position obtenue:', position.coords);
        const { latitude, longitude, accuracy } = position.coords;

        console.log(`📏 Précision: ${accuracy} mètres`);

        // Avertir si la précision est mauvaise (> 1km)
        if (accuracy > 1000) {
          const confirmUse = window.confirm(
            `⚠️ Attention: La précision de votre position est faible (${Math.round(accuracy)}m).\n\n` +
            `Cela peut être dû à:\n` +
            `- GPS désactivé\n` +
            `- Signal GPS faible\n` +
            `- Localisation par IP/WiFi\n\n` +
            `Voulez-vous utiliser cette position quand même?`
          );

          if (!confirmUse) {
            setIsGettingLocation(false);
            return;
          }
        } else if (accuracy > 100) {
          console.warn(`⚠️ Précision modérée: ${Math.round(accuracy)}m`);
        }

        // Reverse geocoding pour obtenir l'adresse
        try {
          console.log('🌍 Tentative de reverse geocoding...');
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
              `format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            {
              headers: {
                'Accept-Language': 'fr',
              },
            }
          );

          const data = await response.json();
          console.log('✅ Adresse trouvée:', data.display_name);
          const addressWithAccuracy = accuracy > 100
            ? `${data.display_name} (±${Math.round(accuracy)}m)`
            : data.display_name;
          onSelect(addressWithAccuracy, latitude, longitude);
        } catch (error) {
          console.error('⚠️ Reverse geocoding error:', error);
          const fallbackAddress = `Ma position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
          console.log('📍 Utilisation de l\'adresse de secours:', fallbackAddress);
          onSelect(fallbackAddress, latitude, longitude);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let message = "Impossible d'obtenir votre position. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += "Vous avez refusé l'accès à votre position. Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.";
            break;
          case error.POSITION_UNAVAILABLE:
            message += "Votre position n'est pas disponible.";
            break;
          case error.TIMEOUT:
            message += "La demande a expiré.";
            break;
          default:
            message += "Une erreur inconnue s'est produite.";
        }

        alert(message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
          />

          {/* Dropdown avec résultats */}
          {showDropdown && results.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {results.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectAddress(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm">{result.display_name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Indicateur de recherche */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
            </div>
          )}
        </div>

        {showCurrentLocation && (
          <Button
            type="button"
            variant="outline"
            onClick={useCurrentLocation}
            disabled={isGettingLocation}
            title="Utiliser ma position actuelle"
            className="min-w-[100px]"
          >
            {isGettingLocation ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
                Localisation...
              </span>
            ) : (
              <span>📍 Ma position</span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
