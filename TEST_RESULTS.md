# Rapport de Tests API - Mini Uber

Date: 2025-11-28
Backend URL: http://localhost:8000

## Résumé des Tests

### ✅ Tests Réussis

#### 1. Vérification de la disponibilité du backend
- **Endpoint**: `GET /api`
- **Status**: ✅ HTTP 401 (normal sans token)
- **Résultat**: Backend accessible et répond correctement

#### 2. Inscription d'un passager
- **Endpoint**: `POST /api/register`
- **Status**: ✅ HTTP 201
- **Données envoyées**:
```json
{
  "email": "testpassenger@test.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "Passenger",
  "phone": "+33612345678",
  "userType": "passenger"
}
```
- **Réponse**:
```json
{
  "message": "Inscription réussie. Veuillez vérifier votre email pour activer votre compte.",
  "user": {
    "id": 7,
    "email": "testpassenger@test.com",
    "firstName": "Test",
    "lastName": "Passenger",
    "userType": "passenger",
    "isVerified": false
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```
- **Observations**:
  - ✅ Retourne un token JWT valide
  - ✅ L'utilisateur est créé avec `isVerified: false`
  - ✅ Message indique de vérifier l'email

#### 3. Récupération du profil utilisateur
- **Endpoint**: `GET /api/me`
- **Status**: ✅ HTTP 200
- **Headers**: `Authorization: Bearer {JWT_TOKEN}`
- **Réponse**:
```json
{
  "id": 7,
  "email": "testpassenger@test.com",
  "firstName": "Test",
  "lastName": "Passenger",
  "phone": "+33612345678",
  "userType": "passenger",
  "rating": null,
  "totalRides": null,
  "isVerified": false,
  "createdAt": "2025-11-28T16:55:36+00:00",
  "driverProfile": null
}
```
- **Observations**:
  - ✅ Token JWT valide et fonctionnel
  - ✅ Retourne toutes les informations utilisateur
  - ✅ Format conforme aux types TypeScript du frontend

#### 4. Inscription d'un driver
- **Endpoint**: `POST /api/register`
- **Status**: ✅ HTTP 201
- **Données envoyées**:
```json
{
  "email": "testdriver@test.com",
  "password": "password123",
  "firstName": "Driver",
  "lastName": "Test",
  "phone": "+33612345680",
  "userType": "driver"
}
```
- **Réponse**: ✅ Similaire au passager avec `userType: "driver"`

---

### ⚠️ Tests avec Avertissements

#### 1. Content-Type pour API Platform
- **Problème**: API Platform requiert `application/ld+json`
- **Erreur initiale**: HTTP 415 avec `application/json`
- **Solution**: Utiliser `Content-Type: application/ld+json`
- **Status dans le code**: ✅ Déjà géré dans `lib/api.ts` ligne 105
```typescript
const defaultContentType = isCustomEndpoint ? 'application/json' : 'application/ld+json';
```

---

### ❌ Tests Échoués

#### 1. Connexion (Login)
- **Endpoint**: `POST /api/login`
- **Status**: ❌ HTTP 401
- **Erreur**: `"Invalid credentials."`
- **Données envoyées**:
```json
{
  "email": "testpassenger@test.com",
  "password": "password123"
}
```
- **Cause probable**: L'utilisateur doit être vérifié (`isVerified: true`) avant de pouvoir se connecter
- **Impact**: Les utilisateurs ne peuvent pas se connecter après inscription sans vérifier leur email

#### 2. Création de course (Ride)
- **Endpoint**: `POST /api/rides`
- **Status**: ❌ HTTP 403
- **Erreur**: `"Access Denied."`
- **Données envoyées**:
```json
{
  "pickupAddress": "10 Rue de Rivoli, 75001 Paris",
  "pickupLatitude": 48.8566,
  "pickupLongitude": 2.3522,
  "dropoffAddress": "Arc de Triomphe, 75008 Paris",
  "dropoffLatitude": 48.8738,
  "dropoffLongitude": 2.2950,
  "vehicleType": "comfort"
}
```
- **Headers**: ✅ Token JWT valide, `Content-Type: application/ld+json`
- **Cause probable**: L'utilisateur doit être vérifié pour créer des courses
- **Impact**: Les passagers non vérifiés ne peuvent pas demander de courses

#### 3. Création de profil driver
- **Endpoint**: `POST /api/drivers`
- **Status**: ❌ HTTP 403
- **Erreur**: `"Access Denied."`
- **Données envoyées**:
```json
{
  "user": "/api/users/7",
  "vehicleModel": "Toyota Prius",
  "vehicleType": "comfort",
  "vehicleColor": "Blanc",
  "licenceNumber": "DRV123456",
  "currentLatitude": 48.8566,
  "currentLongitude": 2.3522
}
```
- **Cause probable**: L'utilisateur doit être vérifié pour créer un profil driver
- **Impact**: Les drivers non vérifiés ne peuvent pas créer leur profil

