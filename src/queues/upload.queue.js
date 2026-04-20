const { Queue } = require("bullmq");
const connection = require("../config/redis");

// Create upload queue
const uploadQueue = new Queue("upload", {
  connection,
});

module.exports = uploadQueue;