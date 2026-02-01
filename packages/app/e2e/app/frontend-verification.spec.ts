import { test, expect } from "../fixtures"
import { promptSelector } from "../selectors"
import { withSession } from "../actions"

test("frontend verification test", async ({ page, sdk, gotoSession }) => {
  await withSession(sdk, "frontend verification", async (session) => {
    await gotoSession(session.id)

    const prompt = page.locator(promptSelector)
    await expect(prompt).toBeVisible()

    await prompt.click()
    await page.keyboard.type("Hello from frontend verification test")
    await expect(prompt).toContainText("Hello from frontend verification test")

    const sidebar = page.getByRole("button", { name: "Toggle file tree" })
    await expect(sidebar).toBeVisible()
    await sidebar.click()

    const fileTree = page.locator('[data-component="tabs"][data-variant="pill"][data-scope="filetree"]')
    await expect(fileTree).toBeVisible()

    await sidebar.click()
    await expect(fileTree).toBeHidden()
  })
})
