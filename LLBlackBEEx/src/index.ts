// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

import {
  pluginDescription,
  pluginExtra,
  pluginName,
  pluginVersion,
} from './const';

logger.setTitle(pluginName);

require('./command');
require('./listener');

ll.registerPlugin(pluginName, pluginDescription, pluginVersion, pluginExtra);
