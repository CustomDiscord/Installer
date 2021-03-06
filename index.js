#!/usr/bin/env node
const Installer = require('./Installer')
const chalk = require('chalk')
const fp = require('find-process')
const fpath = require('path')
const inquirer = require('inquirer')
const logger = require('./logger')
const os = require('os')
const promisify = require('util').promisify
const ps = require('ps-man')
const pskill = promisify(ps.kill)

const program = require('commander')

async function getDiscordProcesses() {
  const _processes = await fp('name', 'Discord')
  const processes = {}
  const paths = {}
  const _pids = {}
  _processes.forEach((proc) => {
    const name = proc.name
    processes[name] = processes[name] || []
    processes[name].push(proc)
  })
  const entries = []
  for (const [k,v] of Object.entries(processes)) {
    const pids = []
    let path
    v.forEach((proc) => {
      pids.push(proc.pid.toString())
      path = proc.cmd.split(' ')[0].replace('"', '').replace('"', '')
      if (os.platform() === 'win32') path = fpath.join(path, '..', '..')
      if (os.platform() !== 'win32') path = fpath.join(path, '..')
    })
    paths[k] = path
    _pids[k] = pids
    entries.push({
      name: `${k} (${pids.join(', ')}) - ${path}`,
      value: k
    })
  }
  return [paths, entries, _pids]
}

async function makeInstaller() {
  const processes = await getDiscordProcesses()
  const paths = processes[0]
  const entries = processes[1]
  const _pids = processes[2]
  entries.push(new inquirer.Separator('========'))
  entries.push(new inquirer.Separator('Paths may be incorrect for processes other than Discord!'))
  const answers = await inquirer.prompt([{
    type: 'list',
    name: 'discord',
    message: 'Pick a process',
    choices: entries
  }])
  const answer = answers.discord
  const path = paths[answer]
  const pids = _pids[answer]
  console.log(pids)
  try {
    await pskill(pids)
  } catch(err) {
    logger.error('Failed to kill Discord processes. Try again, maybe run as administrator (if on windows)', err)
    process.exit(1)
  }
  const installer = new Installer(path)
  return installer
}

async function go(action) {
  const installer = await makeInstaller()
  if (action === 'install') {
    logger.info('Installing CustomDiscord...')
    const result = await installer.install()
    logger.info('Done installing CustomDiscord...')
    if (!result) {
      logger.error('An error occurred while installing. Try again later.')
      return process.exit(1)
    }
    logger.info('Complete!')
    logger.info('CustomDiscord has installed successfully!')
    process.exit(0)
  } else if (action === 'update') {
    logger.info('Updating CustomDiscord...')
    const result = await installer.update()
    logger.info('Complete!')
    process.exit(0)
  } else if (action === 'uninstall') {
    logger.info('We\'re sad to see you go. :(')
    logger.info('Uninstalling CustomDiscord...')
    const result = await installer.uninstall()
    logger.info('Done uninstalling CustomDiscord...')
    if (!result) {
      logger.error('An error occurred while uninstalling. Try again later.')
      return process.exit(1)
    }
    logger.info('Complete!')
    logger.info('CustomDiscord is uninstalled.')
    process.exit(0)
  } else if (action === 'version') {
    logger.info(`CustomDiscord Installer: v${require('./package.json').version}`)
    if (installer.installed()) {
      logger.info(`CustomDiscord Engine: v${installer.installedVersion()}`)
    }
    process.exit(0)
  }
}

program
  .name('customdiscord')
  .version(require('./package.json').version)

program
  .command('install')
  .action(() => go('install'))

program
  .command('update')
  .action(() => go('update'))

program
  .command('uninstall')
  .action(() => go('uninstall'))

program
  .command('version')
  .action(() => go('version'))

program.parse(process.argv)

if (!process.argv.slice(2).length) program.outputHelp()