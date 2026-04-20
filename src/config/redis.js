const IORedis = require("ioredis");

const connection = new IORedis(
  "rediss://default:YOUR_PASSWORD@adapted-tapir-92317.upstash.io:6379"
);

module.exports = connection;