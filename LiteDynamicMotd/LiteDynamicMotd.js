// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>
/* global mc File */

const PLUGIN_NAME = 'LiteDynamicMotd';
// const PLUGIN_VERSION = [0, 1, 0];

const PLUGIN_DATA_PATH = `plugins/${PLUGIN_NAME}`;
const PLUGIN_CONFIG_PATH = `${PLUGIN_DATA_PATH}/config.json`;

let pluginConfig = {
  motdList: ['这是第一个Motd', '这是第二个Motd', '这是第三个Motd'],
  switchInterval: 5000,
};

function updateConfig() {
  File.writeTo(PLUGIN_CONFIG_PATH, JSON.stringify(pluginConfig, null, 2));
}

function loadConfig() {
  if (File.exists(PLUGIN_CONFIG_PATH))
    pluginConfig = JSON.parse(File.readFrom(PLUGIN_CONFIG_PATH));
  else updateConfig();
}

loadConfig();

let nextMotdIndex = 0;

function changeMotd() {
  const { motdList } = pluginConfig;

  const motd = motdList[nextMotdIndex];
  mc.setMotd(motd);
  // log(motd);

  if (nextMotdIndex === motdList.length - 1) nextMotdIndex = 0;
  else nextMotdIndex += 1;
}

mc.listen('onServerStarted', () => {
  setInterval(changeMotd, pluginConfig.switchInterval);
  changeMotd();
});
