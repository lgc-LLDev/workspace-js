// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

import '@koishijs/plugin-adapter-onebot';

import { Awaitable, Context, Dict, h, Render, Schema, Session } from 'koishi';
import mustache from 'mustache';
import { isAsyncFunction } from 'util/types';

import { Config, TransRule } from './types';

export const name = 'OneBotBridge';

export const configSchema: Schema<Config> = Schema.object({
  superusers: Schema.array(Schema.number()).required(),
  enableGroups: Schema.array(Schema.number()).required(),
  cmdPrefix: Schema.string().required(),
  cmdStatus: Schema.string().required(),
  pokeStatus: Schema.boolean().required(),
  allowCmd: Schema.array(Schema.string()).required(),
  playerChatTemplate: Schema.string().required(),
  groupChatTemplate: Schema.string().required(),
  playerPreJoinTemplate: Schema.string().required(),
  playerJoinTemplate: Schema.string().required(),
  playerLeftTemplate: Schema.string().required(),
  playerDieTemplate: Schema.string().required(),
  specialAttrPrefix: Schema.string().required(),
  specialAttrSuffix: Schema.string().required(),
});

export function apply(ctxOriginal: Context, config: Config) {
  const ctx = ctxOriginal
    .platform('onebot')
    .channel(...config.enableGroups.map(String))
    .intersect((s: Session) => s.subtype === 'group');

  function addHeadAndTail(raw: string): string {
    const { specialAttrPrefix, specialAttrSuffix } = config;
    return `${specialAttrPrefix}${raw}${specialAttrSuffix}`;
  }

  async function translateReply(session: Session): Promise<string> {
    let replyMsg = '';
    const { quote, channelId, onebot } = session;
    const { author, content } = quote || {};
    if (author) {
      const { userId } = author;
      const { card, nickname } =
        (await onebot?.getGroupMemberInfo(Number(channelId), userId)) || {};
      replyMsg =
        ` @${card || nickname || userId}： ` +
        `§r${await h.transformAsync(
          content || '',
          // eslint-disable-next-line no-use-before-define
          transformMsgRules,
          session
        )}`;
    }
    return `回复${replyMsg}`;
  }

  const transformMsgRules = (() => {
    const rules: Dict<TransRule> = {
      face: '表情',
      video: '视频',
      rps: '猜拳',
      dice: '扔骰子',
      shake: '戳一戳',
      anonymous: '匿名',
      location: '位置',
      music: '音乐',
      poke: '戳一戳',
      forward: '合并转发',
      node: '合并转发',
      xml: 'XML卡片消息',
      json: 'JSON卡片消息',
      cardimage: 'XML卡片消息',
      tts: 'TTS语音',
      share: ({ title }) => `分享：${title}`,
      redbag: ({ title }) => `红包：${title}`,
      record: ({ magic }) => `${magic ? '变声' : ''}语音`,
      contact: ({ type, id }) => `推荐${type === 'qq' ? '好友' : '群'}：${id}`,
      reply: (_, __, session) => translateReply(session),
      at: async ({ id }, _, { channelId, onebot }) => {
        const { card, nickname } =
          (await onebot?.getGroupMemberInfo(Number(channelId), id)) || {};
        return `@${card || nickname || id}`;
      },
      gift: async ({ qq }, _, { channelId, onebot }) => {
        const { card, nickname } =
          (await onebot?.getGroupMemberInfo(Number(channelId), qq)) || {};
        return `礼物 @${card || nickname || qq}`;
      },
      image: ({ type, subType }) => {
        switch (type) {
          case 'flash':
            return '闪照';
          case 'show':
            return '秀图';
          default:
            return String(subType) === '0' ? '图片' : '动画表情';
        }
      },
    };

    Object.entries(rules).forEach(([key, func]) => {
      let newFunc: TransRule;
      if (isAsyncFunction(func)) {
        newFunc = async (...args) =>
          addHeadAndTail(
            await (func as Render<Awaitable<string>, Session>)(...args)
          );
      } else if (func instanceof Function) {
        newFunc = (...args) =>
          addHeadAndTail((func as Render<string, Session>)(...args));
      } else {
        newFunc = () => addHeadAndTail(func as string);
      }
      rules[key] = newFunc;
    });

    return rules;
  })();

  function broadcastMsg(
    content: string,
    groups: (string | number)[] = config.enableGroups
  ) {
    const { bots } = ctx;
    if (bots.length > 0) bots[0].broadcast(groups.map(String), content);
  }

  ctx.on('message', async (session: Session) => {
    const { groupChatTemplate } = config;
    if (groupChatTemplate) {
      let message = await h.transformAsync(
        session.content,
        transformMsgRules,
        session
      );
      if (session.quote)
        message = `${addHeadAndTail(await translateReply(session))} ${message}`;

      const { username, nickname } = session.author || {};
      const rendered = mustache.render(groupChatTemplate, {
        session,
        message,
        name: username || nickname || '未知',
      });
      mc.broadcast(rendered);
    }
  });

  mc.listen('onChat', (player, message) => {
    const { playerChatTemplate } = config;
    if (playerChatTemplate) {
      const rendered = mustache.render(playerChatTemplate, {
        player,
        message,
      });
      broadcastMsg(rendered);
    }
  });

  mc.listen('onPreJoin', (player) => {
    const { playerPreJoinTemplate } = config;
    if (playerPreJoinTemplate) {
      const rendered = mustache.render(playerPreJoinTemplate, {
        player,
      });
      broadcastMsg(rendered);
    }
  });

  mc.listen('onJoin', (player) => {
    const { playerJoinTemplate } = config;
    if (playerJoinTemplate) {
      const rendered = mustache.render(playerJoinTemplate, {
        player,
      });
      broadcastMsg(rendered);
    }
  });

  mc.listen('onLeft', (player) => {
    const { playerLeftTemplate } = config;
    if (playerLeftTemplate) {
      const rendered = mustache.render(playerLeftTemplate, {
        player,
      });
      broadcastMsg(rendered);
    }
  });

  mc.listen('onPlayerDie', (player, source) => {
    const { playerDieTemplate } = config;
    if (playerDieTemplate) {
      const rendered = mustache.render(playerDieTemplate, {
        player,
        source,
      });
      broadcastMsg(rendered);
    }
  });
}
