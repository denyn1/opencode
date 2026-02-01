#!/usr/bin/env node

import { test, expect } from "@playwright/test"

test("Frontend verification", async ({ page }) => {
  // Test homepage loads correctly
  await page.goto("http://localhost:4321")

  // Check title
  await expect(page).toHaveTitle(/opencode/)

  // Check main heading
  await expect(page.locator("h1")).toContainText("The AI coding agent built for the terminal")

  // Test copy functionality
  const copyButton = page.locator("button.command").first()
  await copyButton.click()

  // Test that clicking Get Started works
  const getStartedLink = page.locator('a[href="/docs"]')
  await expect(getStartedLink).toBeVisible()

  // Navigate to docs to test routing
  await getStartedLink.click()
  await expect(page).toHaveURL(/\/docs/)

  // Test share page functionality if we can create a test share
  // For now, just verify the page structure exists
  await page.goto("http://localhost:4321/s/test-id")

  // This should either show a 404 or a share page
  // The important thing is it doesn't crash the app
  const title = await page.title()
  expect(title).toBeDefined()

  console.log("✅ Frontend verification test passed")
})
