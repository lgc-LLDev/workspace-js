// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>
/* eslint-disable no-await-in-loop */
/* global ll mc File */

const PLUGIN_NAME = 'Repeat';
const PLUGIN_VERSION = [0, 1, 1];

const PLUGIN_DATA_PATH = `plugins/${PLUGIN_NAME}`;
const PLUGIN_CONFIG_PATH = `${PLUGIN_DATA_PATH}/config.json`;

/**
 * @typedef {Object} Config
 * @property {string[]} keywords
 */
/** @type {Config} */
let pluginConfig = {
  keywords: ['+1'],
};

let latestMsg = '';

function updateConfig() {
  File.writeTo(PLUGIN_CONFIG_PATH, JSON.stringify(pluginConfig, null, 2));
}

function loadConfig() {
  if (File.exists(PLUGIN_CONFIG_PATH))
    pluginConfig = JSON.parse(File.readFrom(PLUGIN_CONFIG_PATH));
  else updateConfig();
}

loadConfig();

mc.listen('onChat', (player, msg) => {
  if (pluginConfig.keywords.includes(msg)) {
    player.talkAs(latestMsg);
    return false;
  }

  latestMsg = msg;
  return true;
});

ll.registerPlugin(PLUGIN_NAME, '+1', PLUGIN_VERSION, {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
