import { defineConfig } from "ludicord/config";

export default defineConfig({
  discord: {
    clientId: process.env.LUDICORD_DISCORD_CLIENT_ID,
    scopes: ["identify", "guilds"],
    auth: {
      required: true,
      session: "encrypted-cookie",
      proxyVerification: false,
      activityInstanceVerification: false,
    },
  },
  activity: {
    defaultEmbed: "home",
    outsideDiscord: "allow",
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true,
    limits: { body: "2mb" },
    requestTimeout: 30000,
    shutdownTimeout: 10000,
  },
  websocket: {
    enabled: true,
    heartbeatInterval: 30000,
    maxPayload: 262144,
    compression: false,
    maxMessagesPerSecond: 120,
    reconnect: {
      enabled: true,
      attempts: 10,
      initialDelay: 500,
      maxDelay: 10000,
    },
  },
  react: {
    strictMode: true,
  },
  build: {
    clientAssetWarningLimit: 512000,
  },
});
