'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/lib/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte Mini Uber
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoggingIn}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoggingIn}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-600">
            Pas encore de compte ?{' '}
            <Link href={ROUTES.REGISTER} className="text-blue-600 hover:text-blue-800 font-medium">
              S'inscrire
            </Link>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center mb-2">Comptes de test :</p>
            <div className="space-y-1 text-xs text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setEmail('john.doe@email.com');
                  setPassword('password123');
                }}
                className="w-full text-left hover:bg-gray-50 p-2 rounded"
              >
                Passager: john.doe@email.com
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('marie.martin@driver.com');
                  setPassword('driver123');
                }}
                className="w-full text-left hover:bg-gray-50 p-2 rounded"
              >
                Chauffeur: marie.martin@driver.com
              </button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
