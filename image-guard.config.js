/**
 * Configuration pour husky-image-guard
 * Documentation: https://github.com/your-username/husky-image-guard
 */

module.exports = {
  /**
   * Taille maximale autorisée pour les images
   * Formats supportés: '500KB', '1MB', '2MB', ou en bytes (1048576)
   */
  maxSize: '2MB',

  /**
   * Dossiers à analyser pour les images
   * Chemins relatifs à la racine du projet
   */
  directories: [
    'public',
    'assets'
  ],

  /**
   * Extensions de fichiers à vérifier
   * Sans le point (ex: 'jpg' et non '.jpg')
   */
  extensions: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'bmp',
    'ico'
  ]
};
