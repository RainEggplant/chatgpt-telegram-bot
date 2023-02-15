import type {openai} from 'chatgpt';
import config from 'config';
import {Config} from './types';

function loadConfig(): Config {
  function tryGet<T>(key: string): T | undefined {
    if (!config.has(key)) {
      return undefined;
    } else {
      return config.get<T>(key);
    }
  }

  const apiVersion = config.get<string>('api.version');
  let apiV3Cfg;
  let apiV4Cfg;
  if (apiVersion == 'v3') {
    apiV3Cfg = {
      email: config.get<string>('api.v3.email'),
      password: config.get<string>('api.v3.password'),
      isGoogleLogin: tryGet<boolean>('api.v3.isGoogleLogin') || false,
      isProAccount: tryGet<boolean>('api.v3.isProAccount') || false,
      executablePath: tryGet<string>('api.v3.executablePath') || undefined,
      proxyServer: tryGet<string>('api.v3.proxy') || undefined,
      nopechaKey: tryGet<string>('api.v3.nopechaKey') || undefined,
      captchaToken: tryGet<string>('api.v3.captchaToken') || undefined,
      userDataDir: tryGet<string>('api.v3.userDataDir') || undefined,
      debug: config.get<number>('debug') >= 2,
    };
  } else if (apiVersion == 'v4') {
    apiV4Cfg = {
      apiKey: config.get<string>('api.v4.apiKey'),
      apiBaseUrl: tryGet<string>('api.v4.apiBaseUrl') || undefined,
      apiReverseProxyUrl:
        tryGet<string>('api.v4.apiReverseProxyUrl') || undefined,
      completionParams:
        tryGet<Partial<openai.CompletionParams>>('api.v4.completionParams') ||
        undefined,
      debug: config.get<number>('debug') >= 2,
    };
  } else {
    throw new RangeError('Invalid API version');
  }

  const cfg = {
    debug: tryGet<number>('debug') || 1,
    bot: {
      token: config.get<string>('bot.token'),
      userIds: tryGet<number[]>('bot.userIds') || [],
      groupIds: tryGet<number[]>('bot.groupIds') || [],
      chatCmd: tryGet<string>('bot.chatCmd') || '/chat',
    },
    api: {
      version: apiVersion,
      v3: apiV3Cfg,
      v4: apiV4Cfg,
    },
  };

  return cfg;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}

export {loadConfig, logWithTime};
