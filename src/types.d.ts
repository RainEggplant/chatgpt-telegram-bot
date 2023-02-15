import type {openai} from 'chatgpt';

export interface BotOptions {
  token: string;
  userIds: number[];
  groupIds: number[];
  chatCmd: string;
}

export interface APIV3Options {
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

export interface APIV4Options {
  apiKey: string;
  apiBaseUrl?: string;
  apiReverseProxyUrl?: string;
  completionParams?: Partial<openai.CompletionParams>;
  debug?: boolean;
}

export interface APIOptions {
  version: string;
  v3?: APIV3Options;
  v4?: APIV4Options;
}

export interface Config {
  debug: number;
  bot: BotOptions;
  api: APIOptions;
}
