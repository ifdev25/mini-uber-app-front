# 🚗 Mini Uber - Frontend

Application web de réservation de courses VTC (type Uber) construite avec Next.js 16, React 19 et TypeScript.

## 🎯 Aperçu

Application complète de VTC avec suivi en temps réel pour passagers et chauffeurs.

**Passagers** : Réservation de courses, suivi GPS en temps réel, historique et notation des chauffeurs

**Chauffeurs** : Gestion des courses, disponibilité, localisation GPS automatique

## ✨ Fonctionnalités

### Passagers
- Inscription/connexion sécurisée avec vérification email (code à 6 chiffres)
- Recherche d'adresse avec autocomplétion (OpenStreetMap)
- Calcul automatique de distance et prix
- Sélection du type de véhicule (Standard, Confort, Premium, SUV)
- Chauffeurs disponibles à proximité (rayon 20 km)
- Suivi de course en temps réel sur carte interactive
- Historique des courses avec filtres
- Notation des chauffeurs après chaque course

### Chauffeurs
- Création de profil driver avec véhicule
- Tableau de bord avec courses en attente
- Acceptation/refus de courses
- Mise à jour de disponibilité
- Gestion des statuts (en route, en cours, terminée)
- Géolocalisation automatique
- Historique des courses et statistiques

### Technique
- Cartes interactives (Leaflet/React-Leaflet)
- Géolocalisation temps réel
- Polling automatique (3s pour suivi de course)
- React Query pour cache et états
- Design responsive (Tailwind CSS 4)
- Composants UI (Radix UI/shadcn)
- Authentification JWT

## 🛠️ Stack Technique

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **TanStack React Query** - Gestion cache/requêtes
- **Tailwind CSS 4** + **Radix UI** - Styling/composants
- **Leaflet** + **React-Leaflet** - Cartographie
- **React Hook Form** + **Zod** - Formulaires/validation

## 📦 Installation

### Prérequis
- Node.js >= 18.x
- Backend Mini Uber (Symfony) sur `http://localhost:8080`

### Setup

```bash
# 1. Cloner le repo
git clone https://github.com/votre-username/mini-uber-app-front.git
cd mini-uber-app-front

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
# Créer .env.local avec :
NEXT_PUBLIC_API_URL=http://localhost:8080

# 4. Démarrer le serveur
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Constantes importantes (lib/constants.ts)

```typescript
// Centre de la carte par défaut
MAP_CONFIG.DEFAULT_CENTER = { lat: 36.365, lng: 6.6147 } // Constantine

// Tarifs des véhicules
VEHICLE_TYPES = {
  standard: { pricePerKm: 1.00, basePrice: 2.50 },
  comfort: { pricePerKm: 1.20, basePrice: 3.00 },
  premium: { pricePerKm: 1.50, basePrice: 4.00 },
  suv: { pricePerKm: 1.80, basePrice: 5.00 }
}
```

### Rayon de proximité (app/passenger/book/page.tsx)
```typescript
const PROXIMITY_RADIUS_KM = 20; // Chauffeurs à moins de 20 km
```

## 📁 Structure

```
app/
├── dashboard/          # Dashboard commun
├── driver/             # Pages chauffeur
│   ├── create-profile/ # Création profil driver
│   ├── dashboard/      # Dashboard chauffeur
│   ├── history/        # Historique courses
│   └── ride/[id]/      # Détails course
├── passenger/          # Pages passager
│   ├── book/           # Réservation
│   ├── history/        # Historique
│   ├── profile/        # Profil
│   └── ride/[id]/      # Suivi + notation
├── login/              # Connexion
└── register/           # Inscription

components/
├── map/                # Composants carte
└── ui/                 # Composants shadcn

hooks/
├── useAuth.ts          # Authentification
├── useRides.ts         # Courses
├── useMyRides.ts       # Historique utilisateur
├── useRatings.ts       # Notations
└── useDriverLocation.ts # Géolocalisation driver

lib/
├── api.ts              # Client API
├── constants.ts        # Constantes
└── types.ts            # Types TypeScript
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - Connexion
- `POST /api/register` - Inscription
- `GET /api/me` - Profil utilisateur

### Courses
- `POST /api/rides` - Créer course
- `GET /api/rides` - Liste courses (filtres: passenger, driver, status)
- `GET /api/rides/{id}` - Détails course
- `GET /api/my/rides` - Mes courses (auto-filtré par JWT)
- `POST /api/rides/{id}/accept` - Accepter course
- `PATCH /api/rides/{id}/status` - Modifier statut

### Chauffeurs
- `POST /api/drivers` - Créer profil driver
- `GET /api/drivers` - Liste chauffeurs
- `GET /api/drivers/{id}` - Détails chauffeur
- `PATCH /api/drivers/location` - Mettre à jour position
- `PATCH /api/drivers/availability` - Modifier disponibilité

### Notations
- `POST /api/ratings` - Créer notation
- `GET /api/ratings` - Liste notations

Documentation complète : [API_ENDPOINTS.md](./API_ENDPOINTS.md)

## 🧪 Scripts

```bash
npm run dev    # Développement (port 3000)
npm run build  # Build production
npm start      # Serveur production
npm run lint   # Linter ESLint
```

## 🎯 Workflow Utilisateur

### Passager
1. Inscription → Vérification email → Connexion
2. Réservation : Saisie départ/arrivée → Choix véhicule → Confirmation
3. Suivi temps réel de la course sur carte
4. Notation du chauffeur après la course

### Chauffeur
1. Inscription → Vérification email → Création profil driver
2. Activation disponibilité → Réception courses
3. Acceptation course → Mise à jour statuts
4. Géolocalisation automatique pendant la course

## 🤝 Contributeur

**IFWEBDEV** - Développeur principal

## 📄 Licence

MIT License

---

**Made with Next.js & React**
