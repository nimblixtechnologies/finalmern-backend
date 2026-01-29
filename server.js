
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require("multer");
require("dotenv").config();

/* ===============================
   CLOUDINARY SETUP
================================ */
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://finalmern-4.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

/* ===============================
   MAIL CONFIG
================================ */
// const transporter = nodemailer.createTransport({
//   host: process.env.MAIL_HOST,
//   port: process.env.MAIL_PORT,
//   secure: false,
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS,
//   },
// });
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});


transporter.verify((err) => {
  if (err) console.log("❌ Mail Error:", err);
  else console.log("✅ Mail Server Ready");
});

/* ===============================
   MULTER + CLOUDINARY STORAGE
================================ */

/* 🎥 Screen Recordings */
const recordingStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interview-platform/recordings",
    resource_type: "video",
  },
});

const uploadRecording = multer({ storage: recordingStorage });

/* 📄 CV Uploads */
const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interview-platform/cvs",
    resource_type: "raw",
    allowed_formats: ["pdf", "doc", "docx"],
  },
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ===============================
   SCREEN RECORDING API
================================ */
app.post(
  "/api/recordings",
  uploadRecording.single("recording"),
  (req, res) => {
    res.json({
      success: true,
      message: "Recording uploaded",
      url: req.file.path,
    });
  }
);

/* ===============================
   CV UPLOAD API
================================ */


// app.post("/api/upload-cv", uploadCV.single("cv"), async (req, res) => {
//    console.log("BODY:", req.body);
//   console.log("FILE:", req.file);

//   res.json({ ok: true });
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         error: "No file uploaded",
//       });
//     }

//     const fileUrl = req.file.path;

//     await transporter.sendMail({
//       from: `"Interview Platform" <${process.env.MAIL_USER}>`,
//       to: "nimblixtechnologies@gmail.com",
//       subject: "New CV Uploaded",
//       html: `
//         <p>A new CV has been uploaded.</p>
//         <a href="${fileUrl}" target="_blank">View CV</a>
//       `,
//     });

//     res.json({
//       success: true,
//       message: "CV uploaded successfully",
//       cvUrl: fileUrl,
//     });
//   } catch (error) {
//     console.error("CV UPLOAD ERROR:", error.message);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });
app.post("/api/upload-cv", uploadCV.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const fileUrl = req.file.path;

    await transporter.sendMail({
      from: `"Interview Platform" <${process.env.MAIL_USER}>`,
      to: "nimblixtechnologies@gmail.com",
      subject: "New CV Uploaded",
      html: `
        <p>A new CV has been uploaded.</p>
        <a href="${fileUrl}" target="_blank">View CV</a>
      `,
    });

    res.json({
      success: true,
      message: "CV uploaded successfully",
      cvUrl: fileUrl,
    });
  } catch (error) {
    console.error("CV UPLOAD ERROR:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ===============================
   SEND MAIL (MCQ / BOARD)
================================ */
app.post("api/send-mail", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `MCQ App <${process.env.MAIL_USER}>`,
      to: "nimblixtechnologies@gmail.com",
      subject: "New Submission",
      html: `<pre>${JSON.stringify(req.body, null, 2)}</pre>`,
    });

    res.json({ success: true, message: "Mail sent" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ===============================
   GENERATE MEETING LINK
================================ */
app.post("/generate-meeting", async (req, res) => {
  try {
    const meetingId = crypto.randomUUID();
    const meetingLink = `http://localhost:5173/hr-meeting/${meetingId}`;

    await transporter.sendMail({
      from: `Interview App <${process.env.MAIL_USER}>`,
      to: "nimblixtechnologies@gmail.com",
      subject: "HR Interview Meeting Link",
      html: `<a href="${meetingLink}">${meetingLink}</a>`,
    });

    res.json({ success: true, meetingLink });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    error: err.message || "Server error",
  });
});

/* ===============================
   START SERVER
================================ */
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Backend running on http://localhost:${PORT}`);
// });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

app.get("/mail-test", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: "Mail test",
      text: "Mail system working",
    });
    res.send("Mail sent successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
