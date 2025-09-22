import { db } from "@/db"
import { testCases } from "@/db/schema"
import { eq } from "drizzle-orm"


export const generateTestService = async (testCaseId: number) => {

    // Get the test case
    
    const testCase = await db.query.testCases.findMany()

    if (!testCase) {
        throw new Error("Test case not found")
    }

    return testCase
}