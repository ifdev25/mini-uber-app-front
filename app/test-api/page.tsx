'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

/**
 * Page de test temporaire pour vérifier la connexion à l'API
 * À SUPPRIMER en production
 */
export default function TestApiPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      // Test 1: Vérifier que l'API est accessible
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api`);

      // Si on reçoit une réponse (même 401), l'API est accessible
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setResult(`✅ Connexion à l'API réussie !\nStatut: ${response.status}\nRéponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        throw new Error('API non accessible ou format de réponse invalide');
      }
    } catch (err: any) {
      setError(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      // Test avec un compte de test
      const response = await api.login('john.doe@email.com', 'password123');
      setResult(`✅ Login réussi ! Token: ${response.token.substring(0, 20)}...`);

      // Récupérer le profil
      const user = await api.getMe();
      setResult(prev => prev + `\n✅ Profil récupéré: ${user.firstname} ${user.lastname} (${user.usertype})`);
    } catch (err: any) {
      setError(`❌ Erreur login: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = () => {
    api.clearToken();
    setResult('✅ Déconnexion réussie !');
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test de connexion API</h1>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Configuration</h2>
            <p className="text-sm text-gray-600">
              API URL: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_API_URL}</code>
            </p>
            <p className="text-sm text-gray-600">
              Mercure URL: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_MERCURE_URL}</code>
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={testConnection}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Test en cours...' : 'Tester la connexion à l\'API'}
            </button>

            <button
              onClick={testLogin}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Test en cours...' : 'Tester le login (john.doe@email.com)'}
            </button>

            <button
              onClick={testLogout}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Déconnexion
            </button>
          </div>

          {result && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded whitespace-pre-wrap">
              {result}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
              {error}
            </div>
          )}

          <div className="mt-8 pt-4 border-t">
            <h3 className="font-semibold mb-2">Comptes de test disponibles :</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Passager: john.doe@email.com / password123</li>
              <li>• Chauffeur 1: marie.martin@driver.com / driver123</li>
              <li>• Chauffeur 2: pierre.dubois@driver.com / driver123</li>
              <li>• Admin: admin@miniuber.com / admin123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