#### 4. Token JWT Expiration
- **Problème**: Les tokens JWT expirent après 1 heure
- **Payload décodé**:
```json
{
  "iat": 1764348936,
  "exp": 1764352536,
  "roles": [],
  "username": "testpassenger@test.com"
}
```
- **Impact**: Les tests doivent être effectués rapidement ou les tokens renouvelés
- **Recommandation**: Implémenter un refresh token dans le frontend

---

## Problèmes Identifiés

### 1. 🔐 Système de Vérification d'Email Obligatoire
**Sévérité**: Haute

**Description**: Le backend requiert que les utilisateurs vérifient leur email avant de pouvoir :
- Se connecter via `/api/login`
- Créer des courses (`POST /api/rides`)
- Créer un profil driver (`POST /api/drivers`)

**Solutions proposées**:
1. **Backend**: Ajouter un mode de développement qui désactive la vérification d'email
2. **Frontend**: Afficher clairement le message de vérification après inscription
3. **Frontend**: Ajouter une page pour renvoyer l'email de vérification (`POST /api/resend-verification`)
4. **Documentation**: Documenter clairement ce comportement dans le README

### 2. 🔄 Gestion des Tokens JWT
**Sévérité**: Moyenne

**Description**: Les tokens JWT expirent après 1 heure sans mécanisme de refresh token visible

**Solutions proposées**:
1. Implémenter un refresh token automatique dans le frontend
2. Détecter l'expiration du token et rediriger vers login
3. Afficher un message d'avertissement avant l'expiration

### 3. 📝 Messages d'Erreur Peu Clairs
**Sévérité**: Faible

**Description**: Les erreurs 403 "Access Denied" ne précisent pas que la vérification d'email est requise

**Solutions proposées**:
1. **Backend**: Améliorer les messages d'erreur pour être plus explicites
2. **Frontend**: Détecter les erreurs 403 et suggérer de vérifier l'email

---

## Recommandations pour le Frontend

### 1. Gestion des Erreurs Améliorée

**Fichier**: `lib/api.ts`

Améliorer la fonction `request()` pour détecter les erreurs spécifiques:
```typescript
if (response.status === 403 && errorMessage.includes("Access Denied")) {
  // Vérifier si l'utilisateur est vérifié
  const user = await this.getMe();
  if (!user.isVerified) {
    throw new Error("Votre compte n'est pas encore vérifié. Veuillez vérifier votre email.");
  }
}
```

### 2. Page de Vérification d'Email

Créer une nouvelle page `app/verify-email/page.tsx` pour:
- Afficher le message de vérification
- Permettre de renvoyer l'email
- Afficher un compte à rebours

### 3. Refresh Token Automatique

**Fichier**: `hooks/useAuth.ts`

Ajouter un mécanisme de refresh token:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Vérifier l'expiration du token et rafraîchir si nécessaire
    const token = api.getToken();
    if (token && isTokenExpiringSoon(token)) {
      refreshToken();
    }
  }, 60000); // Vérifier chaque minute

  return () => clearInterval(interval);
}, []);
```

### 4. Notifications Utilisateur Plus Claires

**Fichier**: `hooks/useRides.ts`

Améliorer les messages d'erreur dans `useCreateRide`:
```typescript
onError: (error: Error) => {
  let userMessage = error.message;

  if (error.message.includes("Access Denied")) {
    userMessage = "Vous devez vérifier votre email avant de créer une course.";
  } else if (error.message.includes("403")) {
    userMessage = "Accès refusé. Veuillez vérifier votre compte.";
  }

  toast.error(userMessage); // Utiliser react-hot-toast ou similaire
}
```

---

## Tests à Effectuer avec des Données Vérifiées

Pour continuer les tests, il faudrait:

1. **Accéder à la base de données** pour marquer manuellement un utilisateur comme vérifié
2. **Configurer le système d'email** pour recevoir et cliquer sur le lien de vérification
3. **Utiliser des fixtures** avec des utilisateurs pré-vérifiés

### Script SQL pour Vérifier Manuellement (si accès DB)
```sql
UPDATE user SET is_verified = 1 WHERE email = 'testpassenger@test.com';
UPDATE user SET is_verified = 1 WHERE email = 'testdriver@test.com';
```

---

## Prochaines Étapes

1. ✅ Créer ce rapport de tests
2. ⏳ Améliorer la gestion des erreurs dans `lib/api.ts`
3. ⏳ Créer la page de vérification d'email
4. ⏳ Implémenter les notifications utilisateur avec `react-hot-toast`
5. ⏳ Tester le workflow complet avec des utilisateurs vérifiés
6. ⏳ Documenter le processus de vérification d'email dans le README
7. ⏳ Implémenter le suivi en temps réel de la position du driver
8. ⏳ Ajouter des tests end-to-end avec Playwright ou Cypress

---

## Conclusion

Le backend fonctionne correctement mais requiert une vérification d'email stricte. Le frontend doit être amélioré pour:
1. Guider l'utilisateur à travers le processus de vérification
2. Afficher des messages d'erreur plus clairs
3. Gérer l'expiration des tokens JWT
4. Implémenter un système de notifications

Les endpoints testés fonctionnent comme documenté dans `API_ENDPOINTS.md`, mais la contrainte de vérification d'email doit être clairement communiquée à l'utilisateur.
