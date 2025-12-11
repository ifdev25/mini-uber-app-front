# 🧪 Guide de Test Complet - Mini Uber App

**Date:** 2025-12-11
**Version:** Post-refactoring
**Objectif:** Valider toutes les fonctionnalités après refactoring

---

## 🚀 Préparation

### 1. Démarrer le backend
```bash
# Dans le dossier du backend
symfony server:start
# ou
php -S localhost:8000 -t public
```

### 2. Démarrer le frontend
```bash
cd mini-uber-app-front
npm run dev
```

### 3. Ouvrir l'application
- URL: http://localhost:3000
- Backend: http://localhost:8000

---

## 📋 Plan de Test

### Légende
- ✅ Fonctionnel
- ❌ Erreur
- ⚠️ Attention requise
- ⏭️ Non testé

---

## 1. 🔐 Authentication

### 1.1 Inscription Passenger

**URL:** `/register`

**Étapes:**
1. Remplir le formulaire:
   - Email: `passenger@test.com`
   - Password: `password123`
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `+33612345678`
   - User Type: **Passenger**

2. Cliquer sur "S'inscrire"

**Résultat attendu:**
- ✅ Toast de succès: "Inscription réussie. Veuillez vérifier votre email..."
- ✅ Token stocké dans localStorage
- ✅ Redirection selon userType

**Code impacté:**
- `hooks/useAuth.ts` (registerMutation)
- `lib/api.ts` (register)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 1.2 Inscription Driver

**Étapes:**
1. Même formulaire avec User Type: **Driver**
2. Email: `driver@test.com`

**Résultat attendu:**
- ✅ Inscription réussie
- ✅ userType = 'driver'

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 1.3 Connexion

**URL:** `/login`

**Étapes:**
1. Email: `passenger@test.com`
2. Password: `password123`
3. Cliquer sur "Se connecter"

**Résultat attendu:**
- ✅ Toast de succès
- ✅ Token stocké
- ✅ Redirection vers `/` ou `/dashboard`
- ✅ useAuth().user chargé

**Code impacté:**
- `hooks/useAuth.ts` (loginMutation)
- `lib/api.ts` (login, getMe)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 1.4 Vérification Token

**Étapes:**
1. Après connexion, recharger la page (F5)

**Résultat attendu:**
- ✅ Utilisateur reste connecté
- ✅ Données utilisateur rechargées depuis /api/me

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 1.5 Déconnexion

**Étapes:**
1. Cliquer sur le bouton de déconnexion

**Résultat attendu:**
- ✅ Token supprimé de localStorage
- ✅ Redirection vers `/login`
- ✅ useAuth().user = null

**Code impacté:**
- `hooks/useAuth.ts` (logout)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

## 2. 🚗 Driver Features

### 2.1 Créer Profil Driver

**URL:** `/driver/create-profile`

**Prérequis:** Connecté en tant que driver

**Étapes:**
1. Remplir le formulaire:
   - Vehicle Model: `Toyota Prius`
   - Vehicle Type: `comfort`
   - Vehicle Color: `Blanc`
   - Licence Number: `ABC123456`
   - Cliquer sur "Obtenir ma position" (GPS)

2. Soumettre le formulaire

**Résultat attendu:**
- ✅ Profil driver créé
- ✅ Toast de succès
- ✅ user.driverProfile populated
- ✅ Redirection vers `/driver/dashboard`

**Code impacté:**
- `lib/api.ts` (createDriver)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 2.2 Toggle Disponibilité

**URL:** `/driver/dashboard`

**Prérequis:** Profil driver créé

**Étapes:**
1. Cliquer sur le bouton "Disponible/Indisponible"
2. Observer le changement d'état
3. Re-cliquer pour changer à nouveau

**Résultat attendu:**
- ✅ Toast "✅ Vous êtes maintenant disponible" (ou indisponible)
- ✅ Bouton change de couleur
- ✅ API appelée: PATCH `/api/drivers/availability`
- ✅ GPS démarre quand disponible
- ✅ user.driverProfile.isAvailable mis à jour

