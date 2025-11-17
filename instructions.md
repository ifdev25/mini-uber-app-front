# 📱 Instructions Frontend Next.js - Mini Uber API

Ce document contient toutes les informations nécessaires pour développer le frontend Next.js de l'application Mini Uber.

---

## 📋 Table des matières

1. [Configuration Backend](#-configuration-backend)
2. [Authentification JWT](#-authentification-jwt)
3. [Endpoints API](#-endpoints-api)
4. [Notifications Temps Réel (Mercure)](#-notifications-temps-réel-mercure)
5. [Modèles de Données](#-modèles-de-données)
6. [Exemples Next.js](#-exemples-nextjs)
7. [Gestion des Erreurs](#-gestion-des-erreurs)
8. [Bonnes Pratiques](#-bonnes-pratiques)

---

## 🔧 Configuration Backend

### URLs de base

| Service | URL | Description |
|---------|-----|-------------|
| **API Backend** | `http://localhost:8000` | API REST principale |
| **Documentation API** | `http://localhost:8000/api` | Interface Swagger/API Platform |
| **Mercure Hub** | `http://localhost:3000/.well-known/mercure` | WebSocket temps réel |

### CORS

Le backend est configuré pour accepter les requêtes de `localhost` sur tous les ports. Vous pouvez lancer votre frontend Next.js sur n'importe quel port (3000, 3001, etc.).

### Démarrage du Backend

```bash
# Démarrer PostgreSQL et Mercure
docker compose up -d

# Démarrer le serveur Symfony
symfony server:start
# ou
php -S localhost:8000 -t public/
```

---

## 🔐 Authentification JWT

### 1. Inscription d'un utilisateur

**Endpoint :** `POST /api/users`

**Body :**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstname": "John",
  "lastname": "Doe",
  "phone": "+33612345678",
  "usertype": "passenger"  // "passenger" ou "driver"
}
```

**Réponse (201 Created) :**
```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/users/1",
  "@type": "User",
  "id": 1,
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "phone": "+33612345678",
  "usertype": "passenger",
  "rating": 5.0,
  "profilePictureUrl": null,
  "createdAt": "2025-01-17T10:30:00+00:00"
}
```

### 2. Connexion (Login)

**Endpoint :** `POST /api/login`

**Body :**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse (200 OK) :**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
}
```

### 3. Obtenir le profil utilisateur connecté

**Endpoint :** `GET /api/me`

**Headers :**
```
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
```

**Réponse (200 OK) :**
```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/users/1",
  "@type": "User",
  "id": 1,
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "usertype": "passenger",
  "rating": 5.0,
  "driver": null  // ou objet Driver si usertype="driver"
}
```

### 4. Comptes de test disponibles

Après avoir chargé les fixtures (`php bin/console doctrine:fixtures:load`) :

| Type | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@miniuber.com | admin123 |
| **Passager** | john.doe@email.com | password123 |
| **Chauffeur 1** | marie.martin@driver.com | driver123 |
| **Chauffeur 2** | pierre.dubois@driver.com | driver123 |

---

## 🛣️ Endpoints API

### Authentication & Users

#### POST /api/users (Inscription)
Créer un nouveau compte utilisateur.

#### POST /api/login (Connexion)
Obtenir un token JWT.

#### GET /api/me (Profil)
Récupérer les informations de l'utilisateur connecté.

**Authentification requise** ✅

#### GET /api/users
Liste tous les utilisateurs (paginée).

**Filtres :**
- `?usertype=passenger` ou `driver`
- `?email=john`
- `?rating[gte]=4.5`

#### GET /api/users/{id}
Détails d'un utilisateur spécifique.

#### PATCH /api/users/{id}
Mettre à jour un utilisateur.

**Authentification requise** ✅

---

### Rides (Courses)

#### POST /api/ride-estimates (Estimer une course)

**Body :**
```json
{
  "pickupLat": 48.8566,
  "pickupLng": 2.3522,
  "dropoffLat": 48.8606,
  "dropoffLng": 2.3376,
  "vehicleType": "standard"  // "standard", "premium", "suv"
}
```

**Réponse (200 OK) :**
```json
{
  "distance": 3.2,        // en km
  "duration": 15.5,       // en minutes
  "price": 12.80,         // en €
  "vehicleType": "standard"
}
```

**Pas d'authentification requise** ❌

---

#### POST /api/rides (Créer une course)

**Body :**
```json
{
  "pickupAddress": "123 Rue de Rivoli, Paris",
  "pickUpLatitude": 48.8566,
  "pickUpLongitude": 2.3522,
  "dropoffAddress": "Tour Eiffel, Paris",
  "dropoffLatitude": 48.8584,
  "dropoffLongitude": 2.2945,
  "vehiculeType": "standard"  // "standard", "premium", "suv"
}
```

**Réponse (201 Created) :**
```json
{
  "@context": "/api/contexts/Ride",
  "@id": "/api/rides/1",
  "@type": "Ride",
  "id": 1,
  "passenger": "/api/users/1",
  "driver": null,
  "pickupAddress": "123 Rue de Rivoli, Paris",
  "pickUpLatitude": 48.8566,
  "pickUpLongitude": 2.3522,
  "dropoffAddress": "Tour Eiffel, Paris",
  "dropoffLatitude": 48.8584,
  "dropoffLongitude": 2.2945,
  "status": "pending",
  "vehiculeType": "standard",
  "estimatedPrice": 12.50,
  "finalPrice": null,
  "estimatedDuration": 15.0,
  "estimatedDistance": 3.1,
  "createdAt": "2025-01-17T10:30:00+00:00",
  "startedAt": null,
  "completedAt": null
}
```

**Authentification requise** ✅ (Passager uniquement)

---

#### GET /api/rides
Liste toutes les courses (paginée).

**Filtres :**
- `?status=pending` - Statuts : `pending`, `accepted`, `in_progress`, `completed`, `cancelled`
- `?vehiculeType=premium`
- `?passenger=/api/users/1`
- `?driver=/api/users/2`
- `?estimatedPrice[gte]=10` - Prix minimum
- `?estimatedPrice[lte]=50` - Prix maximum
- `?order[createdAt]=desc` - Tri par date

**Exemples :**
```
GET /api/rides?status=pending&vehiculeType=standard
GET /api/rides?passenger=/api/users/1&order[createdAt]=desc
GET /api/rides?status=in_progress&driver=/api/users/5
```

**Authentification requise** ✅

---

#### GET /api/rides/{id}
Détails d'une course spécifique.

**Authentification requise** ✅

---

#### POST /api/rides/{id}/accept (Accepter une course)

**Body :**
```json
{}
```

**Validations automatiques :**
- ✅ L'utilisateur doit être un chauffeur vérifié
- ✅ Le chauffeur doit être disponible (`isAvailable = true`)
- ✅ Le type de véhicule du chauffeur doit correspondre
- ✅ La course doit être en statut `pending`

**Réponse (200 OK) :**
```json
{
  "@id": "/api/rides/1",
  "id": 1,
  "status": "accepted",
  "driver": "/api/users/5",
  ...
}
```

**Notifications envoyées :**
- Notification au passager : "Votre course a été acceptée par [Driver Name]"

**Authentification requise** ✅ (Chauffeur uniquement)

---

#### PATCH /api/rides/{id}/status (Changer le statut)

**Body :**
```json
{
  "status": "in_progress"  // ou "completed", "cancelled"
}
```

**Transitions valides :**
- `accepted` → `in_progress` (Chauffeur démarre la course)
- `in_progress` → `completed` (Chauffeur termine la course)
- `pending` → `cancelled` (Passager annule)
- `accepted` → `cancelled` (Chauffeur annule)

**Notifications envoyées :**
- `in_progress` : "Votre chauffeur a démarré la course"
- `completed` : "Course terminée ! Merci d'avoir utilisé Mini Uber"
- `cancelled` : "Course annulée"

**Authentification requise** ✅

---

### Drivers (Chauffeurs)

#### GET /api/drivers
Liste tous les chauffeurs (paginée).

**Filtres :**
- `?isAvailable=true` - Chauffeurs disponibles
- `?isVerified=true` - Chauffeurs vérifiés
- `?vehiculeType=premium`
- `?vehiculeModel=Tesla`
- `?rating[gte]=4.5`

**Exemple :**
```
GET /api/drivers?isAvailable=true&isVerified=true&vehiculeType=standard
```

---

#### GET /api/drivers/{id}
Détails d'un chauffeur spécifique.

**Réponse :**
```json
{
  "@context": "/api/contexts/Driver",
  "@id": "/api/drivers/1",
  "@type": "Driver",
  "id": 1,
  "user": {
    "@id": "/api/users/5",
    "id": 5,
    "firstname": "Marie",
    "lastname": "Martin",
    "email": "marie.martin@driver.com",
    "phone": "+33612345678",
    "rating": 4.8
  },
  "vehiculeModel": "Tesla Model 3",
  "vehiculeType": "premium",
  "vehiculeColor": "Noir",
  "vehiculePlateNumber": "AB-123-CD",
  "licenceNumber": "DL123456789",
  "isAvailable": true,
  "isVerified": true,
  "currentLatitude": 48.8566,
  "currentLongitude": 2.3522,
  "rating": 4.8,
  "totalRides": 156,
  "createdAt": "2024-01-15T08:00:00+00:00"
}
```

---

#### POST /api/drivers (Créer un profil chauffeur)

**Body :**
```json
{
  "user": "/api/users/1",
  "vehiculeModel": "Tesla Model 3",
  "vehiculeType": "premium",
  "vehiculeColor": "Noir",
  "vehiculePlateNumber": "AB-123-CD",
  "licenceNumber": "DL123456789",
  "currentLatitude": 48.8566,
  "currentLongitude": 2.3522
}
```

**Note :** L'utilisateur doit avoir `usertype = "driver"`.

**Authentification requise** ✅

---

#### PATCH /api/drivers/location (Mettre à jour la position)

**Body :**
```json
{
  "lat": 48.8566,
  "lng": 2.3522
}
```

**Utilisation :** Appeler régulièrement (toutes les 5-10 secondes) pendant qu'un chauffeur est en course pour mettre à jour sa position en temps réel.

**Authentification requise** ✅ (Chauffeur uniquement)

---

#### PATCH /api/drivers/availability (Changer la disponibilité)

**Body :**
```json
{
  "isAvailable": true  // ou false
}
```

**Utilisation :** Toggle pour que le chauffeur puisse se mettre disponible ou non.

**Authentification requise** ✅ (Chauffeur uniquement)

---

## 📡 Notifications Temps Réel (Mercure)

### Configuration

**URL du Hub Mercure :** `http://localhost:3000/.well-known/mercure`

### Topics disponibles

| Topic | Description | Abonnés |
|-------|-------------|---------|
| `users/{userId}` | Notifications pour un passager | Passagers |
| `drivers/{driverId}` | Notifications pour un chauffeur | Chauffeurs |
| `drivers/{driverId}/location` | Position GPS du chauffeur | Passager en course |

### Événements envoyés

#### Pour les passagers (`users/{userId}`)

| Type | Description | Data |
|------|-------------|------|
| `ride_accepted` | Un chauffeur a accepté la course | `{ rideId, driver: {...} }` |
| `ride_started` | Le chauffeur a démarré la course | `{ rideId }` |
| `ride_completed` | La course est terminée | `{ rideId, finalPrice }` |
| `ride_cancelled` | La course a été annulée | `{ rideId, reason }` |
| `driver_location` | Position du chauffeur (temps réel) | `{ lat, lng }` |

#### Pour les chauffeurs (`drivers/{driverId}`)

| Type | Description | Data |
|------|-------------|------|
| `new_ride` | Nouvelle course disponible | `{ rideId, pickup, dropoff, price }` |
| `ride_cancelled` | Le passager a annulé | `{ rideId }` |

### Exemple Next.js (Hook personnalisé)

```typescript
// hooks/useMercure.ts
import { useEffect, useState } from 'react';

interface MercureNotification {
  type: string;
  data: any;
}

export function useMercure(topic: string, token?: string) {
  const [notifications, setNotifications] = useState<MercureNotification[]>([]);
  const [lastNotification, setLastNotification] = useState<MercureNotification | null>(null);

  useEffect(() => {
    if (!topic) return;

    const url = new URL('http://localhost:3000/.well-known/mercure');
    url.searchParams.append('topic', topic);

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setLastNotification(notification);
      setNotifications((prev) => [...prev, notification]);
    };

    eventSource.onerror = (error) => {
      console.error('Mercure error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [topic]);

  return { notifications, lastNotification };
}
```

**Utilisation dans un composant :**

```typescript
// components/RideTracking.tsx
'use client';

import { useMercure } from '@/hooks/useMercure';
import { useEffect } from 'react';

export default function RideTracking({ userId }: { userId: number }) {
  const { lastNotification } = useMercure(`users/${userId}`);

  useEffect(() => {
    if (lastNotification) {
      switch (lastNotification.type) {
        case 'ride_accepted':
          console.log('Course acceptée!', lastNotification.data);
          // Afficher une notification
          break;
        case 'ride_started':
          console.log('Course démarrée!');
          break;
        case 'driver_location':
          // Mettre à jour la carte
          console.log('Position:', lastNotification.data);
          break;
      }
    }
  }, [lastNotification]);

  return <div>Tracking en cours...</div>;
}
```

---

## 📦 Modèles de Données

### User

```typescript
interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  usertype: 'passenger' | 'driver' | 'admin';
  rating: number;
  profilePictureUrl?: string;
  createdAt: string;
  driver?: Driver;  // Si usertype = "driver"
}
```

### Driver

```typescript
interface Driver {
  id: number;
  user: User;
  vehiculeModel: string;
  vehiculeType: 'standard' | 'premium' | 'suv';
  vehiculeColor: string;
  vehiculePlateNumber: string;
  licenceNumber: string;
  isAvailable: boolean;
  isVerified: boolean;
  currentLatitude: number;
  currentLongitude: number;
  rating: number;
  totalRides: number;
  createdAt: string;
}
```

### Ride

```typescript
interface Ride {
  id: number;
  passenger: User | string;  // Objet User ou IRI "/api/users/1"
  driver?: Driver | string;
  pickupAddress: string;
  pickUpLatitude: number;
  pickUpLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  vehiculeType: 'standard' | 'premium' | 'suv';
  estimatedPrice: number;
  finalPrice?: number;
  estimatedDuration: number;  // minutes
  estimatedDistance: number;  // km
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}
```

### RideEstimate

```typescript
interface RideEstimate {
  distance: number;   // km
  duration: number;   // minutes
  price: number;      // €
  vehicleType: 'standard' | 'premium' | 'suv';
}
```

---

## 💻 Exemples Next.js

### Configuration de l'API Client

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && !this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Une erreur est survenue');
    }

    return response.json();
  }

  // Auth
  async register(data: RegisterData) {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async getMe() {
    return this.request<User>('/api/me');
  }

  // Rides
  async estimateRide(data: EstimateRideData) {
    return this.request<RideEstimate>('/api/ride-estimates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createRide(data: CreateRideData) {
    return this.request<Ride>('/api/rides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRides(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters).toString();
    return this.request<{ 'hydra:member': Ride[] }>(
      `/api/rides${params ? `?${params}` : ''}`
    );
  }

  async getRide(id: number) {
    return this.request<Ride>(`/api/rides/${id}`);
  }

  async acceptRide(rideId: number) {
    return this.request<Ride>(`/api/rides/${rideId}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async updateRideStatus(rideId: number, status: string) {
    return this.request<Ride>(`/api/rides/${rideId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Drivers
  async getDrivers(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters).toString();
    return this.request<{ 'hydra:member': Driver[] }>(
      `/api/drivers${params ? `?${params}` : ''}`
    );
  }

  async updateDriverLocation(lat: number, lng: number) {
    return this.request<Driver>('/api/drivers/location', {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    });
  }

  async updateDriverAvailability(isAvailable: boolean) {
    return this.request<Driver>('/api/drivers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    });
  }
}

export const api = new ApiClient();
```

### Exemple de Page Login

```typescript
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Connexion</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
```

### Exemple de Page Création de Course

```typescript
// app/rides/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewRidePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickUpLatitude: 0,
    pickUpLongitude: 0,
    dropoffAddress: '',
    dropoffLatitude: 0,
    dropoffLongitude: 0,
    vehiculeType: 'standard',
  });
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const result = await api.estimateRide({
        pickupLat: formData.pickUpLatitude,
        pickupLng: formData.pickUpLongitude,
        dropoffLat: formData.dropoffLatitude,
        dropoffLng: formData.dropoffLongitude,
        vehicleType: formData.vehiculeType,
      });
      setEstimate(result);
    } catch (error) {
      console.error('Erreur estimation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const ride = await api.createRide(formData);
      router.push(`/rides/${ride.id}`);
    } catch (error) {
      console.error('Erreur création course:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Nouvelle course</h1>

      {/* Formulaire */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Adresse de départ</label>
          <input
            type="text"
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Adresse d'arrivée</label>
          <input
            type="text"
            value={formData.dropoffAddress}
            onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Type de véhicule</label>
          <select
            value={formData.vehiculeType}
            onChange={(e) => setFormData({ ...formData, vehiculeType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="standard">Standard (1.00€/km)</option>
            <option value="premium">Premium (1.50€/km)</option>
            <option value="suv">SUV (2.00€/km)</option>
          </select>
        </div>

        <button
          onClick={handleEstimate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Estimer le prix
        </button>
      </div>

      {/* Estimation */}
      {estimate && (
        <div className="bg-gray-100 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Estimation</h2>
          <div className="space-y-2">
            <p>Distance: <strong>{estimate.distance} km</strong></p>
            <p>Durée: <strong>{estimate.duration} min</strong></p>
            <p className="text-2xl">Prix: <strong>{estimate.price}€</strong></p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
          >
            Confirmer la course
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Gestion des Erreurs

### Format des erreurs API

```json
{
  "@context": "/api/contexts/Error",
  "@type": "hydra:Error",
  "hydra:title": "An error occurred",
  "hydra:description": "Invalid credentials.",
  "violations": [
    {
      "propertyPath": "email",
      "message": "This value should be a valid email."
    }
  ]
}
```

### Codes HTTP

| Code | Signification | Action |
|------|---------------|--------|
| **200** | OK | Requête réussie |
| **201** | Created | Ressource créée |
| **400** | Bad Request | Données invalides |
| **401** | Unauthorized | Token manquant ou invalide |
| **403** | Forbidden | Accès refusé |
| **404** | Not Found | Ressource introuvable |
| **422** | Unprocessable Entity | Validation échouée |
| **500** | Internal Server Error | Erreur serveur |

### Exemple de gestion d'erreurs

```typescript
try {
  const ride = await api.createRide(data);
} catch (error: any) {
  if (error.message.includes('401')) {
    // Token expiré, rediriger vers login
    router.push('/login');
  } else if (error.message.includes('422')) {
    // Erreur de validation
    setValidationErrors(error.violations);
  } else {
    // Erreur générique
    setError('Une erreur est survenue');
  }
}
```

---

## ✅ Bonnes Pratiques

### 1. Authentification

- Stocker le token JWT dans `localStorage` ou `httpOnly cookie`
- Vérifier l'expiration du token (durée: 1 heure par défaut)
- Rediriger vers `/login` si le token est expiré
- Implémenter un refresh token pour les sessions longues

### 2. Gestion d'état

- Utiliser **React Query** ou **SWR** pour le cache et les requêtes
- Exemple avec React Query:

```typescript
import { useQuery } from '@tanstack/react-query';

function useRide(rideId: number) {
  return useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => api.getRide(rideId),
    refetchInterval: 5000, // Rafraîchir toutes les 5s
  });
}
```

### 3. Mercure / Temps Réel

- S'abonner aux topics Mercure uniquement quand nécessaire
- Fermer les EventSource quand le composant est démonté
- Combiner Mercure avec React Query pour la synchronisation

### 4. Géolocalisation

- Utiliser l'API Geolocation du navigateur:

```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Utiliser les coordonnées
  },
  (error) => {
    console.error('Erreur géolocalisation:', error);
  }
);
```

- Mettre à jour la position du chauffeur toutes les 5-10 secondes pendant une course
- Utiliser une bibliothèque comme **React-Leaflet** ou **Google Maps** pour afficher la carte

### 5. Types de véhicules

```typescript
const VEHICLE_TYPES = {
  standard: {
    label: 'Standard',
    pricePerKm: 1.00,
    basePrice: 2.50,
    icon: '🚗',
  },
  premium: {
    label: 'Premium',
    pricePerKm: 1.50,
    basePrice: 5.00,
    icon: '🚙',
  },
  suv: {
    label: 'SUV',
    pricePerKm: 2.00,
    basePrice: 7.00,
    icon: '🚙',
  },
};
```

### 6. Statuts des courses

```typescript
const RIDE_STATUS = {
  pending: {
    label: 'En attente',
    color: 'yellow',
    icon: '⏳',
  },
  accepted: {
    label: 'Acceptée',
    color: 'blue',
    icon: '✅',
  },
  in_progress: {
    label: 'En cours',
    color: 'green',
    icon: '🚗',
  },
  completed: {
    label: 'Terminée',
    color: 'gray',
    icon: '🏁',
  },
  cancelled: {
    label: 'Annulée',
    color: 'red',
    icon: '❌',
  },
};
```

### 7. Environment Variables (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MERCURE_URL=http://localhost:3000/.well-known/mercure
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

---

## 🎯 Fonctionnalités recommandées pour le Frontend

### Passager

1. **Page d'accueil**
   - Carte interactive
   - Sélection départ/arrivée (avec autocomplete)
   - Estimation de prix en temps réel
   - Choix du type de véhicule

2. **Création de course**
   - Formulaire de course
   - Confirmation avec estimation
   - Recherche de chauffeur (loading)

3. **Suivi de course**
   - Carte avec position du chauffeur en temps réel
   - Informations chauffeur (nom, photo, véhicule, rating)
   - Temps d'arrivée estimé
   - Bouton annuler (si `status = pending` ou `accepted`)

4. **Historique**
   - Liste des courses passées
   - Détails de chaque course
   - Option de notation/commentaire

5. **Profil**
   - Informations personnelles
   - Moyens de paiement
   - Paramètres

### Chauffeur

1. **Dashboard**
   - Toggle disponibilité
   - Statistiques (courses du jour, revenus, rating)
   - Liste des courses en attente

2. **Courses disponibles**
   - Liste des courses `pending` correspondant au véhicule
   - Détails (départ, arrivée, prix, distance)
   - Bouton accepter

3. **Course en cours**
   - Carte avec itinéraire
   - Informations passager
   - Boutons: "Démarrer la course", "Terminer la course"
   - Mise à jour automatique de la position

4. **Historique**
   - Courses terminées
   - Revenus

---

## 🗺️ Intégration Google Maps (Recommandé)

### Installation

```bash
npm install @react-google-maps/api
```

### Exemple de carte

```typescript
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

export default function Map({ center }: { center: { lat: number; lng: number } }) {
  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '400px' }}
        center={center}
        zoom={13}
      >
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
}
```

### Autocomplete adresses

```typescript
import { Autocomplete } from '@react-google-maps/api';

export default function AddressInput() {
  const [autocomplete, setAutocomplete] = useState<any>(null);

  const onLoad = (autocomplete: any) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const location = place.geometry.location;
      console.log('Latitude:', location.lat());
      console.log('Longitude:', location.lng());
    }
  };

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <input
        type="text"
        placeholder="Entrez une adresse"
        className="w-full px-3 py-2 border rounded-lg"
      />
    </Autocomplete>
  );
}
```

---

## 📞 Support

Si vous avez des questions sur l'intégration du backend :

- Consultez la documentation Swagger: `http://localhost:8000/api`
- Vérifiez les logs Symfony: `var/log/dev.log`
- Testez les endpoints directement dans Swagger UI

---

**Bon développement ! 🚀**
