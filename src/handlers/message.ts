import type TelegramBot from 'node-telegram-bot-api';
import type {ChatGPT} from '../api';
import {BotOptions} from '../types';
import {logWithTime} from '../utils';
import {Authenticator} from './authentication';
import {ChatHandler} from './chat';
import {CommandHandler} from './command';
import {DB} from '../db';

class MessageHandler {
  debug: number;
  protected _opts: BotOptions;
  protected _bot: TelegramBot;
  protected _botUsername = '';
  protected _api: ChatGPT;
  protected _authenticator: Authenticator;
  protected _commandHandler: CommandHandler;
  protected _chatHandler: ChatHandler;

  constructor(
    bot: TelegramBot,
    api: ChatGPT,
    botOpts: BotOptions,
    db: DB,
    debug = 1
  ) {
    this.debug = debug;
    this._bot = bot;
    this._api = api;
    this._opts = botOpts;
    this._authenticator = new Authenticator(bot, botOpts, debug);
    this._commandHandler = new CommandHandler(bot, api, botOpts, debug);
    this._chatHandler = new ChatHandler(bot, api, botOpts, db, debug);
  }

  init = async () => {
    this._botUsername = (await this._bot.getMe()).username ?? '';
    logWithTime(`🤖 Bot @${this._botUsername} has started...`);
  };

  handle = async (msg: TelegramBot.Message) => {
    if (this.debug >= 2) logWithTime(msg);

    // Authentication.
    if (!(await this._authenticator.authenticate(msg))) return;

    // Parse message.
    const {text, command, isMentioned} = this._parseMessage(msg);
    if (command != '' && command != this._opts.chatCmd) {
      // For commands except `${chatCmd}`, pass the request to commandHandler.
      await this._commandHandler.handle(
        msg,
        command,
        isMentioned,
        this._botUsername
      );
    } else {
      // Handles:
      // - direct messages in private chats
      // - replied messages in both private chats and group chats
      // - messages that start with `chatCmd` in private chats and group chats
      await this._chatHandler.handle(msg, text);
    }
  };

  protected _parseMessage = (msg: TelegramBot.Message) => {
    let text = msg.text ?? '';
    let command = '';
    let isMentioned = false;
    if ('entities' in msg) {
      // May have bot commands.
      const regMention = new RegExp(`@${this._botUsername}$`);
      for (const entity of msg.entities ?? []) {
        if (entity.type == 'bot_command' && entity.offset == 0) {
          text = msg.text?.slice(entity.length).trim() ?? '';
          command = msg.text?.slice(0, entity.length) ?? '';
          isMentioned = regMention.test(command);
          command = command.replace(regMention, ''); // Remove the mention.
          break;
        }
      }
    }
    return {text, command, isMentioned};
  };
}

export {MessageHandler};
