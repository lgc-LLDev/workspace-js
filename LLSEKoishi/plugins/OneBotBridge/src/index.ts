// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

import '@koishijs/plugin-adapter-onebot';

import kleur from 'kleur';
import {
  Awaitable,
  Context,
  Dict,
  h,
  Logger,
  Render,
  Schema,
  Session,
} from 'koishi';
import mustache from 'mustache';
import * as os from 'os';
import { cpuUsage as getCpuUsage } from 'os-utils';
import * as path from 'path';
import { isAsyncFunction } from 'util/types';

import { Config, TransRule } from './types';
import { replaceColorChar } from './util';

// 如果不这样用默认导出会出bug 不知道为什么
const checkDiskSpace = require('check-disk-space').default;

export default class Plugin {
  readonly name = 'OneBotBridge';

  private readonly config: Config;

  private readonly ctx: Context;

  readonly logger = new Logger(this.name);

  readonly configSchema: Schema<Config> = Schema.object({
    superusers: Schema.array(Schema.number()).default([]),
    enableGroups: Schema.array(Schema.number()).default([]),
    cmdPrefix: Schema.string().default('/'),
    cmdStatus: Schema.string().default('查询'),
    pokeStatus: Schema.boolean().default(true),
    allowCmd: Schema.array(Schema.string()).default([]),
    playerChatTemplate: Schema.string(),
    groupChatTemplate: Schema.string(),
    playerPreJoinTemplate: Schema.string(),
    playerJoinTemplate: Schema.string(),
    playerLeftTemplate: Schema.string(),
    playerDieTemplate: Schema.string(),
    serverStatTemplate: Schema.string(),
    specialAttrPrefix: Schema.string(),
    specialAttrSuffix: Schema.string(),
    customRegex: Schema.array(
      Schema.object({
        from: Schema.array(
          Schema.object({
            type: Schema.string().required(),
            regex: Schema.string().required(),
            superuser: Schema.boolean().default(false),
          }).required()
        ).required(),
        actions: Schema.array(
          Schema.object({
            type: Schema.string().required(),
            content: Schema.string().required(),
          }).required()
        ).required(),
      })
    ),
  });

  readonly transformMsgRules = this.warpRules({
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
    reply: (_, __, session) => this.translateReply(session),
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
  });

  constructor(ctxOriginal: Context, configOriginal: Config) {
    this.config = this.configSchema(configOriginal);

    this.ctx = ctxOriginal
      .platform('onebot')
      .channel(...this.config.enableGroups.map(String));

    // 消息
    this.ctx
      .intersect((s: Session) => s.subtype === 'group')
      .on('message', this.onMessage.bind(this));

    // 戳一戳
    this.ctx
      .intersect((s: Session) => s.targetId === s.bot.selfId)
      .on('notice/poke', this.onPoke.bind(this));

    mc.listen('onChat', this.onMcChat.bind(this));
    mc.listen('onPreJoin', this.onMcPreJoin.bind(this));
    mc.listen('onJoin', this.onMcJoin.bind(this));
    mc.listen('onLeft', this.onMcLeft.bind(this));
    mc.listen('onPlayerDie', this.onMcDie.bind(this));
  }

  warpRules(rules: Dict<TransRule>): Dict<TransRule> {
    Object.entries(rules).forEach(([key, func]) => {
      let newFunc: TransRule;
      if (isAsyncFunction(func)) {
        newFunc = async (...args) =>
          this.addHeadAndTail(
            await (func as Render<Awaitable<string>, Session>)(...args)
          );
      } else if (func instanceof Function) {
        newFunc = (...args) =>
          this.addHeadAndTail((func as Render<string, Session>)(...args));
      } else {
        newFunc = () => this.addHeadAndTail(func as string);
      }
      rules[key] = newFunc;
    });

    return rules;
  }

  addHeadAndTail(raw: string): string {
    const { specialAttrPrefix, specialAttrSuffix } = this.config;
    return `${specialAttrPrefix}${raw}${specialAttrSuffix}`;
  }

