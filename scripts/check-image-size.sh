#!/bin/bash

# Configuration
MAX_SIZE_BYTES=$((1 * 1024 * 1024))  # 1MB en bytes
MAX_SIZE_HUMAN="1MB"
DIRS_TO_CHECK=("public" "assets")
IMAGE_EXTENSIONS=("jpg" "jpeg" "png" "gif" "webp" "svg" "bmp" "ico")

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Vérification de la taille des images...${NC}"
echo ""

# Construire le pattern pour find
extensions_pattern=""
for ext in "${IMAGE_EXTENSIONS[@]}"; do
    if [ -z "$extensions_pattern" ]; then
        extensions_pattern="-name \"*.${ext}\""
    else
        extensions_pattern="${extensions_pattern} -o -name \"*.${ext}\""
    fi
done

# Variables pour tracker les erreurs
has_error=0
oversized_files=()

# Parcourir chaque dossier
for dir in "${DIRS_TO_CHECK[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "📁 Vérification du dossier: ${YELLOW}${dir}${NC}"

        # Trouver toutes les images
        while IFS= read -r -d '' file; do
            if [ -f "$file" ]; then
                # Obtenir la taille du fichier
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    # macOS
                    file_size=$(stat -f%z "$file")
                else
                    # Linux
                    file_size=$(stat -c%s "$file")
                fi

                # Convertir en format lisible
                if [ $file_size -ge 1048576 ]; then
                    size_human="$(echo "scale=2; $file_size/1048576" | bc)MB"
                elif [ $file_size -ge 1024 ]; then
                    size_human="$(echo "scale=2; $file_size/1024" | bc)KB"
                else
                    size_human="${file_size}B"
                fi

                # Vérifier si le fichier dépasse la limite
                if [ $file_size -gt $MAX_SIZE_BYTES ]; then
                    echo -e "  ${RED}✗ ${file} (${size_human})${NC}"
                    has_error=1
                    oversized_files+=("$file ($size_human)")
                else
                    echo -e "  ${GREEN}✓ ${file} (${size_human})${NC}"
                fi
            fi
        done < <(find "$dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" -o -name "*.bmp" -o -name "*.ico" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.PNG" -o -name "*.GIF" -o -name "*.WEBP" -o -name "*.SVG" -o -name "*.BMP" -o -name "*.ICO" \) -print0 2>/dev/null)

        echo ""
    fi
done

# Résultat final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $has_error -eq 1 ]; then
    echo -e "${RED}❌ PUSH BLOQUÉ${NC}"
    echo ""
    echo -e "${RED}Les images suivantes dépassent la limite de ${MAX_SIZE_HUMAN}:${NC}"
    for file in "${oversized_files[@]}"; do
        echo -e "  ${RED}• ${file}${NC}"
    done
    echo ""
    echo -e "${YELLOW}💡 Solutions possibles:${NC}"
    echo "  1. Compresser les images avec un outil comme TinyPNG, ImageOptim"
    echo "  2. Réduire les dimensions des images"
    echo "  3. Convertir en format WebP pour une meilleure compression"
    echo "  4. Utiliser: npx @squoosh/cli --webp auto <image>"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Toutes les images sont conformes (< ${MAX_SIZE_HUMAN})${NC}"
    exit 0
fi
