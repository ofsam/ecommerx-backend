const uploadQueue = require("../queues/upload.queue");
const db = require("../config/db");  // 👈 ADD THIS LINE - FIXES THE ERROR

const uploadExcel = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    

    // DETERMINE VENDOR
    let vendorId;
    let vendorEmail;
    let vendorName;

    if (req.user.role === "SUPER_ADMIN") {
      vendorId = req.body.vendor_id;
      if (!vendorId) {
        return res.status(400).json({ error: "vendor_id is required" });
      }
      
      // Fetch vendor details from database
      const vendorResult = await db.query(
        "SELECT email, name FROM vendors WHERE id = $1",
        [vendorId]
      );
      
      if (vendorResult.rows.length === 0) {
        return res.status(400).json({ error: "Vendor not found" });
      }
      
      vendorEmail = vendorResult.rows[0].email;
      vendorName = vendorResult.rows[0].name;
      
    } else if (req.user.role === "VENDOR_ADMIN") {
      // For VENDOR_ADMIN, use their own vendor
      vendorId = req.user.vendor_id;
      
      const vendorResult = await db.query(
        "SELECT email, name FROM vendors WHERE id = $1",
        [vendorId]
      );
      
      if (vendorResult.rows.length === 0) {
        return res.status(400).json({ error: "Vendor not found" });
      }
      
      vendorEmail = vendorResult.rows[0].email;
      vendorName = vendorResult.rows[0].name;
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    console.log(`Queueing upload for vendor: ${vendorName} (${vendorEmail})`);

    // ADD TO QUEUE
    const job = await uploadQueue.add("process-excel", {
      fileBuffer: file.buffer.toString("base64"),
      fileName: file.originalname,
      vendorId: vendorId,
      vendorEmail: vendorEmail,
      vendorName: vendorName,
      uploadedBy: req.user.id
    });

    console.log(`Job ${job.id} added to queue`);

    res.json({
      message: "File uploaded successfully. Processing started.",
      jobId: job.id
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Add status check endpoint (optional but helpful)
const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await uploadQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;
    
    res.json({
      jobId,
      state,
      result,
      error: failedReason,
      createdAt: job.timestamp,
      processedAt: job.finishedOn
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadExcel, getJobStatus };