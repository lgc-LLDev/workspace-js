// LiteLoaderScript Dev Helper
/// <reference path="c:\Users\Administrator\Desktop\llse\LLSEPlugins\.vscode\Library/dts/llaids/src/index.d.ts"/>

const entityNames = {
  'minecraft:area_effect_cloud': '区域效果云',
  'minecraft:armor_stand': '盔甲架',
  'minecraft:arrow': '箭',
  'minecraft:bat': '蝙蝠',
  'minecraft:bee': '蜜蜂',
  'minecraft:blaze': '烈焰人',
  'minecraft:boat': '船',
  'minecraft:cat': '猫',
  'minecraft:cave_spider': '洞穴蜘蛛',
  'minecraft:chicken': '鸡',
  'minecraft:cow': '牛',
  'minecraft:creeper': '苦力怕',
  'minecraft:dolphin': '海豚',
  'minecraft:goat': '山羊',
  'minecraft:panda': '熊猫',
  'minecraft:donkey': '驴',
  'minecraft:dragon_fireball': '末影龙火球',
  'minecraft:drowned': '溺尸',
  'minecraft:egg': '鸡蛋',
  'minecraft:elder_guardian': '远古守卫者',
  'minecraft:ender_crystal': '末地水晶',
  'minecraft:ender_dragon': '末影龙',
  'minecraft:enderman': '末影人',
  'minecraft:endermite': '末影螨',
  'minecraft:ender_pearl': '末影珍珠',
  'minecraft:evocation_illager': '唤魔者',
  'minecraft:evocation_fang': '唤魔者尖牙',
  'minecraft:eye_of_ender_signal': '末影之眼',
  'minecraft:falling_block': '掉落中的方块',
  'minecraft:fireball': '火球',
  'minecraft:fireworks_rocket': '烟花火箭',
  'minecraft:fishing_hook': '鱼钩',
  'minecraft:fish.clownfish': '小丑鱼',
  'minecraft:fox': '狐狸',
  'minecraft:cod': '鳕鱼',
  'minecraft:pufferfish': '河豚',
  'minecraft:salmon': '鲑鱼',
  'minecraft:tropicalfish': '热带鱼',
  'minecraft:axolotl': '美西螈',
  'minecraft:ghast': '恶魂',
  'minecraft:glow_squid': '发光鱿鱼',
  'minecraft:piglin_brute': '猪灵蛮兵',
  'minecraft:guardian': '守卫者',
  'minecraft:hoglin': '疣猪兽',
  'minecraft:horse': '马',
  'minecraft:husk': '尸壳',
  'minecraft:ravager': '劫掠兽',
  'minecraft:iron_golem': '铁傀儡',
  'minecraft:item': '掉落物',
  'minecraft:leash_knot': '拴绳结',
  'minecraft:lightning_bolt': '闪电',
  'minecraft:lingering_potion': '滞留药水',
  'minecraft:llama': '羊驼',
  'minecraft:trader_llama': '行商羊驼',
  'minecraft:llama_spit': '羊驼唾沫',
  'minecraft:magma_cube': '岩浆怪',
  'minecraft:minecart': '矿车',
  'minecraft:chest_minecart': '运输矿车',
  'minecraft:command_block_minecart': '命令方块矿车',
  'minecraft:furnace_minecart': '动力矿车',
  'minecraft:hopper_minecart': '漏斗矿车',
  'minecraft:tnt_minecart': 'TNT矿车',
  'minecraft:mule': '骡',
  'minecraft:mooshroom': '哞菇',
  'minecraft:moving_block': '移动中的方块',
  'minecraft:ocelot': '豹猫',
  'minecraft:painting': '画',
  'minecraft:parrot': '鹦鹉',
  'minecraft:phantom': '幻翼',
  'minecraft:pig': '猪',
  'minecraft:piglin': '猪灵',
  'minecraft:pillager': '掠夺者',
  'minecraft:polar_bear': '北极熊',
  'minecraft:rabbit': '兔子',
  'minecraft:sheep': '绵羊',
  'minecraft:shulker': '潜影贝',
  'minecraft:shulker_bullet': '潜影弹',
  'minecraft:silverfish': '蠹虫',
  'minecraft:skeleton': '骷髅',
  'minecraft:skeleton_horse': '骷髅马',
  'minecraft:stray': '流浪者',
  'minecraft:slime': '史莱姆',
  'minecraft:small_fireball': '小火球',
  'minecraft:snowball': '雪球',
  'minecraft:snow_golem': '雪傀儡',
  'minecraft:spider': '蜘蛛',
  'minecraft:splash_potion': '药水',
  'minecraft:squid': '鱿鱼',
  'minecraft:strider': '炽足兽',
  'minecraft:tnt': 'TNT',
  'minecraft:thrown_trident': '三叉戟',
  'minecraft:tripod_camera': '相机',
  'minecraft:turtle': '海龟',
  'minecraft:unknown': '未知',
  'minecraft:vex': '恼鬼',
  'minecraft:villager': '村民',
  'minecraft:villager_v2': '村民',
  'minecraft:vindicator': '卫道士',
  'minecraft:wandering_trader': '流浪商人',
  'minecraft:witch': '女巫',
  'minecraft:wither': '凋灵',
  'minecraft:wither_skeleton': '凋灵骷髅',
  'minecraft:wither_skull': '凋灵头颅',
  'minecraft:wither_skull_dangerous': '危险的凋灵头颅',
  'minecraft:wolf': '狼',
  'minecraft:xp_orb': '经验球',
  'minecraft:xp_bottle': '附魔之瓶',
  'minecraft:zoglin': '僵尸疣猪兽',
  'minecraft:zombie': '僵尸',
  'minecraft:zombie_horse': '僵尸马',
  'minecraft:zombie_pigman': '僵尸猪灵',
  'minecraft:zombie_villager': '僵尸村民',
  'minecraft:zombie_villager_v2': '僵尸村民',
  'minecraft:frog': '青蛙',
  'minecraft:tadpole': '蝌蚪',
  'minecraft:warden': '监守者',
  'minecraft:allay': '悦灵',
  'minecraft:chest_boat': '运输船',
  'minecraft:balloon': '气球',
  'minecraft:ice_bomb': '冰弹',
};

