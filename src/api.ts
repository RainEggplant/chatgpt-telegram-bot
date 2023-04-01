import type {
  ChatGPTAPI,
  ChatGPTUnofficialProxyAPI,
  ChatMessage as ChatResponseV4,
} from 'chatgpt';
import type {
  ChatGPTAPIBrowser,
  ChatResponse as ChatResponseV3,
} from 'chatgpt-v3';
import {
  APIBrowserOptions,
  APIOfficialOptions,
  APIOptions,
  APIUnofficialOptions,
} from './types';
import {logWithTime} from './utils';
import Authenticator from 'openai-token';

interface ChatContext {
  conversationId?: string;
  parentMessageId?: string;
}

class ChatGPT {
  debug: number;
  readonly apiType: string;
  protected _opts: APIOptions;
  protected _api:
    | ChatGPTAPI
    | ChatGPTAPIBrowser
    | ChatGPTUnofficialProxyAPI
    | undefined;
  protected _apiBrowser: ChatGPTAPIBrowser | undefined;
  protected _apiOfficial: ChatGPTAPI | undefined;
  protected _apiUnofficialProxy: ChatGPTUnofficialProxyAPI | undefined;
  protected _context: ChatContext = {};
  protected _timeoutMs: number | undefined;
  _authenticator: Authenticator | undefined;

  constructor(apiOpts: APIOptions, debug = 1) {
    this.debug = debug;
    this.apiType = apiOpts.type;
    this._opts = apiOpts;
    this._timeoutMs = undefined;
    if (apiOpts.unofficial?.email && apiOpts.unofficial?.password) {
      this._authenticator = new Authenticator(
        apiOpts.unofficial?.email,
        apiOpts.unofficial?.password
      );
    }
  }

  _initUnofficialProxyApi = async (accessToken?: string) => {
    const {ChatGPTUnofficialProxyAPI} = await import('chatgpt');
    this._apiUnofficialProxy = new ChatGPTUnofficialProxyAPI({
      ...(this._opts.unofficial as APIUnofficialOptions),
      ...(accessToken ? {accessToken} : {}),
    });
    this._api = this._apiUnofficialProxy;
    this._timeoutMs = this._opts.unofficial?.timeoutMs;
  };

  init = async () => {
    if (this._opts.type == 'browser') {
      const {ChatGPTAPIBrowser} = await import('chatgpt-v3');
      this._apiBrowser = new ChatGPTAPIBrowser(
        this._opts.browser as APIBrowserOptions
      );
      await this._apiBrowser.initSession();
      this._api = this._apiBrowser;
      this._timeoutMs = this._opts.browser?.timeoutMs;
    } else if (this._opts.type == 'official') {
      const {ChatGPTAPI} = await import('chatgpt');
      this._apiOfficial = new ChatGPTAPI(
        this._opts.official as APIOfficialOptions
      );
      this._api = this._apiOfficial;
      this._timeoutMs = this._opts.official?.timeoutMs;
    } else if (this._opts.type == 'unofficial') {
      await this._initUnofficialProxyApi();
    } else {
      throw new RangeError('Invalid API type');
    }
    logWithTime('🔮 ChatGPT API has started...');
  };

  sendMessage = async (
    text: string,
    onProgress?: (res: ChatResponseV3 | ChatResponseV4) => void
  ) => {
    if (!this._api) return;

    let res: ChatResponseV3 | ChatResponseV4;
    if (this.apiType == 'official') {
      if (!this._apiOfficial) return;
      res = await this._apiOfficial.sendMessage(text, {
        ...this._context,
        onProgress,
        timeoutMs: this._timeoutMs,
      });
    } else {
      res = await this._api.sendMessage(text, {
        ...this._context,
        onProgress,
        timeoutMs: this._timeoutMs,
      });
    }

    const parentMessageId =
      this.apiType == 'browser'
        ? (res as ChatResponseV3).messageId
        : (res as ChatResponseV4).id;

    this._context = {
      conversationId: res.conversationId,
      parentMessageId: parentMessageId,
    };

    return res;
  };

  resetThread = async () => {
    if (this._apiBrowser) {
      await this._apiBrowser.resetThread();
    }
    this._context = {};
  };

  refreshSession = async () => {
    if (this._apiBrowser) {
      await this._apiBrowser.refreshSession();
    }
  };

  refreshUnofficialApi = async () => {
    if (!this._authenticator) {
      logWithTime('⛔️ No credentials to refresh!');
      return;
    }
    if (this._apiUnofficialProxy) {
      await this._authenticator.begin();
      const accessToken = await this._authenticator.getAccessToken();

      await this._initUnofficialProxyApi(accessToken);
    }
  };
}

export {ChatGPT};
