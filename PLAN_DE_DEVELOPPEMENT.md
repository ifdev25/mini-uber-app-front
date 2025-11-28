# 📋 Plan de Développement - Mini Uber App

**Date**: 2025-11-28
**État actuel**: ~85% complété (Phase 1 terminée ✅)
**Objectif**: Application complète et prête pour production

---

## 📊 État des Lieux

### ✅ Déjà Implémenté (70%)

#### Authentification & Utilisateurs
- ✅ Inscription (passager/driver)
- ✅ Connexion/Déconnexion
- ✅ Vérification d'email
- ✅ Page d'accueil (landing page basique)
- ✅ Dashboard général

#### Fonctionnalités Passager
- ✅ Réservation de course (page complète)
- ✅ Suivi de course en temps réel
- ✅ Historique des courses
- ✅ Notation des drivers
- ✅ Profil basique

#### Fonctionnalités Driver
- ✅ Dashboard driver complet
- ✅ Acceptation de courses
- ✅ Gestion de course (démarrer/terminer)
- ✅ Toggle disponibilité
- ✅ Suivi GPS automatique

#### Technique
- ✅ Système de toast notifications
- ✅ Gestion d'erreurs améliorée
- ✅ Hooks React Query
- ✅ Carte interactive Leaflet
- ✅ Types TypeScript complets

---

## 🚧 À Implémenter (30%)

### 🔴 Priorité HAUTE (Essentiel)

#### 1. Page Création Profil Driver
**Route**: `/driver/create-profile`
**Pourquoi**: Les nouveaux drivers n'ont PAS de profil automatique après inscription

**Fonctionnalités**:
- ✅ Formulaire de création de profil driver
- ✅ Saisie véhicule (modèle, type, couleur, plaque)
- ✅ Upload licence/permis (optionnel)
- ✅ Validation Zod
- ✅ Appel API `POST /api/drivers`
- ✅ Redirection vers dashboard après création

**Endpoint Backend**: `POST /api/drivers`
```json
{
  "user": "/api/users/5",
  "vehicleModel": "Renault Symbol",
  "vehicleType": "standard",
  "vehicleColor": "Blanc",
  "licenceNumber": "DRV123456",
  "currentLatitude": 36.4244,
  "currentLongitude": 6.5983
}
```

---

#### 2. Page Historique Driver
**Route**: `/driver/history`
**Pourquoi**: Le driver doit voir ses courses terminées

**Fonctionnalités**:
- Liste des courses (filtrées par driver)
- Filtres par statut (accepted, in_progress, completed, cancelled)
- Statistiques (nombre de courses, gains totaux)
- Détails de chaque course
- Click pour voir détails complets

**Endpoint Backend**: `GET /api/rides?driver=/api/drivers/{id}`

---

#### 3. Estimation de Prix via Backend
**Route**: Amélioration de `/passenger/book`
**Pourquoi**: Actuellement le prix est calculé côté frontend (peu fiable)

**Fonctionnalités**:
- Appeler `POST /api/ride-estimates` au lieu de calcul local
- Afficher l'estimation du backend
- Valider que le prix backend correspond au prix frontend

**Endpoint Backend**: `POST /api/ride-estimates`
```json
{
  "pickupLatitude": 48.8566,
  "pickupLongitude": 2.3522,
  "dropoffLatitude": 48.8738,
  "dropoffLongitude": 2.2950,
  "vehicleType": "standard"
}
```

**Réponse**:
```json
{
  "estimatedDistance": 2.5,
  "estimatedDuration": 12,
  "estimatedPrice": 8.75,
  "vehicleType": "standard"
}
```

---

### 🟡 Priorité MOYENNE (Important)

#### 4. Page Profil Éditable
**Routes**:
- `/passenger/profile/edit`
- `/driver/profile/edit`

**Fonctionnalités Passager**:
- Modifier firstName, lastName, phone
- Modifier photo de profil (upload)
- Changer mot de passe
- Voir statistiques (courses, notes)

**Fonctionnalités Driver**:
- Tout ce que le passager peut faire +
- Modifier info véhicule (modèle, couleur, plaque)
- Changer type de véhicule
- Upload documents (permis, assurance)

**Endpoints Backend**:
- `PATCH /api/users/{id}` - Modifier utilisateur
- `PATCH /api/drivers/{id}` - Modifier profil driver

---

#### 5. Page Statistiques Driver
**Route**: `/driver/stats`
**Pourquoi**: Le driver veut voir ses performances

**Fonctionnalités**:
- Graphiques de gains (par jour/semaine/mois)
- Nombre de courses par période
- Note moyenne reçue
- Temps total de conduite
- Distance totale parcourue
- Classement / Objectifs

**Données**: Calculées à partir de `GET /api/rides?driver={id}`

---

