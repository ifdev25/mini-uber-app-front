# Plan de Développement Frontend - Mini Uber App

## Vue d'ensemble
Application web Next.js avec TypeScript, Shadcn UI et Leaflet pour gérer les courses de type Uber.

**Stack technique :**
- Next.js 14+ (App Router)
- TypeScript
- Shadcn UI (déjà installé)
- Leaflet (pour les cartes)
- React Query (pour la gestion du cache et des requêtes)
- Mercure (WebSocket pour le temps réel)

---

## ⚠️ MÉTHODOLOGIE IMPORTANTE

**Pour chaque fonctionnalité implémentée, nous utiliserons systématiquement les documentations officielles :**

### Documentations de référence

1. **Next.js Documentation**
   - URL : https://nextjs.org/docs
   - À consulter pour : App Router, Server/Client Components, Routing, API Routes, Middleware, Image Optimization, etc.
   - Sections clés :
     - [Getting Started](https://nextjs.org/docs/getting-started)
     - [App Router](https://nextjs.org/docs/app)
     - [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
     - [Server & Client Components](https://nextjs.org/docs/app/building-your-application/rendering)

2. **Shadcn UI Documentation**
   - URL : https://ui.shadcn.com/docs
   - À consulter pour : Installation des composants, Customisation, Theming, Accessibilité
   - Sections clés :
     - [Installation](https://ui.shadcn.com/docs/installation/next)
     - [Components](https://ui.shadcn.com/docs/components)
     - [Theming](https://ui.shadcn.com/docs/theming)
     - [CLI](https://ui.shadcn.com/docs/cli)

3. **Leaflet Documentation**
   - URL : https://leafletjs.com/reference.html
   - À consulter pour : Maps, Markers, Popups, Layers, Events
   - Sections clés :
     - [Quick Start Guide](https://leafletjs.com/examples/quick-start/)
     - [Tutorials](https://leafletjs.com/examples.html)
     - [API Reference](https://leafletjs.com/reference.html)

4. **React-Leaflet Documentation**
   - URL : https://react-leaflet.js.org/docs/start-introduction
   - À consulter pour : Intégration React, Composants, Hooks
   - Sections clés :
     - [Getting Started](https://react-leaflet.js.org/docs/start-introduction)
     - [Core API](https://react-leaflet.js.org/docs/api-map)

5. **TanStack Query (React Query) Documentation**
   - URL : https://tanstack.com/query/latest/docs/framework/react/overview
   - À consulter pour : Queries, Mutations, Caching, Optimistic Updates

### Processus de développement

**Pour chaque feature/composant :**

1. ✅ **Consulter la documentation officielle** en premier
2. ✅ **Suivre les best practices** recommandées
3. ✅ **Utiliser les exemples officiels** comme base
4. ✅ **Vérifier les dernières versions** et breaking changes
5. ✅ **Respecter les conventions** de chaque framework/library

### Exemples d'application

**Exemple 1 : Créer une page Next.js**
- Consulter : https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
- Vérifier si c'est un Server ou Client Component
- Suivre la structure recommandée

**Exemple 2 : Ajouter un composant Shadcn UI**
- Consulter : https://ui.shadcn.com/docs/components/[nom-du-composant]
- Utiliser la CLI : `npx shadcn-ui@latest add [component-name]`
- Respecter les props et l'API du composant

**Exemple 3 : Créer une carte Leaflet**
- Consulter : https://react-leaflet.js.org/docs/example-basic
- Vérifier que le composant est marqué 'use client'
- Suivre les exemples d'intégration React

---

## Phase 1 : Configuration & Infrastructure

### 1.1 Configuration de base
**Fichiers à créer :**
- `.env.local` - Variables d'environnement
- `lib/api.ts` - Client API avec gestion du JWT
- `lib/types.ts` - Types TypeScript (User, Ride, Driver, etc.)
- `lib/constants.ts` - Constantes (statuts, types de véhicules, etc.)
- `lib/utils/validators.ts` - Validateurs de formulaires

**Dépendances à installer :**
```bash
npm install @tanstack/react-query leaflet react-leaflet
npm install -D @types/leaflet
```

**Tâches :**
- [ ] Créer les variables d'environnement
- [ ] Créer le client API avec gestion JWT
- [ ] Définir tous les types TypeScript
- [ ] Créer les constantes pour les statuts et types de véhicules

---

## Phase 2 : Authentification

### 2.1 Page d'inscription - `/register`
**Fichier :** `app/register/page.tsx`

**Composants à créer :**
- `components/auth/RegisterForm.tsx` - Formulaire d'inscription
- `components/ui/input.tsx` (Shadcn)
- `components/ui/button.tsx` (Shadcn)
- `components/ui/select.tsx` (Shadcn)
- `components/ui/alert.tsx` (Shadcn)

**Fonctionnalités :**
- Formulaire avec validation (email, password, firstname, lastname, phone)
- Choix du type d'utilisateur (passager/chauffeur)
- Gestion des erreurs (violations API)
- Redirection vers `/login` après succès

**Champs du formulaire :**
- Email (obligatoire, format email)
- Mot de passe (obligatoire, min 6 caractères)
- Prénom (obligatoire)
- Nom (obligatoire)
- Téléphone (obligatoire, format international)
- Type d'utilisateur (passager ou chauffeur)

**Endpoint API utilisé :**
- `POST /api/users`

---

### 2.2 Page de connexion - `/login`
**Fichier :** `app/login/page.tsx`

**Composants à créer :**
- `components/auth/LoginForm.tsx` - Formulaire de connexion

**Fonctionnalités :**
- Formulaire email + password
- Stockage du JWT dans localStorage
- Redirection vers `/dashboard` après connexion
- Affichage des erreurs

**Champs du formulaire :**
- Email
- Mot de passe

**Endpoint API utilisé :**
- `POST /api/login`

---

### 2.3 Middleware & Protection des routes
**Fichiers à créer :**
- `middleware.ts` - Protection des routes authentifiées
- `hooks/useAuth.ts` - Hook pour récupérer l'utilisateur connecté
- `contexts/AuthContext.tsx` - Context pour l'authentification globale

**Fonctionnalités :**
- Vérifier la présence du token JWT
- Récupérer le profil utilisateur (`GET /api/me`)
- Rediriger vers `/login` si non authentifié
- Stocker les infos utilisateur dans un context React

**Routes protégées :**
- `/dashboard/*`
- `/rides/*`
- `/profile/*`

---

## Phase 3 : Layout & Navigation

### 3.1 Layout principal
**Fichier :** `components/layout/MainLayout.tsx`

**Composants à créer :**
- `components/layout/Navbar.tsx` - Barre de navigation
- `components/layout/Sidebar.tsx` - Menu latéral (desktop)
- `components/layout/MobileMenu.tsx` - Menu mobile
- `components/ui/avatar.tsx` (Shadcn)
- `components/ui/dropdown-menu.tsx` (Shadcn)

**Fonctionnalités :**
- Navigation différente selon le type d'utilisateur (passager/chauffeur)
- Menu utilisateur (profil, paramètres, déconnexion)
- Design responsive

**Navigation Passager :**
- Accueil / Nouvelle course
- Mes courses
- Historique
- Profil

**Navigation Chauffeur :**
- Dashboard
- Courses disponibles
- Course en cours
- Historique
- Profil

---

## Phase 4 : Pages Passager

### 4.1 Page d'accueil - `/` (Nouvelle course)
**Fichier :** `app/page.tsx`

**Composants à créer :**
- `components/ride/NewRideForm.tsx` - Formulaire de création de course
- `components/map/MapPicker.tsx` - Carte interactive Leaflet
- `components/ride/RideEstimateCard.tsx` - Affichage de l'estimation
- `components/ride/VehicleTypeSelector.tsx` - Sélecteur de type de véhicule

**Fonctionnalités :**
- Carte Leaflet centrée sur la position de l'utilisateur
- Input avec autocomplete pour adresse de départ (avec géocodage)
- Input avec autocomplete pour adresse d'arrivée
- Sélecteur de type de véhicule (standard/premium/suv)
- Bouton "Estimer le prix"
- Affichage de l'estimation (distance, durée, prix)
- Bouton "Confirmer la course"

**Endpoints API utilisés :**
- `POST /api/ride-estimates` (estimation)
- `POST /api/rides` (création)

**Librairies nécessaires :**
- `leaflet` pour la carte
- `react-leaflet` pour l'intégration React
- Service de géocodage (Nominatim ou Google Maps API)

---

### 4.2 Page de recherche de chauffeur - `/rides/[id]/searching`
**Fichier :** `app/rides/[id]/searching/page.tsx`

**Composants à créer :**
- `components/ride/SearchingDriver.tsx` - Animation de recherche
- `components/ui/spinner.tsx` - Spinner de chargement

**Fonctionnalités :**
- Animation de chargement
- Écoute en temps réel via Mercure (topic `users/{userId}`)
- Redirection automatique vers `/rides/[id]/tracking` quand acceptée
- Bouton "Annuler la course"

**Événements Mercure écoutés :**
- `ride_accepted` → Redirection vers tracking

**Endpoints API utilisés :**
- `GET /api/rides/{id}` (polling toutes les 3-5s ou via Mercure)
- `PATCH /api/rides/{id}/status` (pour annuler)

---

### 4.3 Page de suivi de course - `/rides/[id]/tracking`
**Fichier :** `app/rides/[id]/tracking/page.tsx`

**Composants à créer :**
- `components/ride/RideTracking.tsx` - Suivi de la course
- `components/map/LiveMap.tsx` - Carte avec position du chauffeur en temps réel
- `components/ride/DriverCard.tsx` - Infos du chauffeur
- `components/ride/RideStatus.tsx` - Statut de la course

**Fonctionnalités :**
- Carte Leaflet affichant :
  - Marker de départ (pickup)
  - Marker d'arrivée (dropoff)
  - Marker du chauffeur (position en temps réel)
  - Itinéraire tracé entre les points
- Informations du chauffeur :
  - Photo de profil
  - Nom complet
  - Note (rating)
  - Modèle de véhicule
  - Plaque d'immatriculation
  - Couleur du véhicule
- Statut de la course (acceptée, en cours, terminée)
- Temps d'arrivée estimé
- Bouton "Annuler" (si status = accepted)
- Mise à jour en temps réel via Mercure

**Événements Mercure écoutés :**
- `ride_started` → Mise à jour du statut
- `ride_completed` → Redirection vers page de résumé
- `ride_cancelled` → Redirection vers accueil
- `driver_location` → Mise à jour du marker du chauffeur

**Endpoints API utilisés :**
- `GET /api/rides/{id}` (données initiales)
- Mercure topic `users/{userId}` (temps réel)

---

### 4.4 Page de résumé de course - `/rides/[id]/summary`
**Fichier :** `app/rides/[id]/summary/page.tsx`

**Composants à créer :**
- `components/ride/RideSummary.tsx` - Résumé de la course
- `components/ride/RatingForm.tsx` - Formulaire de notation

**Fonctionnalités :**
- Affichage du récapitulatif :
  - Adresse de départ et d'arrivée
  - Distance parcourue
  - Durée réelle
  - Prix final
  - Informations du chauffeur
- Formulaire de notation (1-5 étoiles)
- Bouton "Retour à l'accueil"

**Endpoints API utilisés :**
- `GET /api/rides/{id}`

---

### 4.5 Page de mes courses - `/rides`
**Fichier :** `app/rides/page.tsx`

**Composants à créer :**
- `components/ride/RideList.tsx` - Liste des courses
- `components/ride/RideCard.tsx` - Card d'une course
- `components/ui/badge.tsx` (Shadcn) - Badge pour les statuts
- `components/ui/tabs.tsx` (Shadcn) - Filtres par statut

**Fonctionnalités :**
- Onglets pour filtrer par statut :
  - En cours (pending, accepted, in_progress)
  - Terminées (completed)
  - Annulées (cancelled)
- Liste des courses avec :
  - Date et heure
  - Départ et arrivée
  - Statut
  - Prix
  - Chauffeur (si assigné)
- Clic sur une course → Redirection vers la page de détails

**Endpoints API utilisés :**
- `GET /api/rides?passenger=/api/users/{userId}&order[createdAt]=desc`
- Filtres par statut

---

### 4.6 Page de profil passager - `/profile`
**Fichier :** `app/profile/page.tsx`

**Composants à créer :**
- `components/profile/ProfileForm.tsx` - Formulaire de profil
- `components/profile/StatsCard.tsx` - Statistiques utilisateur

**Fonctionnalités :**
- Affichage et édition des informations :
  - Photo de profil
  - Prénom, nom
  - Email
  - Téléphone
  - Note moyenne
- Statistiques :
  - Nombre total de courses
  - Note moyenne
  - Montant total dépensé
- Bouton "Modifier le profil"
- Bouton "Changer le mot de passe"

**Endpoints API utilisés :**
- `GET /api/me`
- `PATCH /api/users/{id}`

---

## Phase 5 : Pages Chauffeur

### 5.1 Dashboard chauffeur - `/dashboard`
**Fichier :** `app/dashboard/page.tsx`

**Composants à créer :**
- `components/driver/DashboardStats.tsx` - Statistiques du jour
- `components/driver/AvailabilityToggle.tsx` - Toggle disponibilité
- `components/driver/PendingRidesList.tsx` - Courses en attente
- `components/ui/switch.tsx` (Shadcn) - Toggle switch
- `components/ui/card.tsx` (Shadcn) - Cards pour les stats

**Fonctionnalités :**
- Toggle "Disponible / Non disponible" :
  - Active/désactive la réception de nouvelles courses
  - Appelle l'API pour mettre à jour `isAvailable`
- Statistiques du jour :
  - Nombre de courses effectuées
  - Revenus du jour
  - Note moyenne
  - Temps de conduite total
- Liste des courses en attente (status = pending) :
  - Filtrées par type de véhicule du chauffeur
  - Affichage des détails (départ, arrivée, prix, distance)
  - Bouton "Accepter"
- Notifications en temps réel des nouvelles courses (Mercure)

**Événements Mercure écoutés :**
- `new_ride` → Ajout d'une nouvelle course dans la liste

**Endpoints API utilisés :**
- `GET /api/me` (infos chauffeur)
- `PATCH /api/drivers/availability` (toggle disponibilité)
- `GET /api/rides?status=pending&vehiculeType={type}` (courses en attente)
- `POST /api/rides/{id}/accept` (accepter une course)
- Mercure topic `drivers/{driverId}`

---

### 5.2 Page de course en cours (chauffeur) - `/rides/[id]/driving`
**Fichier :** `app/rides/[id]/driving/page.tsx`

**Composants à créer :**
- `components/driver/DrivingView.tsx` - Vue de conduite
- `components/map/DriverLiveMap.tsx` - Carte avec itinéraire
- `components/ride/PassengerCard.tsx` - Infos du passager
- `components/driver/RideControls.tsx` - Contrôles de la course

**Fonctionnalités :**
- Carte Leaflet affichant :
  - Position actuelle du chauffeur (GPS)
  - Marker de pickup (si status = accepted)
  - Marker de dropoff
  - Itinéraire
- Informations du passager :
  - Nom complet
  - Note
  - Téléphone (clic pour appeler)
- Détails de la course :
  - Adresses départ/arrivée
  - Prix estimé
  - Distance et durée
- Boutons selon le statut :
  - "Démarrer la course" (si status = accepted) → status = in_progress
  - "Terminer la course" (si status = in_progress) → status = completed
  - "Annuler la course" (si status = accepted)
- Mise à jour automatique de la position GPS (toutes les 5-10s)
  - Envoi de la position au backend
  - Notification au passager via Mercure

**Fonctionnalités GPS :**
- Utiliser `navigator.geolocation.watchPosition()`
- Envoyer la position toutes les 5-10 secondes via l'API

**Endpoints API utilisés :**
- `GET /api/rides/{id}`
- `PATCH /api/rides/{id}/status` (changer le statut)
- `PATCH /api/drivers/location` (mise à jour position GPS)

---

### 5.3 Page d'historique chauffeur - `/history`
**Fichier :** `app/history/page.tsx`

**Composants à créer :**
- `components/driver/RideHistory.tsx` - Historique des courses
- `components/driver/EarningsCard.tsx` - Carte des revenus

**Fonctionnalités :**
- Liste des courses terminées (status = completed)
- Filtres par date (aujourd'hui, cette semaine, ce mois)
- Affichage pour chaque course :
  - Date et heure
  - Départ et arrivée
  - Prix final
  - Note du passager
  - Durée
- Statistiques globales :
  - Total des revenus
  - Nombre total de courses
  - Note moyenne
  - Distance totale parcourue
- Graphique des revenus (optionnel)

**Endpoints API utilisés :**
- `GET /api/rides?driver=/api/users/{userId}&status=completed&order[completedAt]=desc`

---

### 5.4 Page de profil chauffeur - `/profile/driver`
**Fichier :** `app/profile/driver/page.tsx`

**Composants à créer :**
- `components/driver/DriverProfileForm.tsx` - Formulaire profil chauffeur

**Fonctionnalités :**
- Informations personnelles (comme passager)
- Informations du véhicule :
  - Modèle
  - Type (standard/premium/suv)
  - Couleur
  - Plaque d'immatriculation
- Informations professionnelles :
  - Numéro de licence
  - Statut de vérification (isVerified)
  - Note moyenne
  - Nombre total de courses
- Bouton "Modifier les informations"

**Endpoints API utilisés :**
- `GET /api/me` (avec relation driver)
- `PATCH /api/drivers/{id}`

---

## Phase 6 : Hooks & Utilitaires

### 6.1 Hooks personnalisés
**Fichiers à créer :**
- `hooks/useMercure.ts` - Hook pour les notifications temps réel
- `hooks/useGeolocation.ts` - Hook pour la géolocalisation
- `hooks/useAuth.ts` - Hook pour l'authentification
- `hooks/useRides.ts` - Hook pour les courses (React Query)
- `hooks/useDrivers.ts` - Hook pour les chauffeurs

**Fonctionnalités `useMercure` :**
- Connexion à EventSource
- Écoute d'un topic spécifique
- Gestion des notifications reçues
- Nettoyage à la destruction du composant

**Fonctionnalités `useGeolocation` :**
- Obtenir la position actuelle
- Watch position (mise à jour continue)
- Gestion des erreurs de permission

**Fonctionnalités `useRides` :**
- Requêtes avec React Query
- Cache automatique
- Refetch automatique
- Filtres et tri

---

### 6.2 Composants de carte (Leaflet)
**Fichiers à créer :**
- `components/map/BaseMap.tsx` - Carte de base
- `components/map/MapMarker.tsx` - Marker personnalisé
- `components/map/RoutePolyline.tsx` - Tracer d'itinéraire
- `components/map/LocationPicker.tsx` - Sélecteur de position

**Fonctionnalités :**
- Carte Leaflet responsive
- Markers personnalisés (passager, chauffeur, départ, arrivée)
- Tracer d'itinéraire entre 2 points
- Clic sur la carte pour sélectionner une position
- Géocodage inverse (coordonnées → adresse)

**Configuration Leaflet :**
- Provider de tuiles : OpenStreetMap
- Icônes personnalisées pour les markers
- Gestion du responsive

---

## Phase 7 : Configuration React Query

### 7.1 Setup React Query
**Fichiers à créer :**
- `app/providers.tsx` - Providers globaux (QueryClient, AuthContext)
- `lib/react-query.ts` - Configuration React Query

**Fonctionnalités :**
- Configuration du QueryClient
- Wrapper des providers dans le layout
- Options de cache et refetch

**Queries à créer :**
- `useRidesQuery` - Liste des courses
- `useRideQuery` - Détails d'une course
- `useDriversQuery` - Liste des chauffeurs
- `useMeQuery` - Profil utilisateur

**Mutations à créer :**
- `useLoginMutation` - Connexion
- `useRegisterMutation` - Inscription
- `useCreateRideMutation` - Créer une course
- `useAcceptRideMutation` - Accepter une course
- `useUpdateRideStatusMutation` - Changer le statut
- `useUpdateLocationMutation` - Mettre à jour la position

---

## Phase 8 : Optimisations & Finitions

### 8.1 Gestion des erreurs
**Fichiers à créer :**
- `components/error/ErrorBoundary.tsx` - Error boundary React
- `components/error/ApiErrorDisplay.tsx` - Affichage des erreurs API
- `app/error.tsx` - Page d'erreur globale

**Fonctionnalités :**
- Affichage user-friendly des erreurs
- Logging des erreurs
- Bouton "Réessayer"

---

### 8.2 Loading & Suspense
**Fichiers à créer :**
- `app/loading.tsx` - Loading global
- `components/ui/skeleton.tsx` (Shadcn) - Skeleton loaders

**Fonctionnalités :**
- Skeleton loaders pour les listes
- Spinners pour les actions
- Loading states pour les pages

---

### 8.3 Notifications toast
**Composants Shadcn à installer :**
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`
- `hooks/use-toast.ts`

**Fonctionnalités :**
- Notifications de succès/erreur
- Notifications temps réel (course acceptée, démarrée, etc.)

---

### 8.4 Design responsive
**Tâches :**
- [ ] Mobile-first design
- [ ] Breakpoints Tailwind (sm, md, lg, xl)
- [ ] Navigation mobile optimisée
- [ ] Carte Leaflet responsive
- [ ] Formulaires adaptés au mobile

---

### 8.5 Accessibilité (a11y)
**Tâches :**
- [ ] Labels ARIA
- [ ] Navigation au clavier
- [ ] Contraste des couleurs
- [ ] Focus visible
- [ ] Textes alternatifs pour les images

---

## Phase 9 : Tests (Optionnel mais recommandé)

### 9.1 Tests unitaires
**Outils :**
- Jest
- React Testing Library

**À tester :**
- Composants UI (formulaires, cartes, etc.)
- Hooks personnalisés
- Client API
- Validateurs

---

### 9.2 Tests E2E (Optionnel)
**Outils :**
- Playwright ou Cypress

**Scénarios à tester :**
- Flow complet : inscription → connexion → créer course → accepter course → terminer
- Navigation
- Gestion des erreurs

---

## Ordre de développement recommandé

### Sprint 1 : Infrastructure & Auth (3-4 jours)
1. Configuration de base (env, types, constants, API client)
2. Page d'inscription
3. Page de connexion
4. Middleware & protection des routes
5. Context d'authentification

### Sprint 2 : Layout & Cartes (2-3 jours)
6. Layout principal avec navigation
7. Composants de carte Leaflet de base
8. Hook de géolocalisation
9. Installation et configuration de React Query

### Sprint 3 : Pages Passager - Partie 1 (3-4 jours)
10. Page d'accueil (nouvelle course)
11. Estimation de course
12. Création de course
13. Page de recherche de chauffeur

### Sprint 4 : Pages Passager - Partie 2 (3-4 jours)
14. Page de suivi de course (tracking)
15. Intégration Mercure pour le temps réel
16. Page de résumé de course
17. Page de liste des courses

### Sprint 5 : Pages Chauffeur (4-5 jours)
18. Dashboard chauffeur
19. Liste des courses en attente
20. Page de conduite (driving view)
21. Mise à jour GPS en temps réel
22. Historique chauffeur

### Sprint 6 : Profils & Finalisation (2-3 jours)
23. Page de profil passager
24. Page de profil chauffeur
25. Gestion des erreurs globales
26. Notifications toast
27. Loading states & skeletons

### Sprint 7 : Optimisations & Polish (2-3 jours)
28. Responsive design
29. Accessibilité
30. Performance (lazy loading, code splitting)
31. Tests

---

## Checklist finale

### Fonctionnalités obligatoires
- [ ] Inscription et connexion
- [ ] Protection des routes
- [ ] Création de course avec estimation
- [ ] Recherche et acceptation de course
- [ ] Suivi de course en temps réel (passager)
- [ ] Vue de conduite en temps réel (chauffeur)
- [ ] Notifications Mercure
- [ ] Mise à jour GPS du chauffeur
- [ ] Historique des courses
- [ ] Profils utilisateurs
- [ ] Toggle disponibilité chauffeur

### Fonctionnalités optionnelles
- [ ] Notation des courses
- [ ] Géocodage et autocomplete d'adresses
- [ ] Graphiques de statistiques
- [ ] Mode sombre
- [ ] Notifications push
- [ ] Export des données (PDF)

---

## Notes importantes

1. **Mercure** : Critiques pour le temps réel. Tester la connexion EventSource dès le début.
2. **Géolocalisation** : Demander les permissions au bon moment (UX).
3. **Leaflet** : Ne fonctionne que côté client (use client).
4. **JWT** : Stocker dans localStorage ou httpOnly cookie.
5. **React Query** : Utiliser pour toutes les requêtes API pour simplifier le cache.
6. **Types** : Typer strictement toutes les données API.
7. **Responsive** : Mobile-first car usage probable sur mobile.

---

**Estimation totale : 3-4 semaines pour un développeur full-time**

Bon courage !
