import { AgentMailClient } from "agentmail";

export * as AgentMail from "agentmail";

export const getAgentMailClient = () => {
  return new AgentMailClient({
    apiKey: process.env.AGENTMAIL_KEY || "",
  });
};
export * as AgentMailTypes from "./agentMail.types";
import type { AgentMailMessage } from "./agentMail.types";

export const shapeMessage = (message: AgentMailMessage) => {
  return {
    subject: message.subject,
    body: message.text,
  };
};
