'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { VEHICLE_TYPES } from '@/lib/constants';
import { VehicleType } from '@/lib/types';
import toast from 'react-hot-toast';

// Schéma de validation Zod selon API_ENDPOINTS.md
const driverProfileSchema = z.object({
  vehicleModel: z.string().min(2, 'Le modèle du véhicule doit contenir au moins 2 caractères'),
  vehicleType: z.enum(['standard', 'comfort', 'premium', 'xl'], {
    required_error: 'Veuillez sélectionner un type de véhicule',
  }),
  vehicleColor: z.string().min(2, 'La couleur doit contenir au moins 2 caractères'),
  licenceNumber: z.string().min(5, 'Le numéro de permis doit contenir au moins 5 caractères'),
  currentLatitude: z.number({
    required_error: 'La latitude est requise',
    invalid_type_error: 'La latitude doit être un nombre',
  }),
  currentLongitude: z.number({
    required_error: 'La longitude est requise',
    invalid_type_error: 'La longitude doit être un nombre',
  }),
});

type DriverProfileFormData = z.infer<typeof driverProfileSchema>;

export default function CreateDriverProfilePage() {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverProfileFormData>({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: {
      vehicleType: 'standard',
    },
  });

  const currentLat = watch('currentLatitude');
  const currentLng = watch('currentLongitude');
  const vehicleType = watch('vehicleType');

  // Rediriger si non connecté ou pas un driver
  useEffect(() => {
    if (!isLoadingUser) {
      if (!user) {
        toast.error('Vous devez être connecté');
        router.push('/login');
      } else if (user.userType?.toLowerCase() !== 'driver') {
        toast.error('Seuls les chauffeurs peuvent créer un profil driver');
        router.push('/dashboard');
      } else if (user.driverProfile) {
        // Si le driver a déjà un profil, rediriger vers le dashboard
        toast.success('Vous avez déjà un profil driver');
        router.push('/driver/dashboard');
      }
    }
  }, [user, isLoadingUser, router]);

  // Obtenir la position GPS actuelle
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGettingLocation(true);
    const loadingToastId = toast.loading('Obtention de votre position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue('currentLatitude', latitude);
        setValue('currentLongitude', longitude);
        toast.success(`Position obtenue: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, {
          id: loadingToastId,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        let message = 'Impossible d\'obtenir votre position';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Accès à la position refusé. Veuillez autoriser la géolocalisation.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position indisponible. Veuillez vérifier votre GPS.';
            break;
          case error.TIMEOUT:
            message = 'Délai expiré pour obtenir la position.';
            break;
        }

        toast.error(message, { id: loadingToastId });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Soumettre le formulaire
  const onSubmit = async (data: DriverProfileFormData) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading('Création de votre profil...');

    try {
      // Préparer les données selon le format API_ENDPOINTS.md
      const driverData = {
        user: `/api/users/${user.id}`, // IRI format requis par API Platform
        vehicleModel: data.vehicleModel,
        vehicleType: data.vehicleType,
        vehicleColor: data.vehicleColor,
        licenceNumber: data.licenceNumber,
        currentLatitude: data.currentLatitude,
        currentLongitude: data.currentLongitude,
      };

      console.log('📤 Création du profil driver avec les données:', driverData);

      // Appeler l'API
      const driver = await api.createDriver(driverData);

      console.log('✅ Profil driver créé avec succès:', driver);

      toast.success('Profil créé avec succès ! Bienvenue chez Mini Uber.', {
        id: loadingToastId,
        duration: 3000,
      });

      // Attendre un peu pour que l'utilisateur voit le message, puis rediriger
      setTimeout(() => {
        router.push('/driver/dashboard');
      }, 1500);
    } catch (error) {
      console.error('❌ Erreur lors de la création du profil:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      toast.error(`Échec de la création du profil: ${errorMessage}`, {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Créer votre profil chauffeur</CardTitle>
            <CardDescription>
              Remplissez les informations sur votre véhicule pour commencer à accepter des courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Modèle du véhicule */}
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">
                  Modèle du véhicule <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicleModel"
                  placeholder="Ex: Toyota Prius, Renault Clio..."
                  {...register('vehicleModel')}
                  disabled={isSubmitting}
                />
                {errors.vehicleModel && (
                  <p className="text-sm text-red-600">{errors.vehicleModel.message}</p>
                )}
              </div>

              {/* Type de véhicule */}
              <div className="space-y-2">
                <Label htmlFor="vehicleType">
                  Type de véhicule <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={vehicleType}
                  onValueChange={(value) => setValue('vehicleType', value as VehicleType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VEHICLE_TYPES) as VehicleType[]).map((type) => {
                      const vehicle = VEHICLE_TYPES[type];
                      return (
                        <SelectItem key={type} value={type}>
                          {vehicle.icon} {vehicle.label} - {vehicle.description}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.vehicleType && (
                  <p className="text-sm text-red-600">{errors.vehicleType.message}</p>
                )}
              </div>

              {/* Couleur du véhicule */}
              <div className="space-y-2">
                <Label htmlFor="vehicleColor">
                  Couleur du véhicule <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicleColor"
                  placeholder="Ex: Blanc, Noir, Gris..."
                  {...register('vehicleColor')}
                  disabled={isSubmitting}
                />
                {errors.vehicleColor && (
                  <p className="text-sm text-red-600">{errors.vehicleColor.message}</p>
                )}
              </div>

              {/* Numéro de permis */}
              <div className="space-y-2">
                <Label htmlFor="licenceNumber">
                  Numéro de permis <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="licenceNumber"
                  placeholder="Ex: 123456789"
                  {...register('licenceNumber')}
                  disabled={isSubmitting}
                />
                {errors.licenceNumber && (
                  <p className="text-sm text-red-600">{errors.licenceNumber.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Votre numéro de permis de conduire
                </p>
              </div>

              {/* Position GPS */}
              <div className="space-y-2">
                <Label>
                  Position GPS actuelle <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation || isSubmitting}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Obtention...
                      </>
                    ) : (
                      <>📍 Obtenir ma position</>
                    )}
                  </Button>
                </div>
                {currentLat && currentLng && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ Position enregistrée: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                    </p>
                  </div>
                )}
                {errors.currentLatitude && (
                  <p className="text-sm text-red-600">{errors.currentLatitude.message}</p>
                )}
                {errors.currentLongitude && (
                  <p className="text-sm text-red-600">{errors.currentLongitude.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Nous avons besoin de votre position pour vous connecter avec les passagers
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isGettingLocation}
                  className="flex-1"
                  size="lg"
                >
                  {isSubmitting ? 'Création en cours...' : 'Créer mon profil'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={isSubmitting}
                  size="lg"
                >
                  Annuler
                </Button>
              </div>
            </form>

            {/* Informations supplémentaires */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📝 Informations importantes</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Votre profil sera vérifié par notre équipe avant activation</li>
                <li>• Tous les champs sont obligatoires</li>
                <li>• Assurez-vous que votre permis de conduire est valide</li>
                <li>• Vous recevrez un email de confirmation une fois vérifié</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
