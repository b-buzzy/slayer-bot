const { App } = require("@slack/bolt");
const { registerListener } = require("./listener");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

registerListener(app);

(async () => {
  await app.start();
  console.log("⚡ slayer-bot is running (Socket Mode)");
})();
