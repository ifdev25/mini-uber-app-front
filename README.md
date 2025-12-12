# 🚗 Mini Uber - Application Frontend

Application web moderne de réservation de courses VTC construite avec **Next.js 16**, **React 19** et **TypeScript**.

## 🎯 Vue d'ensemble

Application complète de VTC avec suivi en temps réel, géolocalisation et gestion de courses pour passagers et chauffeurs.

### Fonctionnalités Passagers
- ✅ Inscription/connexion sécurisée avec vérification email (code 6 chiffres)
- ✅ Recherche d'adresse avec autocomplétion (OpenStreetMap)
- ✅ Calcul automatique de distance, durée et prix
- ✅ 4 types de véhicules (Standard, Confort, Premium, SUV)
- ✅ Liste des chauffeurs disponibles à proximité (20 km)
- ✅ Suivi de course en temps réel sur carte interactive
- ✅ Historique des courses avec filtres et statistiques
- ✅ Notation des chauffeurs après chaque course

### Fonctionnalités Chauffeurs
- ✅ Création de profil driver avec informations véhicule
- ✅ Tableau de bord avec courses en attente
- ✅ Acceptation/refus de courses
- ✅ Gestion de disponibilité (disponible/occupé)
- ✅ Mise à jour automatique de géolocalisation
- ✅ Gestion des statuts de course (acceptée → en route → en cours → terminée)
- ✅ Historique optimisé avec statistiques (gains, courses, note moyenne)

## 🛠️ Stack Technique

| Catégorie | Technologies |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| **State Management** | TanStack React Query (cache, mutations, polling) |
| **Styling** | Tailwind CSS 4 + Radix UI + shadcn/ui |
| **Cartographie** | Leaflet + React-Leaflet |
| **Formulaires** | React Hook Form + Zod |
| **Notifications** | React Hot Toast |
| **HTTP Client** | Fetch API (custom wrapper) |

## 📦 Installation

### Prérequis
- **Node.js** >= 18.x
- **Backend** Mini Uber (Symfony) sur `http://localhost:8080`

### Configuration

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/mini-uber-app-front.git
cd mini-uber-app-front

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Créer un fichier .env.local à la racine :
NEXT_PUBLIC_API_URL=http://localhost:8080

# 4. Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

## ⚙️ Configuration

### Constantes importantes

Fichier : `lib/constants.ts`

```typescript
// Configuration de la carte
MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 36.365, lng: 6.6147 }, // Constantine, Algérie
  DEFAULT_ZOOM: 13,
  PICKUP_MARKER_COLOR: 'green',
  DROPOFF_MARKER_COLOR: 'red'
}

// Tarifs des véhicules (€)
VEHICLE_TYPES = {
  standard: { pricePerKm: 1.00, basePrice: 2.50, label: 'Standard' },
  comfort:  { pricePerKm: 1.20, basePrice: 3.00, label: 'Confort' },
  premium:  { pricePerKm: 1.50, basePrice: 4.00, label: 'Premium' },
  suv:      { pricePerKm: 1.80, basePrice: 5.00, label: 'SUV' }
}

// Rayon de proximité pour les chauffeurs
PROXIMITY_RADIUS_KM = 20
```

## 📁 Structure du Projet

```
mini-uber-app-front/
├── app/                        # Pages Next.js (App Router)
│   ├── dashboard/              # Dashboard commun
│   ├── driver/                 # Pages chauffeur
│   │   ├── create-profile/     # Création profil driver
│   │   ├── dashboard/          # Dashboard avec courses en attente
│   │   ├── history/            # Historique optimisé (endpoint dédié)
│   │   └── ride/[id]/          # Gestion de course (statuts)
│   ├── passenger/              # Pages passager
│   │   ├── book/               # Réservation de course
│   │   ├── history/            # Historique avec filtres
│   │   ├── profile/            # Profil utilisateur
│   │   └── ride/[id]/          # Suivi temps réel + notation
│   ├── login/                  # Connexion
│   └── register/               # Inscription + vérification email
│
├── components/
│   ├── map/                    # Composants cartographie
│   │   ├── MapComponent.tsx    # Carte Leaflet
│   │   └── RouteMap.tsx        # Carte avec itinéraire
│   └── ui/                     # Composants shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── hooks/                      # Custom React Hooks
│   ├── useAuth.ts              # Authentification JWT
│   ├── useRides.ts             # CRUD courses (useRides, useDriverHistory)
│   ├── useRatings.ts           # Gestion notations
│   ├── useDriverLocation.ts    # Géolocalisation automatique
│   └── useApiMutation.ts       # Mutations API génériques
│
├── lib/                        # Utilitaires
│   ├── api.ts                  # Client API centralisé
│   ├── constants.ts            # Constantes globales
│   └── types.ts                # Types TypeScript
│
└── public/                     # Assets statiques
```

