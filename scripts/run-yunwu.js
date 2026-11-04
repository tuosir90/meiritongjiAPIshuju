// Compatibility entry for the former ZIKL command name.
const zikl = require('./run-zikl.js');

if (require.main === module) {
  zikl.main();
}

module.exports = zikl;
