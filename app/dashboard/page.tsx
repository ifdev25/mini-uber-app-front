'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

function DashboardContent() {
  const { user, logout, isDriver, isPassenger } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              {isDriver && 'Tableau de bord chauffeur'}
              {isPassenger && 'Tableau de bord passager'}
            </p>
          </div>
          <Button onClick={logout} variant="outline">
            Déconnexion
          </Button>
        </div>

        {/* Bannière de vérification d'email */}
        {user && (
          <EmailVerificationBanner
            userEmail={user.email}
            isVerified={user.isVerified}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{user?.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Type de compte</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold capitalize">{user?.userType || 'Non défini'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{user?.rating} / 5</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Téléphone</span>
                <span className="font-medium">{user?.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Type d'utilisateur</span>
                <span className="font-medium capitalize">{user?.userType || 'Non défini'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Membre depuis</span>
                <span className="font-medium">
                  {(user?.createdAt || user?.created_at) ? new Date(user.createdAt || user.created_at!).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Non disponible'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isDriver && (
          <div className="mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Mode Chauffeur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 mb-4">
                  Accédez à votre tableau de bord chauffeur pour gérer vos courses et accepter de nouvelles demandes.
                </p>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => window.location.href = '/driver/dashboard'}
                >
                  🚗 Accéder au dashboard chauffeur
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isPassenger && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="default"
                    className="w-full h-24 flex flex-col gap-2"
                    onClick={() => window.location.href = '/passenger/book'}
                  >
                    <span className="text-2xl">🚗</span>
                    <span>Réserver une course</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-2"
                    onClick={() => window.location.href = '/passenger/history'}
                  >
                    <span className="text-2xl">📊</span>
                    <span>Historique des courses</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-2"
                    onClick={() => window.location.href = '/passenger/profile'}
                  >
                    <span className="text-2xl">👤</span>
                    <span>Mon profil</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-2"
                    onClick={() => window.location.href = '/'}
                  >
                    <span className="text-2xl">🏠</span>
                    <span>Page d'accueil</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardContent />
    </AuthGuard>
  );
}
