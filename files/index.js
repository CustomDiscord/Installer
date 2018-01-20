const path = require('path')
const os = require('os')
const cd = os.platform() === 'win32'
  ? path.join(__dirname, '..', '..', '..', 'CustomDiscord', 'index.js')
  : path.join(__dirname, '..', '..', 'CustomDiscord', 'index.js')
require(cd).inject(__dirname);
