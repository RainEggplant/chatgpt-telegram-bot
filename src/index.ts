import _ from 'lodash';
import dotenv from 'dotenv';
import {ChatGPTAPIBrowser, ChatResponse} from 'chatgpt';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();
const DEBUG = parseInt(process.env.DEBUG || '0');

interface ChatContext {
  conversationId?: string;
  parentMessageId?: string;
}

async function main() {
  // Initialize ChatGPT API.
  const api = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL || '',
    password: process.env.OPENAI_PASSWORD || '',
    isGoogleLogin:
      process.env.IS_GOOGLE_LOGIN?.toLowerCase() == 'true' || false,
    executablePath: process.env.EXECUTABLE_PATH || undefined,
    proxyServer: process.env.PROXY || undefined,
    nopechaKey: process.env.NOPECHA_KEY || undefined,
    captchaToken: process.env.CAPTCHA_TOKEN || undefined,
  });
  await api.initSession();
  let chatContext: ChatContext = {};
  logWithTime('🔮 ChatGPT API has started...');

  // Initialize Telegram Bot
  const bot = new TelegramBot(process.env.BOT_TOKEN || '', {polling: true});
  const {username: botUsername} = await bot.getMe();
  logWithTime(`🤖 Bot @${botUsername} has started...`);
  const ownerIdList =
    process.env.OWNER_ID?.split(',').map((x) => parseInt(x)) || [];
  const groupIdList =
    process.env.GROUP_ID?.split(',').map((x) => parseInt(x)) || [];
  const chatCmd = process.env.CHAT_CMD || '/chat';

  async function messageHandler(msg: TelegramBot.Message) {
    if (DEBUG >= 2) logWithTime(msg);

    const {text, command, isMentioned} = analyzeMessage(msg);
    if (command != '' && command != chatCmd) {
      // For commands except `chatCmd`, pass the request to commandHandler.
      await commandHandler(msg, command, isMentioned);
    } else {
      // Handles:
      // - direct messages in private chats
      // - replied messages in both private chats and group chats
      // - messages that start with `chatCmd` in private chats and group chats
      await chatHandler(msg, text);
    }
  }

  function analyzeMessage(msg: TelegramBot.Message) {
    let text = msg.text ?? '';
    let command = '';
    let isMentioned = false;
    if ('entities' in msg) {
      // May have bot commands.
      const regMention = new RegExp(`@${botUsername}$`);
      for (const entity of msg.entities ?? []) {
        if (entity.type == 'bot_command' && entity.offset == 0) {
          text = msg.text?.slice(entity.length).trim() ?? '';
          command = msg.text?.slice(0, entity.length) ?? '';
          isMentioned = regMention.test(command);
          command = command.replace(regMention, ''); // Remove the mention.
          break;
        }
      }
    }
    return {text, command, isMentioned};
  }

  async function authenticate(msg: TelegramBot.Message) {
    if (msg.chat.type === 'private') {
      if (ownerIdList.length != 0 && ownerIdList.indexOf(msg.chat.id) == -1) {
        await bot.sendMessage(
          msg.chat.id,
          '⛔️ Sorry, you are not my owner. I cannot chat with you or execute your command.'
        );
        logWithTime(
          '⚠️ Authentication failed for user ' +
            `@${msg.from?.username ?? ''} (${msg.from?.id}).`
        );
        return false;
      }
    } else {
      if (groupIdList.length != 0 && groupIdList.indexOf(msg.chat.id) == -1) {
        await bot.sendMessage(
          msg.chat.id,
          "⛔️ Sorry, I'm not supposed to work here. Please remove me from the group."
        );
        logWithTime(
          `⚠️ Authentication failed for group ${msg.chat.title} (${msg.chat.id}).`
        );
        return false;
      }
    }
    return true;
  }

  async function commandHandler(
    msg: TelegramBot.Message,
    command: string,
    isMentioned: boolean
  ) {
    const userInfo = `@${msg.from?.username ?? ''} (${msg.from?.id})`;
    const chatInfo =
      msg.chat.type == 'private'
        ? 'private chat'
        : `group ${msg.chat.title} (${msg.chat.id})`;
    if (DEBUG >= 1) {
      logWithTime(
        `👨‍💻️ User ${userInfo} issued command "${command}" in ${chatInfo} (isMentioned=${isMentioned}).`
      );
    }

    // Ignore commands without mention in groups.
    if (msg.chat.type != 'private' && !isMentioned) return;

    if (!(await authenticate(msg))) {
      return;
    }

    switch (command) {
      case '/help':
        await bot.sendMessage(
          msg.chat.id,
          'To chat with me, you can:\n' +
            '  • send messages directly (not supported in groups)\n' +
            `  • send messages that start with ${chatCmd}\n` +
            '  • reply to my last message\n\n' +
            'Command list:\n' +
            `(When using a command in a group, make sure to include a mention after the command, like /help@${botUsername}).\n` +
            '  • /help Show help information.\n' +
            '  • /reset Reset the current chat thread and start a new one.\n' +
            '  • /reload (admin required) Refresh the ChatGPT session.'
        );
        break;

      case '/reset':
        await bot.sendChatAction(msg.chat.id, 'typing');
        await api.resetThread();
        chatContext = {};
        await bot.sendMessage(
          msg.chat.id,
          '🔄 The chat thread has been reset. New chat thread started.'
        );
        logWithTime(`🔄 Chat thread reset by ${userInfo}.`);
        break;

      case '/reload':
        if (ownerIdList.indexOf(msg.from?.id ?? 0) == -1) {
          await bot.sendMessage(
            msg.chat.id,
            '⛔️ Sorry, you do not have the permission to run this command.'
          );
          logWithTime(
            `⚠️ Permission denied for "${command}" from ${userInfo}.`
          );
        } else {
          await bot.sendChatAction(msg.chat.id, 'typing');
          await api.refreshSession();
          await bot.sendMessage(msg.chat.id, '🔄 Session refreshed.');
          logWithTime(`🔄 Session refreshed by ${userInfo}.`);
        }
        break;

      default:
        await bot.sendMessage(
          msg.chat.id,
          '⚠️ Unsupported command. Run /help to see the usage.'
        );
        break;
    }
  }

  async function chatHandler(msg: TelegramBot.Message, text: string) {
    if (!((await authenticate(msg)) && text)) return;

    const chatId = msg.chat.id;
    if (DEBUG >= 1) {
      const userInfo = `@${msg.from?.username ?? ''} (${msg.from?.id})`;
      const chatInfo =
        msg.chat.type == 'private'
          ? 'private chat'
          : `group ${msg.chat.title} (${msg.chat.id})`;
      logWithTime(`📩 Message from ${userInfo} in ${chatInfo}:\n${text}`);
    }

    // Send a message to the chat acknowledging receipt of their message
    let reply = await bot.sendMessage(chatId, '🤔', {
      reply_to_message_id: msg.message_id,
    });
    bot.sendChatAction(chatId, 'typing');

    // Send message to ChatGPT
    try {
      const res = await api.sendMessage(text, {
        ...chatContext,
        // Note: current `onProgress` has no effect because it has not been implemented in `ChatGPTAPIBrowser`.
        onProgress: _.throttle(
          async (partialResponse: ChatResponse) => {
            reply = await editMessage(reply, partialResponse.response);
            bot.sendChatAction(chatId, 'typing');
          },
          4000,
          {leading: true, trailing: false}
        ),
      });
      await editMessage(reply, res.response);
      chatContext = {
        conversationId: res.conversationId,
        parentMessageId: res.messageId,
      };
      if (DEBUG >= 1) logWithTime(`📨 Response:\n${res.response}`);
    } catch (err) {
      logWithTime('⛔️ ChatGPT API error:', (err as Error).message);
      bot.sendMessage(
        chatId,
        "⚠️ Sorry, I'm having trouble connecting to the server, please try again later."
      );
    }
  }

  // Edit telegram message
  async function editMessage(
    msg: TelegramBot.Message,
    text: string,
    needParse = true
  ): Promise<TelegramBot.Message> {
    if (msg.text === text) {
      return msg;
    }
    try {
      const res = await bot.editMessageText(text, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: needParse ? 'Markdown' : undefined,
      });
      // type of res is boolean | Message
      if (typeof res === 'object') {
        // return a Message type instance if res is a Message type
        return res as TelegramBot.Message;
      } else {
        // return the original message if res is a boolean type
        return msg;
      }
    } catch (err) {
      logWithTime('⛔️ Edit message error:', (err as Error).message);
      return msg;
    }
  }
  bot.on('message', messageHandler);
}

function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
