import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import {ChatMessage as ChatResponseV4} from 'chatgpt';
import {BotOptions} from './types';

interface ContextObject {
  conversationId?: string;
  parentMessageId?: string;
}

type Context = ContextObject | undefined;

export class DB {
  protected _store: KeyvRedis | undefined;

  public messageStore: Keyv<ChatResponseV4>;
  private _usersStore: Keyv<ContextObject>;

  constructor(botOps: BotOptions) {
    if (botOps.redisUri) {
      this._store = new KeyvRedis(botOps.redisUri);
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
