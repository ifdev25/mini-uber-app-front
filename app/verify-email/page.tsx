'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant');
      return;
    }

    // Vérifier l'email via l'API backend
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email vérifié avec succès');

          // Rediriger après 3 secondes
          setTimeout(() => {
            router.push(ROUTES.LOGIN);
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || data.message || 'Erreur lors de la vérification');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Vérification d'email</CardTitle>
          <CardDescription className="text-center">
            Validation de votre adresse email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Vérification en cours...</p>
              <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  Votre compte est maintenant activé. Vous pouvez vous connecter.
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Redirection vers la page de connexion...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h3>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-2">
                  {message.includes('expiré') && (
                    <>Le lien de vérification a expiré. Vous pouvez demander un nouveau lien depuis la page de connexion.</>
                  )}
                  {message.includes('invalide') && (
                    <>Le lien de vérification est invalide. Veuillez vérifier votre email ou demander un nouveau lien.</>
                  )}
                  {!message.includes('expiré') && !message.includes('invalide') && (
                    <>Une erreur s'est produite lors de la vérification de votre email.</>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => router.push(ROUTES.LOGIN)}
                  className="w-full"
                >
                  Retour à la connexion
                </Button>
                <Button
                  onClick={() => router.push(ROUTES.HOME)}
                  variant="outline"
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
