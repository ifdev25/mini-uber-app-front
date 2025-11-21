'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoadingUser } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Rediriger les utilisateurs connectés vers le dashboard
    if (isMounted && !isLoadingUser && isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isMounted, isAuthenticated, isLoadingUser, router]);

  // Afficher un loader pendant le montage initial uniquement
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Bandeau d'avertissement si le backend n'est pas disponible */}
      {isMounted && isLoadingUser && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-yellow-800 text-center">
              ⚠️ Impossible de se connecter au backend API. Les fonctionnalités de connexion seront limitées.
              <br />
              <span className="text-xs">Vérifiez que le backend tourne sur http://localhost:8000</span>
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Mini Uber
          </h1>
          <p className="text-xl text-gray-600">
            Votre service de transport simple et fiable
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="border-2 hover:border-blue-300 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <span className="text-4xl">👤</span>
                Je suis passager
              </CardTitle>
              <CardDescription className="text-base">
                Réservez une course en quelques clics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Réservation instantanée
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Suivi en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Prix transparents
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Chauffeurs vérifiés
                </li>
              </ul>
              <Link href={ROUTES.REGISTER} className="block">
                <Button className="w-full" size="lg">
                  Commencer maintenant
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-300 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <span className="text-4xl">🚗</span>
                Je suis chauffeur
              </CardTitle>
              <CardDescription className="text-base">
                Gagnez de l'argent en conduisant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Horaires flexibles
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Paiements sécurisés
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Tableau de bord complet
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Support 24/7
                </li>
              </ul>
              <Link href={ROUTES.REGISTER} className="block">
                <Button className="w-full" size="lg" variant="outline">
                  Devenir chauffeur
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">Vous avez déjà un compte ?</p>
          <Link href={ROUTES.LOGIN}>
            <Button size="lg" variant="outline">
              Se connecter
            </Button>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent className="text-left">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Inscrivez-vous</h4>
                    <p className="text-gray-600">Créez votre compte en quelques secondes</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Réservez ou conduisez</h4>
                    <p className="text-gray-600">Demandez une course ou acceptez des passagers</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Profitez !</h4>
                    <p className="text-gray-600">Suivez votre course en temps réel</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
