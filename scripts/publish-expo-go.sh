#!/bin/bash
set -e

echo "=============================================="
echo "  Publish to Expo Go via EAS Update"
echo "=============================================="

if [ -z "$EXPO_TOKEN" ]; then
  echo "ERROR: secret EXPO_TOKEN manquant."
  echo "Ajoute-le via le panneau Secrets puis relance."
  exit 1
fi

MSG="${UPDATE_MESSAGE:-Update $(date '+%Y-%m-%d %H:%M')}"

# Nettoie le cache npx pour éviter l'erreur ECOMPROMISED
rm -rf ~/.npm/_npx/ 2>/dev/null || true

cd "$(dirname "$0")/../artifacts/jatek-mobile"

echo "[1/2] Authentification EAS..."
EXPO_TOKEN="$EXPO_TOKEN" eas whoami

echo
echo "[2/2] Publication OTA vers Expo Go (branche: main)..."
EXPO_TOKEN="$EXPO_TOKEN" \
EXPO_PUBLIC_GOOGLE_MAPS_KEY="$GOOGLE_API_KEY" \
EXPO_PUBLIC_GOOGLE_PLACES_KEY="$GOOGLE_API_KEY" \
  eas update \
    --branch main \
    --message "$MSG" \
    --non-interactive

echo
echo "================================================================"
echo "  Mise à jour OTA publiée (branche: main)"
echo
echo "  Tableau de bord :"
echo "  https://expo.dev/accounts/myjantes/projects/jatek-mobile/updates"
echo
echo "  L'APK Preview reçoit cette mise à jour automatiquement"
echo "  au prochain démarrage (canal 'main' configuré dans eas.json)."
echo
echo "  Pour ouvrir directement dans Expo Go (si APK Preview installé) :"
echo "  exp://u.expo.dev/24f32081-ec5b-4040-9694-24e08de7e7c7?channel-name=main&runtime-version=exposdk%3A54.0.0"
echo
echo "  REMARQUE : exp.host/@myjantes/jatek-mobile est l'ancienne URL"
echo "  Classic Updates (SDK < 49) — elle ne fonctionne plus avec EAS Update."
echo "  Utilisez l'APK Preview pour distribuer l'app."
echo "================================================================"
