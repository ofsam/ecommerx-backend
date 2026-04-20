const { Worker } = require("bullmq");
const connection = require("../config/redis");

const worker = new Worker(
  "upload",
  async (job) => {
    console.log("Processing:", job.data);
  },
  { connection }
);