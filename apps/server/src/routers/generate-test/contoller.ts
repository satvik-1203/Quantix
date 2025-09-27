import { Router } from "express";
import { generateTestService } from "./service";

const router: Router = Router();

// api/generate-test/home
router.post("/", async (req, res) => {
  const id = req.body.id;

  const generatedTestCases = await generateTestService(id);

  res.status(200).send(generatedTestCases);
});

export default router;
