const sharp = require('sharp');

sharp('public/m1g-logo.png')
  .flatten({ background: { r: 5, g: 11, b: 20, alpha: 1 } }) // #050B14
  .toFile('public/m1g-logo-maskable.png')
  .then(() => console.log('Done'))
  .catch(console.error);
