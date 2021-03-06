const fs = require('fs-extra')
const logger = require('./logger')
const klaw = require('klaw-sync')
const os = require('os')
const path = require('path')
const semver = require('semver')
const simplegit = require('simple-git/promise')
const yinstall = require('yarn-install')

const _git = simplegit()
  .silent(true)

function getAppVersion(dpath) {
  if (os.platform() === 'win32') {
    const apps = klaw(dpath, {
      nofile: true,
      filter: (item) => item.path.match(/[/|\\]app-(\d+.\d+.\d+)[/|\\]/i)
    })
    const versions = []
    apps.forEach((app) => {
      const path = app.path
      const matches = path.match(/[/|\\]app-(\d+.\d+.\d+)[/|\\]/i)
      if (matches.length < 2) return
      versions.push(matches[1])
    })
    versions.sort(semver.rcompare)
    appVersion = versions[0]
    return appVersion
  }
  return '0.0.198'
}

const cloneUrl = 'https://github.com/CustomDiscord/Engine.git'

class Installer {
  constructor(path) {
    /**
     * The path to the Discord install (where app folders are)
     * @type {String}
     */
    this.path = path
  }
  /**
   * Install
   * @returns {Boolean}
   */
  async install() {
    const git = _git
    const dpath = this.path
    const clonePath = path.join(dpath, 'CustomDiscord')
    let appVersion = getAppVersion(dpath)
    const appPath = os.platform() === 'win32' ? path.join(dpath, `app-${appVersion}`, 'resources', 'app') : path.join(dpath, 'resources', 'app')
    
    let firstPass = true
    logger.info('Cloning CustomDiscord Engine...')
    try {
      const cloneResp = await git.clone(cloneUrl, clonePath)
      logger.info('Installing dependencies...')
      yinstall({ cwd: clonePath })
      logger.info('Inserting injector into Discord...')
      try {
        await fs.ensureDir(appPath)
      } catch(err) {
        logger.error('Failed to make app directory in Discord...', err)
        return false
      }
      try {
        await fs.copy(path.join(__dirname, 'files'), appPath)
      } catch(err) {
        logger.error('Failed to copy files to Discord...', err)
        return false
      }
      return true
    } catch (err) {
      logger.error('Failed to clone the CustomDiscord Engine repository!', err)
      return false
    }
  }

  async update() {
    const dpath = this.path
    const clonePath = path.join(dpath, 'CustomDiscord')
    let appVersion = getAppVersion(dpath)
    const appPath = os.platform() === 'win32' ? path.join(dpath, `app-${appVersion}`, 'resources', 'app') : path.join(dpath, 'resources', 'app')
    const git = simplegit(clonePath)
      .silent(true)
    logger.info('Pulling CustomDiscord Engine...')
    try {
      await git.pull('origin', 'master')
      logger.info('Pulled from repo successfully!')
      logger.info('Re-installing dependencies...')
      yinstall({ cwd: clonePath })
      logger.info('Updating injector in Discord...')
      try {
        await fs.ensureDir(appPath)
      } catch(err) {
        logger.error('Failed to make app directory in Discord...', err)
        return false
      }
      try {
        await fs.copy(path.join(__dirname, 'files'), appPath)
      } catch(err) {
        logger.error('Failed to copy files to Discord...', err)
        return false
      }
      return true
    } catch (err) {
      logger.error('Failed to pull the CustomDiscord Engine repository!', err)
      return false
    }
  }

  async uninstall() {
    const dpath = this.path
    const clonePath = path.join(dpath, 'CustomDiscord')
    let appVersion = '0.0.198'
    if (os.platform() === 'win32') {
      const apps = klaw(dpath, {
        nofile: true,
        filter: (item) => item.path.match(/[/|\\]app-(\d+.\d+.\d+)[/|\\]/i)
      })
      const versions = []
      apps.forEach((app) => {
        const path = app.path
        const matches = path.match(/[/|\\]app-(\d+.\d+.\d+)[/|\\]/i)
        if (matches.length < 2) return
        versions.push(matches[1])
      })
      versions.sort(semver.rcompare)
      appVersion = versions[0]
    }
    const appPath = os.platform() === 'win32' ? path.join(dpath, `app-${appVersion}`, 'resources', 'app') : path.join(dpath, 'resources', 'app')
    try {
      logger.info('Deleting repo...')
      await fs.remove(clonePath)
      logger.info('Removing injector...')
      await fs.remove(appPath)
      return true
    } catch(err) {
      logger.error('Failed to uninstall...', err)
      return false
    }
  }

  installed() {
    const dpath = this.path
    const clonePath = path.join(dpath, 'CustomDiscord')
    return fs.existsSync(clonePath)
  }

  installedVersion() {
    if (!this.installed()) return '0.0.0'
    const dpath = this.path
    const pkg = require(path.join(dpath, 'CustomDiscord', 'package.json'))
    return pkg.version
  }
}

module.exports = Installer