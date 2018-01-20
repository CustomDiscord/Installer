/**
 * customdiscord-installer
 * 
 * File...................logger.js
 * Created on.............Saturday, 20th January 2018 9:48:41 am
 * Created by.............Relative
 * 
 */
const winston = require('winston')
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
})

module.exports = logger