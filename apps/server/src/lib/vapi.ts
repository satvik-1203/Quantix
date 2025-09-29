import { VapiClient } from "@vapi-ai/server-sdk";

export const getVapiClient = () => {
  return new VapiClient({
    token: process.env.VAPI_PRIVATE_KEY || "",
  });
};
