'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoadingUser, logout, refetch } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  // Initialiser le formulaire avec les données utilisateur
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      });
    }
  }, [user]);

  // Rediriger si non connecté ou pas un passager
  useEffect(() => {
    if (!isLoadingUser && (!user || user.userType !== 'passenger')) {
      router.push('/login');
    }
  }, [user, isLoadingUser, router]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await api.updateUser(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      // Rafraîchir les données utilisateur
      await refetch();
      setIsEditing(false);
      alert('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      });
    }
    setIsEditing(false);
  };

  // Déconnexion
  const handleLogout = () => {
    const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (confirmed) {
      logout();
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos informations personnelles
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/passenger/book')}>
          ← Retour
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Informations personnelles */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Informations personnelles</h2>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Prénom */}
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            {/* Nom */}
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="mt-1 bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Téléphone */}
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          {isEditing && (
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Annuler
              </Button>
            </div>
          )}
        </Card>

        {/* Statistiques */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {user.totalRides || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Courses totales</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">
                ⭐ {user.rating?.toFixed(1) || '5.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Note moyenne</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {user.isVerified ? '✓' : '✗'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {user.isVerified ? 'Vérifié' : 'Non vérifié'}
              </p>
            </div>
          </div>
        </Card>

        {/* Type de compte */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Type de compte</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="font-semibold">Passager</p>
              <p className="text-sm text-gray-600">
                Vous pouvez réserver des courses
              </p>
            </div>
          </div>
        </Card>

        {/* Actions du compte */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions du compte</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/passenger/history')}
            >
              📊 Voir l'historique des courses
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/passenger/book')}
            >
              🚗 Réserver une course
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              🚪 Se déconnecter
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