## 🔌 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/login` | Connexion utilisateur |
| POST | `/api/register` | Inscription + envoi code email |
| POST | `/api/verify-email` | Vérification code email |
| GET | `/api/me` | Profil utilisateur connecté |

### Courses
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/rides` | Créer une nouvelle course |
| GET | `/api/rides` | Liste courses (filtres: `passenger`, `driver`, `status`) |
| GET | `/api/rides/{id}` | Détails d'une course |
| POST | `/api/rides/{id}/accept` | Accepter une course (driver) |
| PATCH | `/api/rides/{id}/status` | Mettre à jour le statut |
| DELETE | `/api/rides/{id}` | Annuler une course |

### Chauffeurs
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/drivers` | Créer profil driver |
| GET | `/api/drivers` | Liste des chauffeurs |
| GET | `/api/drivers/{id}` | Détails chauffeur |
| GET | `/api/driver/history` | **Historique optimisé** (courses du driver connecté) |
| PATCH | `/api/drivers/location` | Mettre à jour position GPS |
| PATCH | `/api/drivers/availability` | Changer disponibilité |

### Notations
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/ratings` | Créer une notation |
| GET | `/api/ratings` | Liste des notations |

📖 **Documentation complète** : [FRONTEND_API_DOCUMENTATION.md](./FRONTEND_API_DOCUMENTATION.md)

## 🧪 Scripts NPM

```bash
npm run dev          # Serveur de développement (http://localhost:3000)
npm run build        # Build de production
npm start            # Démarrer le serveur de production
npm run lint         # Linter ESLint
npm run type-check   # Vérification TypeScript
```

## 🎯 Flux Utilisateur

### Parcours Passager

1. **Inscription**
   - Formulaire d'inscription
   - Réception code email (6 chiffres)
   - Vérification et activation du compte

2. **Réservation de course**
   - Saisie adresse départ (autocomplétion)
   - Saisie adresse arrivée (autocomplétion)
   - Sélection type de véhicule
   - Visualisation des chauffeurs disponibles à proximité
   - Confirmation et création de la course

3. **Suivi de course**
   - Polling automatique toutes les 3 secondes
   - Carte interactive avec position du driver
   - Statuts en temps réel (en attente → acceptée → en cours → terminée)

4. **Notation**
   - Formulaire de notation (1-5 étoiles)
   - Commentaire optionnel

### Parcours Chauffeur

1. **Inscription + Profil**
   - Inscription comme driver
   - Création profil véhicule (modèle, couleur, type, plaque)

2. **Disponibilité**
   - Activation géolocalisation automatique (mise à jour toutes les 5s)
   - Basculer entre disponible/occupé

3. **Gestion des courses**
   - Dashboard avec courses en attente
   - Acceptation d'une course
   - Mise à jour des statuts (en route → démarrage → terminée)

4. **Historique**
   - Statistiques (courses totales, gains, note moyenne)
   - Filtres par statut
   - Détails de chaque course

## 🚀 Fonctionnalités Avancées

### Polling Automatique
- **Suivi de course** : Polling toutes les 3s (arrêt automatique si terminée/annulée)
- **Dashboard driver** : Rafraîchissement toutes les 10s
- **Géolocalisation driver** : Mise à jour toutes les 5s quand disponible

### Gestion du Cache
- **React Query** pour le cache intelligent
- Invalidation automatique après mutations
- Optimistic updates pour meilleure UX

### Toast Notifications
- Notifications de succès/erreur avec **react-hot-toast**
- Messages contextuels pour toutes les actions

### Sécurité
- **JWT** stocké dans localStorage
- Refresh automatique du token
- Redirection automatique si non authentifié
- Protection des routes par rôle (passenger/driver)

## 📊 Calculs

### Distance et Durée
```typescript
// Formule de Haversine pour calcul de distance
function calculateDistance(lat1, lon1, lat2, lon2): number {
  // Retourne la distance en kilomètres
}

// Durée estimée
estimatedDuration = (distance / 40) * 60  // vitesse moyenne 40 km/h
```

### Prix
```typescript
price = vehicleType.basePrice + (distance * vehicleType.pricePerKm)
```

## 🐛 Débogage

### Problèmes courants

**1. Erreur "Network Error" au démarrage**
- Vérifier que le backend est démarré sur `http://localhost:8080`
- Vérifier la variable `NEXT_PUBLIC_API_URL` dans `.env.local`

**2. Carte ne s'affiche pas**
- Vérifier les dépendances Leaflet : `npm install leaflet react-leaflet`
- Vérifier le CSS Leaflet dans `layout.tsx`

**3. Géolocalisation ne fonctionne pas**
- Activer la localisation dans le navigateur
- Utiliser HTTPS en production (requis pour l'API Geolocation)

## 🤝 Contribution

Développé par **IFWEBDEV**

## 📄 Licence

MIT License

---

**Made with ❤️ using Next.js, React & TypeScript**
