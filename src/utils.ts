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

  const apiType = config.get<'browser' | 'official' | 'unofficial'>('api.type');
  let apiBrowserCfg;
  let apiOfficialCfg;
  let apiUnofficialCfg;
  if (apiType == 'browser') {
    apiBrowserCfg = {
      email: config.get<string>('api.browser.email'),
      password: config.get<string>('api.browser.password'),
      isGoogleLogin: tryGet<boolean>('api.browser.isGoogleLogin') || false,
      isProAccount: tryGet<boolean>('api.browser.isProAccount') || false,
      executablePath: tryGet<string>('api.browser.executablePath') || undefined,
      proxyServer: tryGet<string>('api.browser.proxy') || undefined,
      nopechaKey: tryGet<string>('api.browser.nopechaKey') || undefined,
      captchaToken: tryGet<string>('api.browser.captchaToken') || undefined,
      userDataDir: tryGet<string>('api.browser.userDataDir') || undefined,
      debug: config.get<number>('debug') >= 2,
    };
  } else if (apiType == 'official') {
    apiOfficialCfg = {
      apiKey: config.get<string>('api.official.apiKey'),
      apiBaseUrl: tryGet<string>('api.official.apiBaseUrl') || undefined,
      apiReverseProxyUrl:
        tryGet<string>('api.official.apiReverseProxyUrl') || undefined,
      completionParams:
        tryGet<Partial<openai.CompletionParams>>(
          'api.official.completionParams'
        ) || undefined,
      promptPrefix: tryGet<string>('api.official.promptPrefix') || undefined,
      promptSuffix: tryGet<string>('api.official.promptSuffix') || undefined,
      userLabel: tryGet<string>('api.official.userLabel') || undefined,
      assistantLabel:
        tryGet<string>('api.official.assistantLabel') || undefined,
      debug: config.get<number>('debug') >= 2,
    };
  } else if (apiType == 'unofficial') {
    apiUnofficialCfg = {
      accessToken: config.get<string>('api.unofficial.accessToken'),
      apiReverseProxyUrl:
        tryGet<string>('api.unofficial.apiReverseProxyUrl') || undefined,
      model: tryGet<string>('api.unofficial.model') || undefined,
      debug: config.get<number>('debug') >= 2,
    };
  } else {
    throw new RangeError('Invalid API type');
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
      type: apiType,
      browser: apiBrowserCfg,
      official: apiOfficialCfg,
      unofficial: apiUnofficialCfg,
    },
  };

  return cfg;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}

export {loadConfig, logWithTime};
