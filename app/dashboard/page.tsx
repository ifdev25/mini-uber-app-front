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
              Bienvenue, {user?.firstname} {user?.lastname}
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
              <p className="text-xl font-semibold capitalize">{user?.usertype}</p>
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
                <span className="font-medium capitalize">{user?.usertype}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Membre depuis</span>
                <span className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
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
                <p className="text-blue-800">
                  Les fonctionnalités chauffeur seront disponibles dans la prochaine phase de développement.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {isPassenger && (
          <div className="mt-6">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">Mode Passager</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800">
                  Les fonctionnalités de réservation de course seront disponibles dans la prochaine phase de développement.
                </p>
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
