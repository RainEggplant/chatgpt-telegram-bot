import type {openai, FetchFn} from 'chatgpt';

export interface BotOptions {
  token: string;
  userIds: number[];
  groupIds: number[];
  chatCmd: string;
}

export interface APIBrowserOptions {
  email: string;
  password: string;
  isGoogleLogin?: boolean;
  isProAccount?: boolean;
  executablePath?: string;
  proxyServer?: string;
  nopechaKey?: string;
  captchaToken?: string;
  userDataDir?: string;
  debug?: boolean;
}

export interface APIOfficialOptions {
  apiKey: string;
  apiBaseUrl?: string;
  completionParams?: Partial<
    Omit<openai.CreateChatCompletionRequest, 'messages' | 'n'>
  >;
  systemMessage?: string;
  maxModelTokens?: number;
  maxResponseTokens?: number;
  fetch?: FetchFn;
  debug?: boolean;
}

export interface APIUnofficialOptions {
  accessToken: string;
  apiReverseProxyUrl?: string;
  model?: string;
  debug?: boolean;
}

export interface APIOptions {
  type: 'browser' | 'official' | 'unofficial';
  browser?: APIBrowserOptions;
  official?: APIOfficialOptions;
  unofficial?: APIUnofficialOptions;
}

export interface Config {
  debug: number;
  bot: BotOptions;
  api: APIOptions;
  proxy?: string;
}
