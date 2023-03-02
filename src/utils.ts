import type {FetchFn, openai} from 'chatgpt';
import config from 'config';
import pkg from 'https-proxy-agent';
import fetch, {type RequestInfo, type RequestInit} from 'node-fetch';
import {Config} from './types';
const {HttpsProxyAgent} = pkg;

function loadConfig(): Config {
  function tryGet<T>(key: string): T | undefined {
    if (!config.has(key)) {
      return undefined;
    } else {
      return config.get<T>(key);
    }
  }

  let fetchFn: FetchFn | undefined = undefined;
  const proxy = tryGet<string>('proxy') || process.env.http_proxy;
  if (proxy) {
    const proxyAgent = new HttpsProxyAgent(proxy);
    fetchFn = ((url, opts) =>
      fetch(
        url as RequestInfo,
        {...opts, agent: proxyAgent} as RequestInit
      )) as FetchFn;
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
      proxyServer: tryGet<string>('proxy') || undefined,
      nopechaKey: tryGet<string>('api.browser.nopechaKey') || undefined,
      captchaToken: tryGet<string>('api.browser.captchaToken') || undefined,
      userDataDir: tryGet<string>('api.browser.userDataDir') || undefined,
      debug: config.get<number>('debug') >= 2,
    };
  } else if (apiType == 'official') {
    apiOfficialCfg = {
      apiKey: config.get<string>('api.official.apiKey'),
      apiBaseUrl: tryGet<string>('api.official.apiBaseUrl') || undefined,
      completionParams:
        tryGet<
          Partial<Omit<openai.CreateChatCompletionRequest, 'messages' | 'n'>>
        >('api.official.completionParams') || undefined,
      systemMessage: tryGet<string>('api.official.systemMessage') || undefined,
      maxModelTokens:
        tryGet<number>('api.official.maxModelTokens') || undefined,
      maxResponseTokens:
        tryGet<number>('api.official.maxResponseTokens') || undefined,
      fetch: fetchFn,
      debug: config.get<number>('debug') >= 2,
    };
  } else if (apiType == 'unofficial') {
    apiUnofficialCfg = {
      accessToken: config.get<string>('api.unofficial.accessToken'),
      apiReverseProxyUrl:
        tryGet<string>('api.unofficial.apiReverseProxyUrl') || undefined,
      model: tryGet<string>('api.unofficial.model') || undefined,
      fetch: fetchFn,
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
    proxy: proxy,
  };

  return cfg;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}

export {loadConfig, logWithTime};
