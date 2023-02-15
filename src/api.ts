import type {ChatGPTAPI, ChatMessage as ChatResponseV4} from 'chatgpt';
import type {
  ChatGPTAPIBrowser,
  ChatResponse as ChatResponseV3,
} from 'chatgpt-v3';
import {APIOptions, APIV3Options, APIV4Options} from './types';
import {logWithTime} from './utils';

interface ChatContext {
  conversationId?: string;
  parentMessageId?: string;
}

class ChatGPT {
  debug: number;
  readonly apiVersion: string;
  protected _opts: APIOptions;
  protected _api: ChatGPTAPI | ChatGPTAPIBrowser | undefined;
  protected _apiV3: ChatGPTAPIBrowser | undefined;
  protected _apiV4: ChatGPTAPI | undefined;
  protected _context: ChatContext = {};

  constructor(apiOpts: APIOptions, debug = 1) {
    this.debug = debug;
    this.apiVersion = apiOpts.version;
    this._opts = apiOpts;
  }

  init = async () => {
    if (this._opts.version == 'v3') {
      const {ChatGPTAPIBrowser} = await import('chatgpt-v3');
      this._apiV3 = new ChatGPTAPIBrowser(this._opts.v3 as APIV3Options);
      await this._apiV3.initSession();
      this._api = this._apiV3;
    } else if (this._opts.version == 'v4') {
      const {ChatGPTAPI} = await import('chatgpt');
      this._apiV4 = new ChatGPTAPI(this._opts.v4 as APIV4Options);
      this._api = this._apiV4;
    } else {
      throw new RangeError('Invalid API version');
    }
    logWithTime('🔮 ChatGPT API has started...');
  };

  sendMessage = async (
    text: string,
    onProgress?: (res: ChatResponseV3 | ChatResponseV4) => void
  ) => {
    if (!this._api) return;

    const res = await this._api.sendMessage(text, {
      ...this._context,
      onProgress,
    });

    const parentMessageId =
      this.apiVersion == 'v3'
        ? (res as ChatResponseV3).messageId
        : (res as ChatResponseV4).id;

    this._context = {
      conversationId: res.conversationId,
      parentMessageId: parentMessageId,
    };

    return res;
  };

  resetThread = async () => {
    if (this._apiV3) {
      await this._apiV3.resetThread();
    }
    this._context = {};
  };

  refreshSession = async () => {
    if (this._apiV3) {
      await this._apiV3.refreshSession();
    }
  };
}

export {ChatGPT};
