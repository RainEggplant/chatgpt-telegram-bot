import type {openai} from 'chatgpt';

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
  debug?: boolean;
}

export interface APIOfficialOptions {
  apiKey: string;
  apiBaseUrl?: string;
  apiReverseProxyUrl?: string;
  completionParams?: Partial<openai.CompletionParams>;
  promptPrefix?: string;
  promptSuffix?: string;
  userLabel?: string;
  assistantLabel?: string;
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
}