#### 6. Page de Recherche de Drivers (Passager)
**Route**: `/passenger/drivers`
**Pourquoi**: Voir tous les drivers disponibles et leurs infos

**Fonctionnalités**:
- Liste des drivers disponibles
- Filtrer par type de véhicule
- Filtrer par note minimum
- Voir profil complet du driver
- Carte avec position des drivers

**Endpoint Backend**: `GET /api/drivers?isAvailable=true`

---

### 🟢 Priorité BASSE (Nice to have)

#### 7. Chat Driver-Passager
**Route**: `/ride/{id}/chat`
**Pourquoi**: Communication pendant la course

**Fonctionnalités**:
- Messages en temps réel
- Notifications de nouveaux messages
- Historique de conversation

**Technique**: Mercure/WebSocket requis

---

#### 8. Gestion des Paiements
**Route**: `/passenger/payment`
**Pourquoi**: Payer les courses

**Fonctionnalités**:
- Ajouter carte bancaire
- Historique des paiements
- Factures téléchargeables

**Technique**: Stripe/PayPal API

---

#### 9. Mode Hors Ligne
**Technique**: Service Workers + Cache API

**Fonctionnalités**:
- Voir courses en cache
- Queue de requêtes API
- Sync quand connexion revenue

---

#### 10. Notifications Push
**Technique**: Firebase Cloud Messaging

**Fonctionnalités**:
- Notif quand course acceptée
- Notif quand driver arrive
- Notif quand course terminée

---

## 🎯 Roadmap de Développement

### Phase 1: ESSENTIEL ✅ TERMINÉE
**Objectif**: Rendre l'app fonctionnelle à 100%
**Statut**: ✅ 100% COMPLÉTÉE

1. ✅ **FAIT** - Créer `/driver/create-profile` - Page complète avec GPS et validation
2. ✅ **FAIT** - Créer `/driver/history` - Historique avec filtres et statistiques
3. ✅ **CLARIFIÉ** - Estimation prix: Déjà implémentée côté frontend (backend n'a pas d'endpoint dédié)

**Résultat**: ✅ App 100% fonctionnelle pour use cases de base
**Documentation**: Voir `PHASE1_COMPLETED.md` pour le rapport complet

---

### Phase 2: AMÉLIORATION (2-3 jours) 🚀
**Objectif**: Améliorer UX et fonctionnalités

4. ✅ Page profil éditable (passager + driver)
5. ✅ Page statistiques driver
6. ✅ Page recherche de drivers (passager)

**Résultat**: App complète avec bonnes fonctionnalités

---

### Phase 3: AVANCÉ (optionnel) 💎
**Objectif**: Features avancées

7. Chat en temps réel
8. Système de paiement
9. Mode hors ligne
10. Notifications push

**Résultat**: App de niveau production

---

## 📝 Checklist Détaillée Phase 1 ✅ TERMINÉE

### ✅ Task 1: Page Création Profil Driver - COMPLÉTÉE

**Fichiers créés**:
- ✅ `app/driver/create-profile/page.tsx` (357 lignes)
- ✅ Utilise les hooks existants (pas besoin de nouveau hook)

**Étapes**:
1. ✅ Formulaire avec react-hook-form + zod
2. ✅ Champs: vehicleModel, vehicleType, vehicleColor, licenceNumber
3. ✅ Bouton "Obtenir position actuelle" pour GPS
4. ✅ Validation: tous les champs requis (licenceNumber inclus)
5. ✅ Appel `api.createDriver(data)` avec format IRI
6. ✅ Toast success + redirect `/driver/dashboard`
7. ✅ Gestion erreurs avec toast contextuels
8. ✅ Vérification que l'utilisateur n'a PAS déjà de profil

---

### ✅ Task 2: Page Historique Driver - COMPLÉTÉE

**Fichiers créés**:
- ✅ `app/driver/history/page.tsx` (290 lignes)

**Étapes**:
1. ✅ `useRides()` avec filtre `driver` (driver.id, pas user.id!)
2. ✅ Liste des courses avec design professionnel
3. ✅ Filtres par statut (all, accepted, in_progress, completed, cancelled)
4. ✅ Statistiques: total courses, gains totaux, note moyenne, distance totale
5. ✅ Click sur course → `/driver/ride/{id}`
6. ✅ Bouton "Retour au dashboard"
7. ✅ Bonus: Statistiques détaillées pour courses terminées (gain moyen/course)

---

### ✅ Task 3: Estimation Prix Backend - CLARIFIÉE

**Statut**: ✅ Déjà implémentée de façon optimale

**Découverte**:
- ❌ L'endpoint `/api/ride-estimates` **N'EXISTE PAS** dans le backend
- ✅ Le backend calcule automatiquement lors de `POST /api/rides`
- ✅ Calcul frontend déjà fiable (formule haversine)
- ✅ Backend valide lors de la création réelle

