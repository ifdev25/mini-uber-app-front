'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface EmailVerificationBannerProps {
  userEmail: string;
  isVerified?: boolean;
}

export default function EmailVerificationBanner({ userEmail, isVerified }: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  // Si l'email est vérifié ou si le bannière est fermée, ne rien afficher
  if (isVerified || !showBanner) return null;

  const handleResend = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Email de vérification renvoyé ! Vérifiez votre boîte mail.');
      } else {
        setMessage('❌ ' + (data.error || data.message || 'Erreur lors de l\'envoi'));
      }
    } catch (error) {
      setMessage('❌ Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Email non vérifié
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Votre email <strong>{userEmail}</strong> n'a pas encore été vérifié.
                Vérifiez votre boîte mail pour activer votre compte.
              </p>
            </div>
            {message && (
              <div className="mt-2 text-sm">
                <p className={message.includes('✅') ? 'text-green-700' : 'text-red-700'}>
                  {message}
                </p>
              </div>
            )}
            <div className="mt-3">
              <Button
                onClick={handleResend}
                disabled={loading}
                size="sm"
                variant="outline"
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300"
              >
                {loading ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
              </Button>
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
