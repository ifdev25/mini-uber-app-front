# 🔧 Correctif Backend Requis - Relations API Platform

**Date**: 2025-11-28
**Priorité**: ⚠️ HAUTE
**Impact**: Notation des drivers, affichage des courses

---

## 🐛 Problème Identifié

Le backend renvoie actuellement les relations `driver` et `passenger` comme des **IRIs** (strings) au lieu d'**objets complets**.

### Comportement actuel (❌ INCORRECT):
```json
{
  "id": 1,
  "driver": "/api/drivers/2",        // ❌ String IRI
  "passenger": "/api/users/1",       // ❌ String IRI
  "status": "completed"
}
```

### Comportement attendu (✅ CORRECT):
```json
{
  "id": 1,
  "driver": {                        // ✅ Objet complet
    "id": 2,
    "user": {
      "id": 5,
      "firstName": "Jane",
      "lastName": "Smith",
      "rating": 4.8
    },
    "vehicleModel": "Toyota Prius",
    "vehicleType": "comfort",
    "vehicleColor": "Blanc"
  },
  "passenger": {                     // ✅ Objet complet
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "rating": 4.5
  },
  "status": "completed"
}
```

---

## 📋 Actions Requises Côté Backend

### 1. Modifier l'entité `Ride`

**Fichier**: `src/Entity/Ride.php`

```php
<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(
    normalizationContext: ['groups' => ['ride:read']],
    denormalizationContext: ['groups' => ['ride:write']]
)]
#[ORM\Entity]
class Ride
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ride:read'])]
    private ?int $id = null;

    // ⚠️ IMPORTANT: Ajouter 'ride:read' aux relations
    #[Groups(['ride:read', 'ride:write'])]
    #[ORM\ManyToOne(targetEntity: Driver::class)]
    private ?Driver $driver = null;

    #[Groups(['ride:read', 'ride:write'])]
    #[ORM\ManyToOne(targetEntity: User::class)]
    private ?User $passenger = null;

    #[Groups(['ride:read'])]
    #[ORM\Column(length: 50)]
    private ?string $status = null;

    #[Groups(['ride:read'])]
    #[ORM\Column(length: 255)]
    private ?string $pickupAddress = null;

    #[Groups(['ride:read'])]
    #[ORM\Column]
    private ?float $pickupLatitude = null;

    #[Groups(['ride:read'])]
    #[ORM\Column]
    private ?float $pickupLongitude = null;

    #[Groups(['ride:read'])]
    #[ORM\Column(length: 255)]
    private ?string $dropoffAddress = null;

    #[Groups(['ride:read'])]
    #[ORM\Column]
    private ?float $dropoffLatitude = null;

    #[Groups(['ride:read'])]
    #[ORM\Column]
    private ?float $dropoffLongitude = null;

    #[Groups(['ride:read'])]
    #[ORM\Column]
    private ?float $estimatedDistance = null;

    #[Groups(['ride:read'])]
    #[ORM\Column]
    private ?float $estimatedPrice = null;

    #[Groups(['ride:read'])]
    #[ORM\Column]
    private ?int $estimatedDuration = null;

    #[Groups(['ride:read'])]
    #[ORM\Column(nullable: true)]
    private ?float $finalPrice = null;

    #[Groups(['ride:read'])]
    #[ORM\Column(length: 50)]
    private ?string $vehicleType = null;

    // ... getters et setters
}
```

---

### 2. Modifier l'entité `Driver`

**Fichier**: `src/Entity/Driver.php`

```php
<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(
    normalizationContext: ['groups' => ['driver:read']],
    denormalizationContext: ['groups' => ['driver:write']]
)]
#[ORM\Entity]
class Driver
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['driver:read', 'ride:read'])]  // ⚠️ Ajouter 'ride:read'
    private ?int $id = null;

    // ⚠️ CRITIQUE: L'objet User DOIT être exposé
    #[Groups(['driver:read', 'ride:read'])]  // ⚠️ Ajouter 'ride:read'
    #[ORM\OneToOne(targetEntity: User::class)]
    private ?User $user = null;

    #[Groups(['driver:read', 'ride:read'])]
    #[ORM\Column(length: 100)]
    private ?string $vehicleModel = null;

    #[Groups(['driver:read', 'ride:read'])]
    #[ORM\Column(length: 50)]
    private ?string $vehicleType = null;

    #[Groups(['driver:read', 'ride:read'])]
    #[ORM\Column(length: 50)]
    private ?string $vehicleColor = null;

    #[Groups(['driver:read', 'ride:read'])]
    #[ORM\Column(length: 50)]
    private ?string $licenceNumber = null;

    #[Groups(['driver:read', 'ride:read'])]
    #[ORM\Column]
    private ?float $currentLatitude = null;

    #[Groups(['driver:read', 'ride:read'])]
    #[ORM\Column]
    private ?float $currentLongitude = null;

    #[Groups(['driver:read', 'ride:read'])]
    #[ORM\Column]
    private ?bool $isAvailable = false;

    #[Groups(['driver:read'])]
    #[ORM\Column]
    private ?bool $isVerified = false;

    // ... getters et setters
}
```

---

### 3. Modifier l'entité `User`

**Fichier**: `src/Entity/User.php`