**Code impacté:**
- `hooks/useDriverAvailability.ts` (refactorisé avec useApiMutation) ⚠️ **CHANGÉ**
- `app/driver/dashboard/page.tsx` (availabilityMutation) ⚠️ **CHANGÉ**
- `lib/api.ts` (updateDriverAvailability)

**Points d'attention:**
- Vérifier que `availabilityMutation.mutateAsync()` fonctionne
- Vérifier que `availabilityMutation.isPending` fonctionne

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 2.3 Voir Courses Disponibles

**URL:** `/driver/dashboard`

**Prérequis:** Driver disponible, courses pending dans le système

**Étapes:**
1. Observer la section "Courses disponibles"
2. Vérifier que les courses s'affichent
3. Attendre 5s (polling automatique)

**Résultat attendu:**
- ✅ Liste des courses avec status='pending'
- ✅ Rafraîchissement automatique toutes les 5s
- ✅ Affichage correct des adresses, prix, distance

**Code impacté:**
- `hooks/useRides.ts` (useRides)
- `app/driver/dashboard/page.tsx` (polling avec setInterval)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 2.4 Accepter une Course

**URL:** `/driver/dashboard`

**Prérequis:** Au moins une course disponible

**Étapes:**
1. Cliquer sur "Accepter" pour une course
2. Observer le toast
3. Vérifier la redirection

**Résultat attendu:**
- ✅ Toast "Course acceptée ! Dirigez-vous vers le point de départ."
- ✅ API appelée: POST `/api/rides/{id}/accept`
- ✅ Course status passe à 'accepted'
- ✅ Driver.isAvailable passe à false
- ✅ Redirection vers `/driver/ride/{id}`

**Code impacté:**
- `hooks/useRides.ts` (useAcceptRide - refactorisé) ⚠️ **CHANGÉ**
- `lib/api.ts` (acceptRide)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 2.5 Démarrer une Course

**URL:** `/driver/ride/{id}`

**Prérequis:** Course acceptée

**Étapes:**
1. Cliquer sur "Démarrer la course"

**Résultat attendu:**
- ✅ Toast "Course démarrée !"
- ✅ API appelée: PATCH `/api/rides/{id}/status` avec `{ status: 'in_progress' }`
- ✅ Status passe à 'in_progress'
- ✅ `startedAt` timestamp ajouté

**Code impacté:**
- `hooks/useRides.ts` (useUpdateRideStatus - refactorisé) ⚠️ **CHANGÉ**
- `lib/api.ts` (updateRideStatus)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 2.6 Terminer une Course

**URL:** `/driver/ride/{id}`

**Prérequis:** Course en cours (in_progress)

**Étapes:**
1. Cliquer sur "Terminer la course"

**Résultat attendu:**
- ✅ Toast "Course terminée avec succès !"
- ✅ API appelée: PATCH `/api/rides/{id}/status` avec `{ status: 'completed' }`
- ✅ Status passe à 'completed'
- ✅ `completedAt` timestamp ajouté
- ✅ `finalPrice` calculé
- ✅ Driver.isAvailable redevient true

**Code impacté:**
- `hooks/useRides.ts` (useUpdateRideStatus)
- `lib/api.ts` (updateRideStatus)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 2.7 Historique Driver

**URL:** `/driver/history`

**Prérequis:** Driver avec au moins une course

**Étapes:**
1. Accéder à la page
2. Observer la liste des courses
3. Tester les filtres (toutes, acceptées, en cours, terminées, annulées)
4. Cliquer sur une course pour voir les détails

**Résultat attendu:**
- ✅ API appelée: GET `/api/rides?driver={driverId}`
- ✅ Liste filtrée par driver
- ✅ Statistiques affichées (total courses, gains, note)
- ✅ Filtres fonctionnels
- ✅ Redirection vers détails sur click

**Code impacté:**
- `hooks/useRides.ts` (useRides avec filtres) ⚠️ **CHANGÉ**
- `app/driver/history/page.tsx` (migré de useMyRides) ⚠️ **CHANGÉ**

