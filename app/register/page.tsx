'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROUTES, USER_TYPES } from '@/lib/constants';
import { UserType } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'passenger' as UserType,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { register, isRegistering, registerError, registerSuccess, registerData } = useAuth();

  // Rediriger vers la page de connexion après 5 secondes si l'inscription réussit
  useEffect(() => {
    if (registerSuccess && registerData) {
      const timer = setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [registerSuccess, registerData, router]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.firstName) {
      errors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName) {
      errors.lastName = 'Le nom est requis';
    }

    if (!formData.phone) {
      errors.phone = 'Le téléphone est requis';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    register(registerData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Inscription</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte Mini Uber
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {registerSuccess && registerData && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      ✅ Inscription réussie !
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>📧 Un email de vérification a été envoyé à <strong>{formData.email}</strong>.</p>
                      <p className="mt-1">Veuillez vérifier votre boîte mail pour activer votre compte.</p>
                    </div>
                    <p className="mt-3 text-xs text-green-600">
                      Redirection vers la page de connexion dans 5 secondes...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {registerError && !registerSuccess && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {registerError instanceof Error ? registerError.message : 'Erreur lors de l\'inscription'}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  disabled={isRegistering}
                />
                {validationErrors.firstName && (
                  <p className="text-xs text-red-600">{validationErrors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={isRegistering}
                />
                {validationErrors.lastName && (
                  <p className="text-xs text-red-600">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isRegistering}
              />
              {validationErrors.email && (
                <p className="text-xs text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33612345678"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={isRegistering}
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-600">{validationErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">Type de compte</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => handleChange('userType', value)}
                disabled={isRegistering}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">
                    <div className="flex items-center gap-2">
                      <span>{USER_TYPES.passenger.icon}</span>
                      <div>
                        <div className="font-medium">{USER_TYPES.passenger.label}</div>
                        <div className="text-xs text-gray-500">{USER_TYPES.passenger.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="driver">
                    <div className="flex items-center gap-2">
                      <span>{USER_TYPES.driver.icon}</span>
                      <div>
                        <div className="font-medium">{USER_TYPES.driver.label}</div>
                        <div className="text-xs text-gray-500">{USER_TYPES.driver.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={isRegistering}
              />
              {validationErrors.password && (
                <p className="text-xs text-red-600">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                disabled={isRegistering}
              />
              {validationErrors.confirmPassword && (
                <p className="text-xs text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isRegistering}
            >
              {isRegistering ? 'Inscription...' : 'S\'inscrire'}
            </Button>
          </CardContent>
        </form>

        <CardFooter>
          <div className="text-sm text-center text-gray-600 w-full">
            Vous avez déjà un compte ?{' '}
            <Link href={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-800 font-medium">
              Se connecter
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
