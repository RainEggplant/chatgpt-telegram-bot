# ChatGPT Telegram Bot

![badge:version](https://img.shields.io/badge/version-2.0.0-brightgreen)
![license](https://img.shields.io/badge/license-MIT-green)

A ChatGPT bot for Telegram based on Node.js. Support both browserless and browser-based APIs.

## 🎉 v2 released!

> 🔔 **NOTICE (Feb. 17, 2023)**: According to [one of the maintainers](https://github.com/waylaidwanderer/node-chatgpt-api#updates) of the reverse proxy servers, OpenAI has patched this method. So you have to either use the browserless Official API with official models (which costs money), or use the browser-based solution.

> 🔔 **NOTICE (Feb. 15, 2023)**: We have release the v2.0.0 of this bot, which supports both [browserless](https://github.com/transitive-bullshit/chatgpt-api) and [browser-based](https://github.com/transitive-bullshit/chatgpt-api/tree/v3) APIs. You can switch between the two APIs at any time using the config file. Additionally, we have refactored the codebase to make it more maintainable and easier to extend.
>
> For old users, you will need to switch from the `.env` file to json files under the `config/` folder.


## Features

<table>
  <tr>
    <th>Private Chat</th>
    <th>Group Chat</th>
  </tr>
  <tr>
    <td><img src="./assets/private_chat.jpg" /></td>
    <td><img src="./assets/group_chat.jpg" /></td>
  </tr>
</table>

- Support for both browserless (v4) and browser-based (v3) APIs
- Support for both private and group chats
- Work in privacy mode (the bot can only see specific messages)
- Bot access control based on user and group IDs
- Reset chat thread and refresh session with command
- Typing indicator, Markdown formatting, ...
- Cloudflare bypassing and CAPTCHA automation (for the browser-based API)
- User-friendly logging

## Usage

### Start the server

To get started, follow these steps:

1. Create `local.json` under the `config/` folder. You can copy the `config/default.json` as a template.
2. Modify the `local.json` following the instructions in the file. The settings in `local.json` will override the default settings in `default.json`.
  - Set `api.version` to `v3` if you want to use the browser-based API. Then provide the OpenAI / Google / Microsoft credentials and other settings. You can refer to [this](https://github.com/transitive-bullshit/chatgpt-api/tree/v3#authentication) and [this](https://github.com/transitive-bullshit/chatgpt-api/blob/v3/docs/classes/ChatGPTAPIBrowser.md#parameters) for more details. Make sure you have a Chromium-based browser installed.
  - Set `api.version` to `v4` if you want to use the browserless API. Then provide your [OpenAI API Key](https://platform.openai.com/overview) and other settings. You can refer to [this](https://github.com/transitive-bullshit/chatgpt-api/blob/main/docs/classes/ChatGPTAPI.md#parameters) for more details.
    > **Warning**
    >
    > Using the browserless API may result in charges based on the model you use, as defined in the `api.v4.completionParams` (the default value depends on the version of your `chatgpt` node module). Get more details about this from [the issue section](https://github.com/transitive-bullshit/chatgpt-api/issues) of the API repository.
    >
    > Alternatively, if you prefer to avoid charges, you can utilize the community reverse proxy servers that mimic OpenAI's completions API. Please refer to [this](https://github.com/transitive-bullshit/chatgpt-api/blob/main/demos/demo-reverse-proxy.ts) and [this](https://github.com/waylaidwanderer/node-chatgpt-api#using-a-reverse-proxy) for more details.

Then you can start the bot with:

```shell
pnpm install
pnpm build && pnpm start
```

### Chat with the bot in Telegram

To chat with the bot in Telegram, you can:

- Send direct messages to the bot (this is not supported in groups)
- Send messages that start with the specified command (e.g., `/chat` or the command you specified in the json config file)
- Reply to the bot's last message

> **Note** Make sure you have enabled the privacy mode of your bot before adding it to a group, or it will reply to every message in the group.

The bot also has several commands.

- `/help`: Show help information.
- `/reset`: Reset the current chat thread and start a new one.
- `/reload` (admin required): Refresh the ChatGPT session.

> **Note** When using a command in a group, make sure to include a mention after the command, like `/help@chatgpt_bot`.


## Advanced

### Running the bot on a headless server (browser-based API)

You can use [Xvfb](https://www.x.org/releases/X11R7.6/doc/man/man1/Xvfb.1.xhtml) to create a virtual framebuffer on a headless server and run this program:

```shell
xvfb-run -a --server-args="-screen 0 1280x800x24 -nolisten tcp -dpi 96 +extension RANDR" pnpm start
```

We recommend you to use Google auth to avoid the complicated login Recaptchas. If you use a OpenAI account, you may have to use nopecha or 2captcha or manually solve the Recaptcha (by connecting to the display server using x11vnc). For more details about CAPTCHA solving, please refer to [the api repository](https://github.com/transitive-bullshit/chatgpt-api/tree/v3#captchas).

#### Docker

You can also try this docker image by running the following command from the project root folder:

```shell
docker compose up
```

## LICENSE

[MIT License](LICENSE).

## Credits

- [ChatGPT API](https://github.com/transitive-bullshit/chatgpt-api): Node.js client for the unofficial ChatGPT API.
- [Node.js Telegram Bot API](https://github.com/yagop/node-telegram-bot-api): Telegram Bot API for NodeJS.
- [🤖️ chatbot-telegram](https://github.com/Ciyou/chatbot-telegram): Yet another telegram ChatGPT bot.
