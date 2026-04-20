const { Worker } = require("bullmq");

const worker = new Worker(
  "upload",
  processor,
  {
    connection: {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null,
    },
  }
);