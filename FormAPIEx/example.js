// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>
/* global ll mc logger PermType File */

const {
  CustomFormEx,
  SimpleFormEx,
  sendModalFormAsync,
} = require('./lib/FormAPIEx');

const PLUGIN_NAME = 'FormAPIExExample';

/**
 * 功能性函数，用 setTimeout 调用异步函数，以免出现玄学问题
 * @template {unknown[]} T
 * @param {(...args: T) => Promise<unknown>} func
 * @returns {(...args: T) => void}
 */
function wrapAsyncFunc(func) {
  return (...args) => {
    setTimeout(
      () => func(...args).catch((e) => logger.error(`${e}\n${e.stack ?? ''}`)),
      0
    );
  };
}

// 异步发送确认取消表单
const cmdTestModalForm = mc.newCommand('testmodal', PLUGIN_NAME, PermType.Any);
cmdTestModalForm.overload();
cmdTestModalForm.setCallback((_, { player }) => {
  if (!player) return false;

  wrapAsyncFunc(async () => {
    const result = await sendModalFormAsync(
      player,
      PLUGIN_NAME,
      'A test ModalForm~'
    );
    player.tell(String(result));
  })();

  return true;
});
cmdTestModalForm.setup();

// 异步自定义表单，带格式化返回值为object
const cmdTestCustomForm = mc.newCommand(
  'testcustom',
  PLUGIN_NAME,
  PermType.Any
);
cmdTestCustomForm.overload();
cmdTestCustomForm.setCallback((_, { player }) => {
  if (!player) return false;

  wrapAsyncFunc(async () => {
    const form = new CustomFormEx(PLUGIN_NAME)
      .addLabel('This is a Label')
      .addSwitch('switch1', 'This is a Switch')
      .addInput('input1', 'this is a Input Box', {
        placeholder: 'Enter some Text',
      })
      .addDropdown(
        'drop1',
        'This is a Dropdown, default item is dropItem2',
        ['dropItem1', 'dropItem2'],
        1
      )
      .addSlider('slider1', 'This is a Slider, default value is 114', 1, 514, {
        default: 114,
      })
      .addStepSlider('stepSlider1', 'This is a Step Slider', [
        '逸一时',
        '误一世',
        '逸久忆旧罢一龄',
      ]);

    /*
      格式化后的返回值是这样的
      {
        "switch1": false,
        "input1": "",
        "drop1": 1,
        "slider1": 114,
        "stepSlider1": 1
      }
    */
    const res = await form.sendAsync(player);
    player.tell(res ? JSON.stringify(res, null, 2) : String(res));
  })();

  return true;
});
cmdTestCustomForm.setup();

// 快速构建一个列表表单，带搜索带翻页
const cmdTestSimpleFormEx = mc.newCommand(
  'testsimple',
  PLUGIN_NAME,
  PermType.Any
);
cmdTestSimpleFormEx.overload();
cmdTestSimpleFormEx.setCallback((_, { player }) => {
  if (!player) return false;

  wrapAsyncFunc(async () => {
    /** @type {string[]} */
    const buttons = File.getFilesList('./behavior_packs/vanilla/recipes');
    const form = new SimpleFormEx(buttons);
    form.title = PLUGIN_NAME;
    form.canTurnPage = true;
    form.canJumpPage = true;
    form.hasSearchButton = true;
    const result = await form.sendAsync(player); // 会返回 buttons 数组中的一个元素
    player.tell(String(result));
  })();

  return true;
});
cmdTestSimpleFormEx.setup();

// 构建一个功能性 SimpleForm
const cmdTestSimpleFormEx2 = mc.newCommand(
  'testsimple2',
  PLUGIN_NAME,
  PermType.Any
);
cmdTestSimpleFormEx2.overload();
cmdTestSimpleFormEx2.setCallback((_, { player }) => {
  if (!player) return false;

  wrapAsyncFunc(async () => {
    const form = new SimpleFormEx([
      ['点我输出1', () => player.tell('1')],
      ['点我输出2', () => player.tell('2')],
      ['点我输出114514', () => player.tell('114514')],
    ]);
    form.title = PLUGIN_NAME;
    form.content = '§a请选择要执行的操作：';
    form.formatter = ([title]) => [`§3${title}`];
    const result = await form.sendAsync(player); // 返回值和上面同理
    if (result) result[1]();
  })();

  return true;
});
cmdTestSimpleFormEx2.setup();

ll.registerPlugin(PLUGIN_NAME, PLUGIN_NAME, [0, 0, 1], {});