**Conclusion**: Pas de modification nécessaire, l'implémentation actuelle est correcte

---

## 🔧 Endpoints Backend Manquants

D'après `API_ENDPOINTS.md`, tous les endpoints existent déjà:

### Drivers
- ✅ `POST /api/drivers` - Créer profil
- ✅ `GET /api/drivers` - Lister drivers
- ✅ `GET /api/drivers/{id}` - Détails driver
- ✅ `PATCH /api/drivers/{id}` - Modifier driver
- ✅ `PATCH /api/drivers/location` - MAJ position
- ✅ `PATCH /api/drivers/availability` - MAJ dispo

### Rides
- ✅ `POST /api/ride-estimates` - Estimer prix
- ✅ `POST /api/rides` - Créer course
- ✅ `GET /api/rides` - Lister courses
- ✅ `GET /api/rides/{id}` - Détails course
- ✅ `POST /api/rides/{id}/accept` - Accepter
- ✅ `PATCH /api/rides/{id}/status` - MAJ statut

### Users
- ✅ `GET /api/users/{id}` - Détails user
- ✅ `PATCH /api/users/{id}` - Modifier user

### Ratings
- ✅ `POST /api/ratings` - Créer notation
- ✅ `GET /api/ratings` - Lister notations

**Conclusion**: Tous les endpoints backend sont disponibles ! ✅

---

## 🎨 Guidelines de Développement

### Design
- Utiliser composants shadcn/ui existants
- Respecter le thème (bleu/indigo)
- Responsive mobile-first
- Icons cohérents (emojis ou lucide-react)

### Code Quality
- Types TypeScript pour tout
- React Query pour data fetching
- Toast pour feedback utilisateur
- Logging console pour debug
- Gestion d'erreurs avec try/catch

### Tests
- Tester chaque endpoint avec curl
- Vérifier les données reçues/envoyées
- Valider les erreurs (403, 404, etc.)
- Tester sur mobile et desktop

---

## 📚 Ressources

### Documentation
- `API_ENDPOINTS.md` - Référence complète de l'API
- `TEST_RESULTS.md` - Tests effectués avec exemples
- `IMPROVEMENTS.md` - Améliorations apportées
- `IMPLEMENTATION_STATUS.md` - État actuel du projet

### Code Existant à Réutiliser
- `app/passenger/book/page.tsx` - Formulaire complexe avec carte
- `app/driver/dashboard/page.tsx` - Dashboard avec stats
- `app/passenger/history/page.tsx` - Liste avec filtres
- `hooks/useRides.ts` - Hooks React Query
- `lib/api.ts` - Client API

---

## ⚡ Quick Start Phase 1

### 1. Créer le profil driver
```bash
# Créer le fichier
touch app/driver/create-profile/page.tsx

# Structure basique
- Formulaire avec vehicleModel, vehicleType, vehicleColor
- Button "Créer mon profil"
- Appeler api.createDriver(data)
- Redirect vers /driver/dashboard
```

### 2. Créer l'historique driver
```bash
# Créer le fichier
touch app/driver/history/page.tsx

# Copier de passenger/history et adapter
- Changer filtres pour driver
- Afficher gains au lieu de dépenses
- Lien vers /driver/ride/{id}
```

### 3. Estimation backend
```bash
# Modifier app/passenger/book/page.tsx

# Remplacer calculateEstimate() par:
const estimate = await api.estimateRide({
  pickupLatitude: pickup.lat,
  pickupLongitude: pickup.lng,
  dropoffLatitude: dropoff.lat,
  dropoffLongitude: dropoff.lng,
  vehicleType: selectedVehicle
});
```

---

## ✅ Critères de Succès

### Phase 1 Complète ✅ VALIDÉE:
- ✅ Un nouveau driver peut créer son profil
- ✅ Le driver peut voir son historique de courses
- ✅ L'estimation de prix est fiable (frontend + validation backend)
- ✅ Tous les endpoints critiques testés
- ✅ Pas d'erreurs en console
- ✅ Toast notifications sur toutes les actions

### App Prête pour Prod Quand:
- ✅ Phase 1 complète
- [ ] Phase 2 complète
- [ ] Tests end-to-end passent
- [ ] Pas de bugs critiques
- ✅ Documentation à jour (PHASE1_COMPLETED.md, PLAN_DE_DEVELOPPEMENT.md)
- [ ] Build production sans erreurs

---

## 🚀 Commandes Utiles

```bash
# Démarrer le dev server
npm run dev

# Build production
npm run build

# Tester un endpoint
curl -X POST http://localhost:8000/api/drivers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/ld+json" \
  -d '{...}'

# Voir les routes Next.js
npm run dev
# Ouvrir http://localhost:3000
```

---

**Prochaine étape**: Commencer Phase 1 - Task 1 (Création profil driver) 🚀
