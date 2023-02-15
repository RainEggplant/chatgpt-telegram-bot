import type {ChatMessage as ChatResponseV4} from 'chatgpt';
import type {ChatResponse as ChatResponseV3} from 'chatgpt-v3';
import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import type {ChatGPT} from '../api';
import {BotOptions} from '../types';
import {logWithTime} from '../utils';

class ChatHandler {
  debug: number;
  protected _opts: BotOptions;
  protected _bot: TelegramBot;
  protected _api: ChatGPT;

  constructor(bot: TelegramBot, api: ChatGPT, botOpts: BotOptions, debug = 1) {
    this.debug = debug;
    this._bot = bot;
    this._api = api;
    this._opts = botOpts;
  }

  handle = async (msg: TelegramBot.Message, text: string) => {
    if (!text) return;

    const chatId = msg.chat.id;
    if (this.debug >= 1) {
      const userInfo = `@${msg.from?.username ?? ''} (${msg.from?.id})`;
      const chatInfo =
        msg.chat.type == 'private'
          ? 'private chat'
          : `group ${msg.chat.title} (${msg.chat.id})`;
      logWithTime(`📩 Message from ${userInfo} in ${chatInfo}:\n${text}`);
    }

    // Send a message to the chat acknowledging receipt of their message
    let reply = await this._bot.sendMessage(chatId, '🤔', {
      reply_to_message_id: msg.message_id,
    });
    await this._bot.sendChatAction(chatId, 'typing');

    // Send message to ChatGPT
    try {
      const res = await this._api.sendMessage(
        text,
        _.throttle(
          async (partialResponse: ChatResponseV3 | ChatResponseV4) => {
            const resText =
              this._api.apiVersion == 'v3'
                ? (partialResponse as ChatResponseV3).response
                : (partialResponse as ChatResponseV4).text;
            reply = await this._editMessage(reply, resText);
            await this._bot.sendChatAction(chatId, 'typing');
          },
          3000,
          {leading: true, trailing: false}
        )
      );
      const resText =
        this._api.apiVersion == 'v3'
          ? (res as ChatResponseV3).response
          : (res as ChatResponseV4).text;
      await this._editMessage(reply, resText);

      if (this.debug >= 1) logWithTime(`📨 Response:\n${resText}`);
    } catch (err) {
      logWithTime('⛔️ ChatGPT API error:', (err as Error).message);
      this._bot.sendMessage(
        chatId,
        "⚠️ Sorry, I'm having trouble connecting to the server, please try again later."
      );
    }
  };

  // Edit telegram message
  protected _editMessage = async (
    msg: TelegramBot.Message,
    text: string,
    needParse = true
  ) => {
    if (text.trim() == '' || msg.text == text) {
      return msg;
    }
    try {
      const res = await this._bot.editMessageText(text, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: needParse ? 'Markdown' : undefined,
      });
      // type of res is boolean | Message
      if (typeof res === 'object') {
        // return a Message type instance if res is a Message type
        return res as TelegramBot.Message;
      } else {
        // return the original message if res is a boolean type
        return msg;
      }
    } catch (err) {
      logWithTime('⛔️ Edit message error:', (err as Error).message);
      return msg;
    }
  };
}

export {ChatHandler};
