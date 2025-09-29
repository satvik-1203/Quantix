import { VapiClient } from "@vapi-ai/server-sdk";

export const getVapiClient = () => {
  console.log("VAPI_PRIVATE_KEY", process.env.VAPI_PRIVATE_KEY);
  return new VapiClient({
    token: process.env.VAPI_PRIVATE_KEY || "",
  });
};