**Points d'attention:**
- Vérifier que `useRides({ driver: driverId })` fonctionne
- Vérifier `ridesData?.['hydra:member']` extraction

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

## 3. 👤 Passenger Features

### 3.1 Créer une Course

**URL:** `/passenger/book`

**Prérequis:** Connecté en tant que passenger

**Étapes:**
1. Cliquer sur "Utiliser ma position" pour le départ
2. Entrer une adresse de destination
3. Sélectionner un type de véhicule
4. Observer l'estimation de prix
5. Cliquer sur "Réserver la course"

**Résultat attendu:**
- ✅ GPS fonctionne pour obtenir la position
- ✅ Estimation de prix calculée (frontend)
- ✅ Toast "Course créée avec succès !"
- ✅ API appelée: POST `/api/rides`
- ✅ Redirection vers `/passenger/ride/{id}`
- ✅ Query 'rides' invalidée

**Code impacté:**
- `hooks/useRides.ts` (useCreateRide - refactorisé) ⚠️ **CHANGÉ**
- `lib/api.ts` (createRide)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 3.2 Suivre une Course (Pending)

**URL:** `/passenger/ride/{id}`

**Prérequis:** Course créée (status='pending')

**Étapes:**
1. Observer l'interface
2. Vérifier le polling automatique (toutes les 3s)
3. Attendre qu'un driver accepte (si possible)

**Résultat attendu:**
- ✅ Affichage "En attente d'un chauffeur..."
- ✅ Polling actif toutes les 3s
- ✅ Bouton "Annuler" disponible
- ✅ Quand acceptée: Affichage des infos driver

**Code impacté:**
- `hooks/useRides.ts` (useRide avec polling automatique)
- Polling s'arrête quand status='completed' ou 'cancelled'

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 3.3 Annuler une Course

**URL:** `/passenger/ride/{id}`

**Prérequis:** Course pending ou accepted

**Étapes:**
1. Cliquer sur "Annuler la course"
2. Confirmer l'annulation

**Résultat attendu:**
- ✅ Toast "Course annulée avec succès"
- ✅ API appelée: POST `/api/rides/{id}/cancel` ⚠️ **CHANGÉ** (avant PATCH)
- ✅ Status passe à 'cancelled'
- ✅ Redirection vers `/passenger/history`
- ✅ Si driver assigné, il redevient disponible

**Code impacté:**
- `hooks/useRides.ts` (useCancelRide - refactorisé) ⚠️ **CHANGÉ**
- `lib/api.ts` (cancelRide - corrigé pour POST) ⚠️ **CHANGÉ**

**Points d'attention:**
- Vérifier que POST `/api/rides/{id}/cancel` fonctionne (au lieu de PATCH)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 3.4 Noter un Driver

**URL:** `/passenger/ride/{id}/rate`

**Prérequis:** Course terminée (status='completed')

**Étapes:**
1. Sélectionner une note (1-5 étoiles)
2. Ajouter un commentaire (optionnel)
3. Soumettre la notation

**Résultat attendu:**
- ✅ Toast "Merci pour votre évaluation !"
- ✅ API appelée: POST `/api/ratings`
- ✅ Body contient IRIs: `{ ride: "/api/rides/1", rater: "/api/users/1", rated: "/api/users/2", score: 4.5, comment: "..." }`
- ✅ Note enregistrée
- ✅ Query 'ratings' invalidée

**Code impacté:**
- `hooks/useRatings.ts` (useCreateRating - refactorisé) ⚠️ **CHANGÉ**
- `lib/api.ts` (createReview)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 3.5 Historique Passenger

**URL:** `/passenger/history`

**Prérequis:** Passenger avec au moins une course

**Étapes:**
1. Accéder à la page
2. Observer la liste des courses
3. Vérifier les filtres

**Résultat attendu:**
- ✅ API appelée: GET `/api/rides?passenger={passengerId}`
- ✅ Liste filtrée par passenger
- ✅ Affichage correct des courses

**Code impacté:**
- `hooks/useRides.ts` (useRides)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 3.6 Profil Passenger

**URL:** `/passenger/profile`

