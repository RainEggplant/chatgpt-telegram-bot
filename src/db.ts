import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import {ChatMessage as ChatResponseV4} from 'chatgpt';
import {BotOptions} from './types';
import Redis from 'ioredis';
import {logWithTime} from './utils';

interface ContextObject {
  conversationId?: string;
  parentMessageId?: string;
}

type Context = ContextObject | undefined;

export class DB {
  protected _store: KeyvRedis | undefined;
  protected _redis: Redis | undefined;
  public messageStore: Keyv<ChatResponseV4>;
  private _usersStore: Keyv<ContextObject>;

  constructor(botOps: BotOptions) {
    if (botOps.redisUri) {
      this._redis = new Redis(botOps.redisUri, {family: 6});
      this._redis.on('ready', async () => {
        logWithTime('📚 Redis has started...');
        const response = await this._redis?.ping();
        logWithTime(`🏓 Redis ping result: ${response}`);
      });
      this._store = new KeyvRedis(this._redis);
    }
    this.messageStore = new Keyv({
      store: this._store,
      namespace: 'messages',
    });
    this._usersStore = new Keyv({
      store: this._store,
      namespace: 'users',
    });
  }

  getContext = (chatId: number): Promise<Context> => {
    return this._usersStore.get(chatId.toString());
  };
  updateContext = async (
    chatId: number,
    newContext: Pick<ContextObject, 'conversationId'> &
      Required<Pick<ContextObject, 'parentMessageId'>>
  ) => {
    await this._usersStore.set(chatId.toString(), newContext);
  };
  clearContext = async (chatId: number) => {
    await this._usersStore.delete(chatId.toString());
  };
  getReplyId = async (replyId: string | undefined) => {
    if (!replyId) return undefined;
    const reply = await this.messageStore.get(replyId);
    return reply?.id;
  };
}
