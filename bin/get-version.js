#!/usr/bin/env node
module.exports = require('../package.json').version;
if (require.main === module) {
  console.log(module.exports);
}