  async translateReply(session: Session): Promise<string> {
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
          this.transformMsgRules,
          session
        )}`;
    }
    return `回复${replyMsg}`;
  }

  isRestrictedCmd(cmd: string): boolean {
    for (const regTxt of this.config.allowCmd)
      if (RegExp(regTxt).test(cmd)) return true;
    return false;
  }

  broadcastMsg(
    content: string,
    groups: (string | number)[] = this.config.enableGroups
  ) {
    const { bots } = this.ctx;
    if (bots.length > 0) bots[0].broadcast(groups.map(String), content);
  }

  async getStatus(): Promise<string | null> {
    const { serverStatTemplate } = this.config;
    if (serverStatTemplate) {
      const cpuUsage = (
        (await new Promise<number>((resolve) => {
          getCpuUsage(resolve);
        })) * 100
      ).toFixed(2);

      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const usedMem = totalMem - freeMem;
      const memory = {
        used: (usedMem / 1024 / 1024).toFixed(2),
        remain: (freeMem / 1024 / 1024).toFixed(2),
        total: (totalMem / 1024 / 1024).toFixed(2),
        percent: ((usedMem / totalMem) * 100).toFixed(2),
      };

      const { free, size, diskPath } = await checkDiskSpace(
        path.resolve(__dirname)
      );
      const diskUsed = size - free;
      const disk = {
        diskPath,
        free: (free / 1024 / 1024 / 1024).toFixed(2),
        size: (size / 1024 / 1024 / 1024).toFixed(2),
        used: (diskUsed / 1024 / 1024 / 1024).toFixed(2),
        percent: ((diskUsed / size) * 100).toFixed(2),
      };

      const players = mc
        .getOnlinePlayers()
        .map((pl) => ({ pl, dv: pl.getDevice() }));

      return mustache.render(serverStatTemplate, {
        cpuUsage,
        memory,
        disk,
        bdsVersion: mc.getBDSVersion(),
        protocolVersion: mc.getServerProtocolVersion(),
        llVersion: ll.versionString(),
        plugins: ll.listPlugins(),
        players,
      });
    }
    return null;
  }

  async sendStatus(session?: Session) {
    const rendered = await this.getStatus();
    if (rendered) {
      this.logger.info(rendered);
      if (session) session.send(rendered);
      else this.broadcastMsg(rendered);
    }
  }

  async onMessage(session: Session) {
    const { content } = session;
    const { groupChatTemplate, cmdPrefix, superusers, cmdStatus } = this.config;

    const txtContent = h
      .select(content, 'text')
      .map((x) => x.attrs.content)
      .join(' ');

    // 执行指令
    if (txtContent.startsWith(cmdPrefix)) {
      const cmd = txtContent.replace(cmdPrefix, ''); // js里只会替换一次

      if (
        superusers.includes(Number(session.userId)) ||
        this.isRestrictedCmd(cmd)
      ) {
        const res = mc.runcmdEx(cmd);
        const { success } = res;
        const output = replaceColorChar(res.output);

        const successTxt = success ? '成功' : '失败';
        this.logger.info(
          `执行指令 ${kleur.cyan(cmd)} ` +
            `${(success ? kleur.green : kleur.red)(successTxt)}\n${output}`
        );
        session.send(`执行${successTxt}\n${output}`);
      } else {
        session.send('权限不足');
      }
    }
    // 服务器状态
    else if (txtContent === cmdStatus) {
      await this.sendStatus(session);
    }

    // 群消息转服务器
    if (groupChatTemplate) {
      let message = await h.transformAsync(
        content,
        this.transformMsgRules,
        session
      );
      if (session.quote)
        message = `${this.addHeadAndTail(
          await this.translateReply(session)
        )} ${message}`;

      const { username, nickname } = session.author || {};
      const rendered = mustache.render(groupChatTemplate, {
        session,
        message,
        name: username || nickname || '未知',
      });
      mc.broadcast(rendered);
    }
  }

  async onPoke(session: Session) {
    const { pokeStatus } = this.config;
    if (pokeStatus) await this.sendStatus(session);
  }

  onMcChat(player: Player, message: string) {
    const { playerChatTemplate } = this.config;
    if (playerChatTemplate) {
      const rendered = mustache.render(playerChatTemplate, {
        player,
        message,
      });
      this.broadcastMsg(rendered);
    }
  }

  onMcPreJoin(player: Player) {
    const { playerPreJoinTemplate } = this.config;
    if (playerPreJoinTemplate) {
      const rendered = mustache.render(playerPreJoinTemplate, {
        player,
      });
      this.broadcastMsg(rendered);
    }
  }

  onMcJoin(player: Player) {
    const { playerJoinTemplate } = this.config;
    if (playerJoinTemplate) {
      const rendered = mustache.render(playerJoinTemplate, {
        player,
      });
      this.broadcastMsg(rendered);
    }
  }

  onMcLeft(player: Player) {
    const { playerLeftTemplate } = this.config;
    if (playerLeftTemplate) {
      const rendered = mustache.render(playerLeftTemplate, {
        player,
      });
      this.broadcastMsg(rendered);
    }
  }

  onMcDie(player: Player, source: Entity | null) {
    const { playerDieTemplate } = this.config;
    if (playerDieTemplate) {
      const rendered = mustache.render(playerDieTemplate, {
        player,
        source,
      });
      this.broadcastMsg(rendered);
    }
  }
}