**Prérequis:** Connecté en tant que passenger

**Étapes:**
1. Cliquer sur "Modifier"
2. Changer firstName, lastName, phone
3. Cliquer sur "Enregistrer"

**Résultat attendu:**
- ✅ Alert "Profil mis à jour avec succès !"
- ✅ API appelée: PATCH `/api/users/{id}`
- ✅ Données mises à jour
- ✅ useAuth().refetch() appelé

**Code impacté:**
- `lib/api.ts` (updateUser - conservé)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

## 4. 🔧 Tests Techniques

### 4.1 Gestion d'Erreur

**Test 1: Token expiré**
1. Supprimer le token de localStorage
2. Tenter une action authentifiée

**Résultat attendu:**
- ✅ Toast d'erreur
- ✅ Redirection vers `/login`

**Test 2: Erreur réseau**
1. Éteindre le backend
2. Tenter une action

**Résultat attendu:**
- ✅ Toast d'erreur cohérent
- ✅ Pas de crash de l'application

**Code impacté:**
- `hooks/useApiMutation.ts` (gestion d'erreur centralisée) ⚠️ **NOUVEAU**

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 4.2 Invalidation de Cache

**Test:**
1. Créer une course (passenger)
2. Accepter la course (driver)
3. Vérifier que les deux dashboards se mettent à jour

**Résultat attendu:**
- ✅ Query 'rides' invalidée après chaque mutation
- ✅ Données rafraîchies automatiquement

**Code impacté:**
- `hooks/useApiMutation.ts` (invalidateQueries)
- Tous les hooks de mutation

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

### 4.3 Polling Automatique

**Test 1: Ride tracking**
1. Créer une course (passenger)
2. Ouvrir `/passenger/ride/{id}`
3. Observer les appels réseau (3s interval)
4. Faire accepter la course par un driver
5. Vérifier que le polling s'arrête quand completed/cancelled

**Résultat attendu:**
- ✅ GET `/api/rides/{id}` toutes les 3s
- ✅ Polling s'arrête pour status terminal
- ✅ staleTime=0, gcTime=0

**Code impacté:**
- `hooks/useRides.ts` (useRide avec refetchInterval)

**Statut:** [ ] ✅ | [ ] ❌ | [ ] ⏭️

---

## 5. 📊 Résumé des Tests

### Checklist Globale

**Authentication:**
- [ ] Inscription passenger
- [ ] Inscription driver
- [ ] Connexion
- [ ] Vérification token
- [ ] Déconnexion

**Driver:**
- [ ] Créer profil
- [ ] Toggle disponibilité
- [ ] Voir courses disponibles
- [ ] Accepter course
- [ ] Démarrer course
- [ ] Terminer course
- [ ] Historique

**Passenger:**
- [ ] Créer course
- [ ] Suivre course (polling)
- [ ] Annuler course
- [ ] Noter driver
- [ ] Historique
- [ ] Profil

**Technique:**
- [ ] Gestion d'erreur
- [ ] Invalidation cache
- [ ] Polling automatique

---

## 6. 🐛 Rapport de Bugs

### Format
```markdown
**Feature:** [Nom de la feature]
**Étape:** [Étape où l'erreur survient]
**Erreur:** [Description de l'erreur]
**Console:** [Logs de la console]
**Code concerné:** [Fichier et ligne]
**Priorité:** [Haute | Moyenne | Basse]
```

### Bugs Identifiés

_(À remplir pendant les tests)_

---

## 7. 📈 Résultats Finaux

### Statistiques

- **Tests effectués:** ___ / 30
- **Tests réussis:** ___ ✅
- **Tests échoués:** ___ ❌
- **Bugs critiques:** ___
- **Bugs mineurs:** ___

### Taux de Réussite

```
Taux de réussite = (Tests réussis / Tests effectués) × 100%
= ____%
```

### Conclusion

_(À remplir après tests)_

---

**Testeur:** [Nom]
**Date:** 2025-12-11
**Durée:** [Temps]
**Environnement:**
- Node: [version]
- npm: [version]
- Browser: [version]
