export type AgentMailAttachment = {
  attachment_id: string;
  size: number;
  inline: boolean;
  filename: string;
  content_type: string;
};

export type AgentMailMessage = {
  inbox_id: string;
  thread_id: string;
  message_id: string;
  labels: string[];
  timestamp: string;
  from: string;
  to: string[];
  size: number;
  updated_at: string;
  created_at: string;
  reply_to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  preview: string;
  text: string;
  html: string;
  attachments: AgentMailAttachment[];
  in_reply_to: string;
  references: string[];
};

export type AgentMailMessageReceivedEvent = {
  type: "event";
  event_type: "message.received";
  event_id: string;
  message: AgentMailMessage;
};
