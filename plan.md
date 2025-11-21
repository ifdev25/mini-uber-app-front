# 📋 Plan de Développement - Mini Uber Frontend

## 📅 Date de début : 20 Novembre 2025

---

## ✅ Phase 1 - Configuration & Infrastructure (TERMINÉE)

### Réalisations

- ✅ Projet Next.js 16 avec TypeScript
- ✅ Configuration Tailwind CSS v4
- ✅ Shadcn UI (Button, Input, Card, Form, Select)
- ✅ React Query pour la gestion d'état
- ✅ Client API avec support API Platform
- ✅ Types TypeScript complets
- ✅ Constantes globales (véhicules, statuts, routes)
- ✅ Configuration environnement (.env.local)

---

## ✅ Phase 2 - Authentification (TERMINÉE)

### Réalisations

#### Authentification
- ✅ Hook useAuth avec React Query
- ✅ Login/Register mutations
- ✅ Gestion automatique du cache utilisateur
- ✅ Vérifications de rôle (Driver/Passenger/Admin)
- ✅ Protection des routes avec AuthGuard

#### Pages
- ✅ Page de connexion (/login)
  - Formulaire avec validation
  - Gestion des erreurs explicites
  - Comptes de test pré-remplis
- ✅ Page d'inscription (/register)
  - Formulaire complet
  - Validation côté client
  - Sélecteur de type de compte
- ✅ Page d'accueil (/)
  - Design attractif
  - Redirection si connecté
  - Bandeau si backend indisponible
- ✅ Dashboard (/dashboard)
  - Protégé par AuthGuard
  - Affichage des infos utilisateur
  - Interface selon le rôle

#### Vérification d'email
- ✅ Champ `isVerified` dans le type User
- ✅ Page de vérification `/verify-email`
- ✅ Composant EmailVerificationBanner
- ✅ Message de succès après inscription
- ✅ Bannière "Email non vérifié" dans le dashboard
- ✅ Bouton "Renvoyer l'email de vérification"
- ✅ Intégration avec backend (POST /api/verify-email)
- ✅ Gestion des erreurs de vérification (token invalide/expiré)

#### Gestion des erreurs
- ✅ Messages d'erreur explicites
  - Credentials invalides (401)
  - Backend indisponible
  - Erreurs réseau
- ✅ Corrections bugs d'hydratation
- ✅ Correction Content-Type API (ld+json)

---

## 🚀 Phase 3 - Interface Passager (À FAIRE)

### Fonctionnalités prévues

- [ ] Page de réservation de course
- [ ] Estimation du prix en temps réel
- [ ] Carte interactive (Leaflet)
- [ ] Sélection adresses (départ/arrivée)
- [ ] Choix du type de véhicule
- [ ] Page de suivi de course
- [ ] Position chauffeur en temps réel
- [ ] Historique des courses
- [ ] Profil utilisateur
- [ ] Notation du chauffeur

---

## 🚀 Phase 4 - Interface Chauffeur (À FAIRE)

### Fonctionnalités prévues

- [ ] Dashboard avec statistiques
- [ ] Toggle disponibilité
- [ ] Liste courses disponibles
- [ ] Acceptation de course
- [ ] Page course active
- [ ] Mise à jour GPS automatique
- [ ] Historique et revenus
- [ ] Profil chauffeur avec véhicule

---

## 🚀 Phase 5 - Temps réel (Mercure) (À FAIRE)

### Fonctionnalités prévues

- [ ] Hook useMercure
- [ ] Notifications en temps réel
- [ ] Position GPS du chauffeur
- [ ] Mises à jour statut course
- [ ] Toast notifications

---

## 📊 Technologies utilisées

- Next.js 16.0.3 (App Router, Turbopack)
- React 19.2.0
- TypeScript 5.x
- Tailwind CSS 4.x
- Shadcn UI
- React Query 5.90.10
- Resend (emails)
- Leaflet 1.9.4 (cartes)

---

## 🔧 Configuration

### Variables d'environnement
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MERCURE_URL=http://localhost:3000/.well-known/mercure
RESEND_API_KEY=your_resend_api_key_here
```

### Comptes de test
```
Passager: john.doe@email.com / password123
Chauffeur: marie.martin@driver.com / driver123
Admin: admin@miniuber.com / admin123
```

---

**Progression globale : 40%** (2/5 phases terminées)

**Prochaine étape : Phase 3 - Interface Passager**

---

*Dernière mise à jour : 20 Novembre 2025*
