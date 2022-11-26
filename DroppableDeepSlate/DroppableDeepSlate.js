// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>
/* global ll mc */

mc.listen('onDestroyBlock', (player, block) => {
  if (
    !player.isCreative &&
    player.getHand().type === 'minecraft:netherite_pickaxe' &&
    block.type === 'minecraft:reinforced_deepslate'
  ) {
    mc.spawnItem(mc.newItem('minecraft:reinforced_deepslate', 1), block.pos);
  }
});

ll.registerPlugin('DroppableDeepSlate', '让强化深板岩掉落物品', [0, 1, 0], {});