function objectToStr(obj) {
  const tmpLi = [];
  Object.entries(obj)
    .sort((x, y) => y[1] - x[1])
    .forEach((x) => {
      const [k, v] = x;
      tmpLi.push(`§a${k} §r* §6${v}§r`);
    });
  return tmpLi.join('\n');
}

const cmdEntC = mc.newCommand('entc', '查看服务器当前实体数量', PermType.Any);

cmdEntC.optional('targets', ParamType.Actor);
cmdEntC.optional('showAnalytics', ParamType.Bool);
cmdEntC.overload(['showAnalytics', 'targets']);
cmdEntC.setCallback(
  (
    _,
    origin,
    out,
    /** @type {{targets?:Entity[],showAnalytics?:boolean}} */ res
  ) => {
    let { targets, showAnalytics } = res;
    const { player } = origin;
    let isSelector = true;

    if (!targets) {
      targets = mc.getAllEntities();
      isSelector = false;
    }
    // if (showAnalytics === undefined) showAnalytics = true;

    const count = targets.length;

    /** @type {{[type:string]:number}} */
    const analytic = {};
    const itemAnalytic = {};
    targets.forEach((e) => {
      const { type, name } = e;
      const disName = entityNames[type] || name;
      const num = analytic[disName] || 0;
      analytic[disName] = num + 1;

      if (type === 'minecraft:item') {
        const itNum = itemAnalytic[name] || 0;
        itemAnalytic[name] = itNum + 1;
      }
    });

    const targetTip = isSelector
      ? `§d目标选择器§r已选择`
      : '§d当前服务器§r已加载';

    let analyticTip = '';
    if (count !== 0 && showAnalytics) {
      const tmpLi = [
        `\n==============\n以下是已统计实体及数量：\n${objectToStr(analytic)}`,
      ];
      if (Object.keys(itemAnalytic).length > 0)
        tmpLi.push(
          `==============\n在这些实体中，§d掉落物§r的名称与数量：\n` +
            `${objectToStr(itemAnalytic)}`
        );
      analyticTip = tmpLi.join('\n');
    }

    const tip = `${targetTip} §l§6${count} §r个实体${analyticTip}`;
    if (player && showAnalytics) {
      player.sendForm(
        mc.newSimpleForm().setTitle('§b实体数量查看').setContent(tip),
        () => {}
      );
    } else {
      out.success(`§b[实体数量查看] ${tip}`);
    }
  }
);
cmdEntC.setup();

ll.registerPlugin('EntityCounter', '实体数量查看', [0, 0, 1], {});
