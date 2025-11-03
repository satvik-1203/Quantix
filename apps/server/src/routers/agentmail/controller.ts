import { Router } from "express";
import { sendAgentMail, startTest, getThreadMessages } from "./service";
import { rerunJudge } from "./service";

const router: Router = Router();

// webhook id: ep_34J668k4yPlYpG62qqberw4BI2p
router.post("/webhook", sendAgentMail);
router.get("/webhook", (req, res) => {
  res.status(200).send("OK");
});
router.post("/start-test", startTest);
router.get("/thread/:threadId", getThreadMessages);
router.post("/judge", rerunJudge);

export default router;
