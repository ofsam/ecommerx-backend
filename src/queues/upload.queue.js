const { Queue } = require("bullmq");
const connection = require("../config/redis");

const uploadQueue = new Queue("upload", {
  connection,
});

module.exports = uploadQueue;