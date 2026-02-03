const fs = require('fs');
const path = require('path');

// Couleurs ANSI pour le terminal
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  reset: '\x1b[0m'
};

// Configuration par défaut
const defaultConfig = {
  maxSize: '1MB',
  directories: ['public', 'assets'],
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
};

/**
 * Convertit une taille lisible en bytes
 * @param {string|number} size - Taille (ex: '1MB', '500KB', 1048576)
 * @returns {number} Taille en bytes
 */
function parseSize(size) {
  if (typeof size === 'number') {
    return size;
  }

  const sizeStr = size.toString().toUpperCase().trim();

  // Regex pour extraire le nombre et l'unité
  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);

  if (!match) {
    console.warn(`Format de taille invalide: ${size}. Utilisation de 1MB par défaut.`);
    return 1 * 1024 * 1024;
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  const multipliers = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };

  return Math.floor(value * (multipliers[unit] || 1));
}

/**
 * Formate une taille en bytes en format lisible
 * @param {number} bytes - Taille en bytes
 * @returns {string} Taille formatée
 */
function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  } else if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  }
  return `${bytes}B`;
}

/**
 * Récupère récursivement tous les fichiers d'un dossier
 * @param {string} dir - Chemin du dossier
 * @param {string[]} extensions - Extensions à rechercher
 * @returns {string[]} Liste des fichiers trouvés
 */
function getFilesRecursively(dir, extensions) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase().slice(1);
      if (extensions.includes(ext.toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Normalise les extensions (retire les points, met en minuscule)
 * @param {string[]} extensions - Liste des extensions
 * @returns {string[]} Extensions normalisées
 */
function normalizeExtensions(extensions) {
  return extensions.map(ext => ext.toLowerCase().replace(/^\./, ''));
}

/**
 * Vérifie la taille des images
 * @param {Object} config - Configuration
 * @returns {Object} Résultat de la vérification
 */
function checkImages(config = {}) {
  const options = { ...defaultConfig, ...config };

  // Convertir maxSize en bytes si c'est une string
  const maxSizeBytes = parseSize(options.maxSize);
  const directories = options.directories;
  const extensions = normalizeExtensions(options.extensions);

  console.log(`${colors.yellow}🔍 Vérification de la taille des images...${colors.reset}`);
  console.log(`   Limite: ${formatSize(maxSizeBytes)} | Dossiers: ${directories.join(', ')} | Extensions: ${extensions.join(', ')}\n`);

  const oversizedFiles = [];
  let totalChecked = 0;
  let dirsFound = 0;

  for (const dir of directories) {
    const dirPath = path.resolve(process.cwd(), dir);

    if (fs.existsSync(dirPath)) {
      dirsFound++;
      console.log(`📁 Vérification du dossier: ${colors.yellow}${dir}${colors.reset}`);

      const files = getFilesRecursively(dirPath, extensions);

      if (files.length === 0) {
        console.log(`   ${colors.yellow}(aucune image trouvée)${colors.reset}`);
      }

      for (const file of files) {
        const stats = fs.statSync(file);
        const fileSize = stats.size;
        const relativePath = path.relative(process.cwd(), file);
        const sizeHuman = formatSize(fileSize);

        totalChecked++;

        if (fileSize > maxSizeBytes) {
          console.log(`  ${colors.red}✗ ${relativePath} (${sizeHuman})${colors.reset}`);
          oversizedFiles.push({ path: relativePath, size: fileSize, sizeHuman });
        } else {
          console.log(`  ${colors.green}✓ ${relativePath} (${sizeHuman})${colors.reset}`);
        }
      }

      console.log('');
    }
  }

  if (dirsFound === 0) {
    console.log(`${colors.yellow}⚠️  Aucun des dossiers configurés n'existe: ${directories.join(', ')}${colors.reset}\n`);
  }

  // Résultat final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (oversizedFiles.length > 0) {
    console.log(`${colors.red}❌ PUSH BLOQUÉ${colors.reset}\n`);
    console.log(`${colors.red}Les images suivantes dépassent la limite de ${formatSize(maxSizeBytes)}:${colors.reset}`);

    for (const file of oversizedFiles) {
      console.log(`  ${colors.red}• ${file.path} (${file.sizeHuman})${colors.reset}`);
    }

    console.log(`\n${colors.yellow}💡 Solutions possibles:${colors.reset}`);
    console.log('  1. Compresser les images avec TinyPNG, ImageOptim');
    console.log('  2. Réduire les dimensions des images');
    console.log('  3. Convertir en format WebP pour une meilleure compression');
    console.log('  4. Utiliser: npx @squoosh/cli --webp auto <image>\n');

    return {
      success: false,
      totalChecked,
      oversizedFiles,
      maxSizeBytes
    };
  }

  console.log(`${colors.green}✅ Toutes les images sont conformes (< ${formatSize(maxSizeBytes)})${colors.reset}`);
  console.log(`   ${totalChecked} image(s) vérifiée(s)\n`);

  return {
    success: true,
    totalChecked,
    oversizedFiles: [],
    maxSizeBytes
  };
}

/**
 * Charge la configuration depuis un fichier
 * @returns {Object} Configuration chargée
 */
function loadConfig() {
  const configPaths = [
    'image-guard.config.js',
    'image-guard.config.json',
    '.imageguardrc',
    '.imageguardrc.json'
  ];

  for (const configPath of configPaths) {
    const fullPath = path.resolve(process.cwd(), configPath);

    if (fs.existsSync(fullPath)) {
      console.log(`📄 Configuration chargée: ${configPath}\n`);

      if (configPath.endsWith('.js')) {
        // Clear require cache pour recharger les modifications
        delete require.cache[fullPath];
        return require(fullPath);
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(content);
      }
    }
  }

  // Chercher dans package.json
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.imageGuard) {
      console.log(`📄 Configuration chargée depuis: package.json\n`);
      return packageJson.imageGuard;
    }
  }

  return {};
}

module.exports = {
  checkImages,
  loadConfig,
  parseSize,
  formatSize,
  defaultConfig
};
