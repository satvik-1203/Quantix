import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import cors from "cors";
import express from "express";
import generateTestRouter from "./routers/generate-test/controller";
import callSubtestRouter from "./routers/call-subtest/controller";
import agentmailRouter from "./routers/agentmail/controller";
import emailAnalyticsRouter from "./routers/email-analytics/controller";
import emailDatasetRouter from "./routers/email-dataset/controller";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/generate-test", generateTestRouter);
app.use("/api/call-subtest", callSubtestRouter);
app.use("/api/agentmail", agentmailRouter);
app.use("/api/email-analytics", emailAnalyticsRouter);
app.use("/api/email-dataset", emailDatasetRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