```php
<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']]
)]
#[ORM\Entity]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    // ⚠️ Exposer id, firstName, lastName dans TOUS les contextes
    #[Groups(['user:read', 'driver:read', 'ride:read', 'passenger:read'])]
    private ?int $id = null;

    #[Groups(['user:read', 'driver:read', 'ride:read', 'passenger:read'])]
    #[ORM\Column(length: 180, unique: true)]
    private ?string $email = null;

    #[Groups(['user:read', 'driver:read', 'ride:read', 'passenger:read'])]
    #[ORM\Column(length: 100)]
    private ?string $firstName = null;

    #[Groups(['user:read', 'driver:read', 'ride:read', 'passenger:read'])]
    #[ORM\Column(length: 100)]
    private ?string $lastName = null;

    #[Groups(['user:read', 'driver:read', 'ride:read', 'passenger:read'])]
    #[ORM\Column(length: 20)]
    private ?string $phone = null;

    #[Groups(['user:read', 'driver:read', 'ride:read'])]
    #[ORM\Column(nullable: true)]
    private ?float $rating = null;

    #[Groups(['user:read'])]
    #[ORM\Column]
    private ?int $totalRides = 0;

    // ❌ NE PAS exposer le password
    #[ORM\Column]
    private ?string $password = null;

    // ... getters et setters
}
```

---

## 🧪 Tests de Validation

### Test 1: GET /api/rides/{id}

```bash
# Récupérer une course
curl -X GET http://localhost:8000/api/rides/1 \
  -H "Authorization: Bearer {votre_token}" \
  | jq '.'

# Vérifier que driver.user.firstName existe
curl -X GET http://localhost:8000/api/rides/1 \
  -H "Authorization: Bearer {votre_token}" \
  | jq '.driver.user.firstName'

# Doit afficher: "Jane" (ou le prénom du driver)
# PAS: null ou erreur
```

### Test 2: GET /api/rides (liste)

```bash
# Récupérer la liste des courses
curl -X GET http://localhost:8000/api/rides \
  -H "Authorization: Bearer {votre_token}" \
  | jq '.["hydra:member"][0].driver.user.firstName'

# Doit afficher le prénom du driver pour la première course
```

### Test 3: POST /api/rides/{id}/accept

```bash
# Accepter une course (en tant que driver)
curl -X POST http://localhost:8000/api/rides/1/accept \
  -H "Authorization: Bearer {driver_token}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq '.driver.user.firstName'

# Doit afficher le prénom du driver qui a accepté
```

---

## ✅ Critères de Succès

Après ces modifications, vous devez vérifier:

1. ✅ `GET /api/rides/{id}` renvoie `driver.user.firstName` (pas null)
2. ✅ `GET /api/rides/{id}` renvoie `driver.vehicleModel` (pas null)
3. ✅ `GET /api/rides/{id}` renvoie `passenger.firstName` (pas null)
4. ✅ `GET /api/rides` renvoie les mêmes infos pour chaque course
5. ✅ `POST /api/rides/{id}/accept` renvoie les infos complètes du driver
6. ✅ La page de notation frontend fonctionne sans erreur "Chauffeur introuvable"

---

## 🔍 Dépannage

### Problème: Les changements ne sont pas pris en compte

**Solution**:
```bash
# Vider le cache Symfony
php bin/console cache:clear

# Régénérer le cache API Platform
php bin/console api:swagger:export > /dev/null
```

### Problème: Les groupes ne fonctionnent pas

**Vérification**:
```bash
# Vérifier la config API Platform
cat config/packages/api_platform.yaml
```

Assurez-vous que les groupes de normalisation sont activés:
```yaml
api_platform:
    mapping:
        paths: ['%kernel.project_dir%/src/Entity']
    enable_swagger_ui: true
    enable_docs: true
```

### Problème: Trop d'informations exposées

Si vous exposez trop d'informations (comme les mots de passe), créez des groupes plus spécifiques:

```php
// Au lieu de:
#[Groups(['user:read', 'driver:read', 'ride:read'])]

// Utilisez des groupes différents selon le contexte:
#[Groups(['user:detail', 'ride:embed'])]
```

---

## 📚 Documentation API Platform

Pour plus d'informations sur les groupes de sérialisation:
- https://api-platform.com/docs/core/serialization/
- https://symfony.com/doc/current/components/serializer.html#attributes-groups

---

## 🎯 Après le Fix Backend

Une fois le backend corrigé:

1. **Tester les endpoints** avec les commandes curl ci-dessus
2. **Tester le frontend** sur la page de notation
3. **Supprimer le workaround frontend** (le code dans `app/passenger/ride/[id]/rate/page.tsx` qui récupère manuellement le driver)
4. **Simplifier le code frontend** pour utiliser directement `ride.driver.user`

---

## ✨ Impact

Après ce fix:
- ✅ Page de notation fonctionnelle
- ✅ Moins de requêtes API (pas besoin de récupérer le driver séparément)
- ✅ Code frontend plus simple
- ✅ Meilleure performance
- ✅ Conformité avec la documentation API_ENDPOINTS.md

---

**Besoin d'aide ?** Consultez `API_ENDPOINTS.md` pour voir les exemples complets de réponses attendues.
