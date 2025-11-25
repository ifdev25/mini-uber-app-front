# 🚗 Mini Uber - Frontend

Application web moderne de réservation de courses VTC (type Uber), construite avec **Next.js 16**, **React 19**, et **TypeScript**.

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [API Backend](#api-backend)
- [Contributeurs](#contributeurs)

---

## 🎯 Aperçu

**Mini Uber** est une application complète de réservation de courses VTC avec suivi en temps réel. Le frontend offre une interface intuitive pour les passagers et les chauffeurs avec :

- **Passagers** : Réservation de courses, suivi en temps réel, historique
- **Chauffeurs** : Gestion des courses, disponibilité, localisation GPS

## ✨ Fonctionnalités

### Pour les passagers 👤
- ✅ Inscription et connexion sécurisées (JWT)
- ✅ Vérification d'email avec code à 6 chiffres
- ✅ Recherche d'adresse avec autocomplétion (Nominatim OpenStreetMap)
- ✅ Calcul automatique de distance et prix
- ✅ Sélection du type de véhicule (Standard, Confort, Premium, SUV)
- ✅ Affichage des chauffeurs disponibles à proximité (rayon de 20 km)
- ✅ Suivi de course en temps réel sur carte interactive
- ✅ Historique des courses avec filtres et statuts
- ✅ Annulation de course (statut pending uniquement)

### Pour les chauffeurs 🚗
- ✅ Tableau de bord avec courses en attente
- ✅ Acceptation/refus de courses
- ✅ Mise à jour de disponibilité
- ✅ Gestion des statuts de course (en route, en cours, terminée)
- ✅ Vue de la course active avec informations passager

### Fonctionnalités techniques 🔧
- 🗺️ **Cartes interactives** avec Leaflet/React-Leaflet
- 📍 **Géolocalisation** en temps réel
- ⚡ **Polling automatique** pour le suivi des courses (5s)
- 🔄 **React Query** pour la gestion du cache et des états
- 📱 **Design responsive** avec Tailwind CSS 4
- 🎨 **Composants UI** avec Radix UI et shadcn/ui
- 🔐 **Authentification JWT** avec stockage sécurisé

---

## 🛠️ Technologies

### Core
- **Next.js 16** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript 5** - Typage statique
- **Tailwind CSS 4** - Styling utilitaire

### State Management & Data Fetching
- **TanStack React Query** - Gestion du cache et des requêtes
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation de schémas

### UI Components
- **Radix UI** - Composants accessibles
- **Lucide React** - Icônes
- **class-variance-authority** - Gestion des variants CSS

### Cartographie
- **Leaflet** - Bibliothèque de cartes interactive
- **React-Leaflet** - Intégration React pour Leaflet
- **OpenStreetMap** - Données cartographiques

---

## 📦 Prérequis

- **Node.js** >= 18.x
- **npm** ou **yarn** ou **pnpm**
- **Backend Mini Uber** (API Symfony) démarré sur `http://localhost:8000`

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/mini-uber-app-front.git
cd mini-uber-app-front
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Mercure Hub URL (optionnel - pour temps réel)
NEXT_PUBLIC_MERCURE_URL=http://localhost:3000/.well-known/mercure
```

### 4. Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuration

### Configuration des constantes

Modifiez `lib/constants.ts` pour personnaliser :

#### Centre de la carte par défaut
```typescript
export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lat: 36.365,   // Constantine, Algérie
    lng: 6.6147,
  },
  DEFAULT_ZOOM: 13,
};
```

#### Rayon de proximité des chauffeurs
Dans `app/passenger/book/page.tsx` :
```typescript
const PROXIMITY_RADIUS_KM = 20; // 20 km par défaut
```

#### Tarifs des véhicules
Dans `lib/constants.ts` :
```typescript
export const VEHICLE_TYPES = {
  standard: {
    pricePerKm: 1.00,
    basePrice: 2.50,
  },
  // ...
};
```

---

## 📖 Utilisation

### Inscription

1. Accédez à `/register`
2. Remplissez le formulaire (email, mot de passe, nom, prénom)
3. Sélectionnez votre type de compte (Passager ou Chauffeur)
4. Validez votre email avec le code à 6 chiffres reçu

### Réserver une course (Passager)

1. Connectez-vous avec vos identifiants
2. Allez sur `/passenger/book`
3. Définissez votre point de départ (clic carte ou recherche)
4. Définissez votre point d'arrivée
5. Sélectionnez le type de véhicule
6. Vérifiez l'estimation (distance, durée, prix)
7. Cliquez sur "Réserver cette course"
8. Suivez votre course en temps réel

### Accepter une course (Chauffeur)

1. Connectez-vous en tant que chauffeur
2. Allez sur `/driver/dashboard`
3. Consultez les courses en attente
4. Cliquez sur "Voir les détails"
5. Acceptez la course
6. Mettez à jour le statut au fur et à mesure

---

## 📁 Structure du projet

```
mini-uber-app-front/
├── app/                      # Pages Next.js (App Router)
│   ├── dashboard/            # Tableau de bord commun
│   ├── driver/               # Pages chauffeur
│   │   ├── dashboard/        # Dashboard chauffeur
│   │   └── ride/[id]/        # Détails course chauffeur
│   ├── login/                # Page de connexion
│   ├── passenger/            # Pages passager
│   │   ├── book/             # Réservation de course
│   │   ├── history/          # Historique des courses
│   │   └── ride/[id]/        # Suivi de course
│   ├── register/             # Page d'inscription
│   └── test-api/             # Page de test API
├── components/               # Composants réutilisables
│   ├── map/                  # Composants de carte
│   │   ├── AddressAutocomplete.tsx
│   │   ├── MapComponent.tsx
│   │   └── index.ts
│   └── ui/                   # Composants UI (shadcn)
├── hooks/                    # Custom hooks React
│   ├── useAuth.ts            # Hook d'authentification
│   └── useRides.ts           # Hooks pour les courses
├── lib/                      # Utilitaires et configuration
│   ├── api.ts                # Client API
│   ├── constants.ts          # Constantes globales
│   └── types.ts              # Types TypeScript
├── public/                   # Fichiers statiques
├── .env.local                # Variables d'environnement
├── API_ENDPOINTS.md          # Documentation des endpoints API
├── instructions.md           # Instructions de développement
└── README.md                 # Ce fichier
```

---

## 🔌 API Backend

Le frontend communique avec l'API Symfony via les endpoints suivants :

### Authentication
- `POST /api/login` - Connexion
- `POST /api/users` - Inscription
- `GET /api/me` - Profil utilisateur

### Courses
- `POST /api/rides` - Créer une course
- `GET /api/rides` - Liste des courses
- `GET /api/rides/{id}` - Détails d'une course
- `POST /api/rides/{id}/accept` - Accepter une course
- `PATCH /api/rides/{id}/status` - Modifier le statut

### Chauffeurs
- `GET /api/drivers` - Liste des chauffeurs
- `GET /api/drivers/{id}` - Détails d'un chauffeur
- `PATCH /api/drivers/location` - Mettre à jour la position
- `PATCH /api/drivers/availability` - Modifier la disponibilité

Consultez [API_ENDPOINTS.md](./API_ENDPOINTS.md) pour la documentation complète.

---

## 🧪 Scripts disponibles

```bash
# Développement
npm run dev        # Démarrer le serveur de dev (port 3000)

# Production
npm run build      # Build de production
npm start          # Démarrer le serveur de production

# Qualité du code
npm run lint       # Linter ESLint
```

---

## 🌟 Fonctionnalités à venir

- [ ] Notifications push en temps réel (WebSocket/Mercure)
- [ ] Système de paiement intégré
- [ ] Chat entre passager et chauffeur
- [ ] Historique détaillé avec factures PDF
- [ ] Mode sombre
- [ ] Support multilingue (i18n)
- [ ] Application mobile (React Native)

---

## 🤝 Contributeurs

- **IFWEBDEV** - Développeur principal

---

## 📄 Licence

Ce projet est sous licence MIT.

---

## 🐛 Rapport de bugs

Si vous rencontrez un problème, veuillez créer une issue sur GitHub avec :
- Description du problème
- Étapes pour reproduire
- Captures d'écran si applicable
- Environnement (OS, navigateur, version Node.js)

---

## 💡 Support

Pour toute question ou suggestion :
- 💬 GitHub Issues : [Issues](https://github.com/votre-username/mini-uber-app-front/issues)

---

**Made with ❤️ using Next.js and React**
