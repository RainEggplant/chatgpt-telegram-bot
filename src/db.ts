import {open, RootDatabase} from 'lmdb';
import {logWithTime} from './utils';

interface ContextObject {
  conversationId?: string;
  parentMessageId?: string;
}

type Context = ContextObject | undefined;

export class DB {
  protected _db: RootDatabase;
  constructor() {
    this._db = open({
      path: 'database',
      compression: true,
    });
  }
  getContext = (chatId: number): Promise<Context> => {
    if (this._db) {
      return this._db.get(chatId);
    } else {
      logWithTime('DB is not initialised!');
      return Promise.reject(undefined);
    }
  };
  updateContext = async (
    chatId: number,
    newContext: Pick<ContextObject, 'conversationId'> &
      Required<Pick<ContextObject, 'parentMessageId'>>
  ) => {
    if (this._db) {
      await this._db.put(chatId, newContext);
    } else {
      logWithTime('DB is not initialised!');
    }
  };
  clearContext = async (chatId: number) => {
    if (this._db) {
      await this._db.remove(chatId);
    } else {
      logWithTime('DB is not initialised!');
    }
  };
}
