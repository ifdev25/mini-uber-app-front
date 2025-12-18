/**
 * Système de traduction et personnalisation des messages d'erreur
 * Basé sur API_VALIDATION_ERRORS.md
 */

/**
 * Traductions françaises des noms de champs
 */
export const FIELD_NAMES: Record<string, string> = {
  email: 'Email',
  password: 'Mot de passe',
  firstName: 'Prénom',
  lastName: 'Nom',
  phone: 'Téléphone',
  userType: 'Type d\'utilisateur',
  pickupLocation: 'Lieu de départ',
  dropoffLocation: 'Lieu d\'arrivée',
  vehicleType: 'Type de véhicule',
  licensePlate: 'Plaque d\'immatriculation',
  rating: 'Note',
  comment: 'Commentaire',
};

/**
 * Traductions françaises des messages d'erreur backend
 * Basé sur les messages réels retournés par Symfony Validator
 */
export const ERROR_TRANSLATIONS: Record<string, string> = {
  // Email
  'This value is not a valid email address.': 'Adresse email invalide.',
  'This value should not be blank.': 'Ce champ est requis.',
  'Un compte avec cet email existe déjà.': 'Un compte avec cet email existe déjà.',

  // Longueur de chaînes
  'Your name must be at least 2 characters long': 'Le nom doit contenir au moins 2 caractères.',
  'Your name cannot be longer than 50 characters': 'Le nom ne peut pas dépasser 50 caractères.',

  // Choix invalides
  'The value you selected is not a valid choice': 'La valeur sélectionnée n\'est pas valide.',

  // Mots de passe
  'Password must be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Passwords do not match': 'Les mots de passe ne correspondent pas.',

  // Génériques
  'This field is required': 'Ce champ est requis.',
  'Invalid value': 'Valeur invalide.',
};

/**
 * Messages d'erreur spécifiques par champ
 * Permet de personnaliser le message en fonction du champ ET du type d'erreur
 */
export const FIELD_SPECIFIC_ERRORS: Record<string, Record<string, string>> = {
  email: {
    'This value should not be blank.': 'Veuillez saisir votre adresse email.',
    'This value is not a valid email address.': 'Format d\'email invalide (ex: nom@exemple.com).',
    'Un compte avec cet email existe déjà.': 'Un compte avec cet email existe déjà. Essayez de vous connecter.',
  },
  firstName: {
    'This value should not be blank.': 'Veuillez saisir votre prénom.',
    'Your name must be at least 2 characters long': 'Votre prénom doit contenir au moins 2 caractères.',
  },
  lastName: {
    'This value should not be blank.': 'Veuillez saisir votre nom.',
    'Your name must be at least 2 characters long': 'Votre nom doit contenir au moins 2 caractères.',
  },
  phone: {
    'This value should not be blank.': 'Veuillez saisir votre numéro de téléphone.',
  },
  password: {
    'This value should not be blank.': 'Veuillez saisir un mot de passe.',
  },
};

/**
 * Traduit un message d'erreur en français
 * Priorité: message spécifique au champ > traduction générique > message original
 */
export function translateErrorMessage(
  fieldName: string,
  originalMessage: string
): string {
  // 1. Vérifier si un message spécifique existe pour ce champ
  const fieldErrors = FIELD_SPECIFIC_ERRORS[fieldName];
  if (fieldErrors && fieldErrors[originalMessage]) {
    return fieldErrors[originalMessage];
  }

  // 2. Utiliser la traduction générique
  if (ERROR_TRANSLATIONS[originalMessage]) {
    return ERROR_TRANSLATIONS[originalMessage];
  }

  // 3. Si aucune traduction trouvée, retourner le message original
  return originalMessage;
}

/**
 * Obtient le nom français d'un champ
 */
export function getFieldLabel(fieldName: string): string {
  return FIELD_NAMES[fieldName] || fieldName;
}

/**
 * Formate un message d'erreur avec le nom du champ
 * Ex: "Email: Adresse email invalide."
 */
export function formatFieldError(fieldName: string, message: string): string {
  const fieldLabel = getFieldLabel(fieldName);
  const translatedMessage = translateErrorMessage(fieldName, message);

  return `${fieldLabel}: ${translatedMessage}`;
}

/**
 * Formate plusieurs erreurs de validation en un message lisible
 * avec des puces pour une meilleure lisibilité
 */
export function formatValidationErrors(
  violations: Array<{ propertyPath: string; message: string }>
): string {
  if (violations.length === 0) {
    return 'Erreur de validation';
  }

  if (violations.length === 1) {
    const { propertyPath, message } = violations[0];
    return formatFieldError(propertyPath, message);
  }

  const errorsList = violations
    .map(({ propertyPath, message }) => {
      const fieldLabel = getFieldLabel(propertyPath);
      const translatedMessage = translateErrorMessage(propertyPath, message);
      return `• ${fieldLabel}: ${translatedMessage}`;
    })
    .join('\n');

  return `Erreurs de validation:\n${errorsList}`;
}

/**
 * Messages d'erreur contextuels pour différentes situations
 */
export const CONTEXT_ERRORS = {
  // Authentification
  auth: {
    invalidCredentials: 'Email ou mot de passe incorrect.',
    accountNotVerified: 'Votre compte n\'est pas encore vérifié. Veuillez vérifier votre email.',
    accountDisabled: 'Votre compte a été désactivé. Contactez le support.',
    tokenExpired: 'Votre session a expiré. Veuillez vous reconnecter.',
  },

  // Connexion réseau
  network: {
    offline: 'Vous êtes hors ligne. Vérifiez votre connexion internet.',
    timeout: 'La requête a pris trop de temps. Veuillez réessayer.',
    serverUnreachable: 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.',
  },

  // Serveur
  server: {
    internalError: 'Erreur serveur interne. Veuillez réessayer plus tard.',
    maintenance: 'Le service est temporairement indisponible pour maintenance.',
  },
};

/**
 * Obtient un message d'erreur contextuel
 */
export function getContextError(category: keyof typeof CONTEXT_ERRORS, key: string): string {
  const categoryErrors = CONTEXT_ERRORS[category];
  if (categoryErrors && key in categoryErrors) {
    return categoryErrors[key as keyof typeof categoryErrors];
  }
  return 'Une erreur est survenue.';
}
