import type {ChatMessage as ChatResponseV4} from 'chatgpt';
import type {ChatResponse as ChatResponseV3} from 'chatgpt-v3';
import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import type {ChatGPT} from '../api';
import {BotOptions} from '../types';
import {logWithTime} from '../utils';
import Queue from 'promise-queue';

class ChatHandler {
  debug: number;
  protected _opts: BotOptions;
  protected _bot: TelegramBot;
  protected _api: ChatGPT;
  protected _apiRequestsQueue = new Queue(1, Infinity);
  protected _requestsQueue: Record<string, number> = {};
  protected _orderRequestsQueue = new Queue(20, Infinity);

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

    const orderLength = this._apiRequestsQueue.getQueueLength() + 1;
    // Send a message to the chat acknowledging receipt of their message
    const reply = await this._bot.sendMessage(
      chatId,
      orderLength > 1 ? `You are #${orderLength} in order` : '🤔',
      {
        reply_to_message_id: msg.message_id,
      }
    );

    await this._bot.sendChatAction(chatId, 'typing');

    // assign queue for request
    this._requestsQueue[this._getQueueKey(chatId, reply.message_id)] =
      orderLength;

    // add to sequence queue due to chatGPT processes only one request at a time
    await this._apiRequestsQueue.add(() => {
      return this._sendToGpt(text, chatId, reply);
    });
  };

  protected _sendToGpt = async (
    text: string,
    chatId: number,
    originalReply: TelegramBot.Message
  ) => {
    let reply = originalReply;

    // Update queue order before sending request to api
    await this._updateQueue(chatId, originalReply.message_id);

    // Send message to ChatGPT
    try {
      const res = await this._api.sendMessage(
        text,
        _.throttle(
          async (partialResponse: ChatResponseV3 | ChatResponseV4) => {
            const resText =
              this._api.apiType == 'browser'
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
        this._api.apiType == 'browser'
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

  protected _getQueueKey = (chatId: number, messageId: number) =>
    `${chatId}:${messageId}`;

  protected _parseQueueKey = (key: string) => {
    const [chat_id, message_id] = key.split(':');

    return {chat_id, message_id};
  };

  protected _updateQueue = async (chatId: number, messageId: number) => {
    // delete value for current request
    delete this._requestsQueue[this._getQueueKey(chatId, messageId)];

    for (const key in this._requestsQueue) {
      const {chat_id, message_id} = this._parseQueueKey(key);
      this._requestsQueue[key]--;

      // add to promise queue to avoid throttling
      await this._orderRequestsQueue.add(() => {
        return this._bot.editMessageText(
          `You are #${this._requestsQueue[key]} in order`,
          {
            chat_id,
            message_id: Number(message_id),
          }
        );
      });
    }
  };
}

export {ChatHandler};
