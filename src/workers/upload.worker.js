const { Worker } = require("bullmq");
const connection = require("../config/redis");

// your job processor function
const processor = async (job) => {
  console.log("Processing job:", job.id);
  console.log("Data:", job.data);

  // 👉 your upload logic here
};

const worker = new Worker("upload", processor, {
  connection,
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed:`, err.message);
});

module.exports = worker;