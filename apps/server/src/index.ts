import dotenv from "dotenv";
// Prefer .env.local (developer-specific) but allow .env as a fallback.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import cors from "cors";
import express from "express";
import analyticsExpenseRouter from "./routers/analytics-expense/controller";
import generateTestRouter from "./routers/generate-test/controller";
import callSubtestRouter from "./routers/call-subtest/controller";
import agentmailRouter from "./routers/agentmail/controller";
import emailAnalyticsRouter from "./routers/email-analytics/controller";
import emailDatasetRouter from "./routers/email-dataset/controller";
import ragTraceRouter from "./routers/rag-trace/controller";
import llmDialogRouter from "./routers/llm-dialog/controller";

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
app.use("/api/analytics-expense", analyticsExpenseRouter);
app.use("/api/rag-trace", ragTraceRouter);
app.use("/api/llm-dialog", llmDialogRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
