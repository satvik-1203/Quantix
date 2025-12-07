import { Router, type Request, type Response } from "express";
import { getSubTestExpense } from "./service";

const router: Router = Router();

router.get("/:subTestId", async (req, res) => {
  try {
    const { subTestId } = req.params;
    const expense = await getSubTestExpense(parseInt(subTestId));
    res.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ error: "Failed to fetch expense report" });
  }
});

export default router;
