/*global module, require, process*/
'use strict'
var fs = require('fs')
var path = require('path')
var urljoin = require('url-join')
var chalk = require('chalk')
chalk.enabled = true
var _ = require('lodash')
var _root = process.cwd()
/**
 * Expose the configProvider
 */
module.exports = ConfigProvider

/**
 * Get the configuration object. If the configFile not exist, get the default configuration.
 * @alias module:init.getConfig
 * @returns  {object} the configuration object
 */
function ConfigProvider (providedConfig) {
  this.providedConfig = providedConfig
  this.getConfig = function () {
    if (this.providedConfig && typeof this.providedConfig === 'object') {
      return _initConfig(this.providedConfig)
    } else {
      var configFile = _getConfigFile()
      console.log('Using config from file \'' + configFile + '\'')
      if (fs.existsSync(configFile)) {
        var configObjectFromFile = JSON.parse(fs.readFileSync(configFile, 'utf8'))
        return _initConfig(configObjectFromFile)
      } else {
        throw new Error(configFile + ' not found.')
      }
    }
  }
}

/**
 * Initialize the configObj
 * @param {object} providedConfig - content of configFileconfigFileData
 * @returns {{nano: Object, path: Object, db: string}}
 */
function _initConfig (providedConfig) {
  var defaultConfig = {
    source: '.',
    target: {
      url: 'https://www.cubbles.world/sandbox',
      path: '_api/upload',
      proxy: ''
    },
    debug: false
  }

  var mergedConfig = _.merge(defaultConfig, providedConfig)
  // remove store-info from mergedConfig.target.url AND use it in nano.db property
  var store = mergedConfig.target.url.replace(/https?:\/\/[^/]+\/?/, '')
  mergedConfig.target.url = mergedConfig.target.url.replace(store, '')
  var tmpUrl = mergedConfig.target.url
  mergedConfig.target.url = tmpUrl.endsWith('/') ? tmpUrl.substring(0, tmpUrl.length - 1) : tmpUrl
  // create the config object
  return {
    nano: _initNanoConfig(mergedConfig),
    sourcePath: path.resolve(_root, mergedConfig.source),
    apiPath: urljoin(store, mergedConfig.target.path),
    debug: mergedConfig.debug
  }
}

/**
 * Get the absolute path to the config file.
 * @returns {string | undefined} path to config file
 */
function _getConfigFile () {
  var configFileArg = (process.argv[ 2 ] && process.argv[ 2 ].indexOf('--') === -1 &&
  process.argv[ 2 ].indexOf('mochaTest') === -1) ? process.argv[ 2 ] : undefined
  var configPath = configFileArg || process.env.npm_config_configPath || path.join('..', 'config.json')
  return (configPath) ? path.resolve(_root, configPath) : undefined
}

/**
 * Get the nanoconfig. If not all values contains in ConfigFile, the default values will be initialize.
 * @returns {Object} nanaConfigObj
 * @param {Object} config
 */
function _initNanoConfig (config) {
  return {
    'url': config.target.url,
    'requestDefaults': { 'proxy': config.target.proxy },
    'log': function (id, args) {
      if (config.debug) {
        console.log(chalk.gray('** Debug (uploader.nano): %s'), JSON.stringify(id, null, '\t'))
      }
    }
  }
}
