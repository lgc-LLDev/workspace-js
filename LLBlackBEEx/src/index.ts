// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>

import {
  PLUGIN_DESCRIPTION,
  PLUGIN_EXTRA,
  PLUGIN_NAME,
  PLUGIN_VERSION,
} from './const';

logger.setTitle(PLUGIN_NAME);

require('./command');
require('./listener');

ll.registerPlugin(
  PLUGIN_NAME,
  PLUGIN_DESCRIPTION,
  PLUGIN_VERSION,
  PLUGIN_EXTRA
);
