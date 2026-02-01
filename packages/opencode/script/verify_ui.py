
import time
from playwright.sync_api import Page, expect, sync_playwright

def verify_macos_ui(page: Page):
    # Navigate to the dashboard
    page.goto("http://localhost:4096/swarm")

    # Assert Title
    expect(page).to_have_title("Opencode OS")

    # Assert Desktop and Window
    expect(page.locator("#desktop")).to_be_visible()
    expect(page.locator(".window")).to_be_visible()

    # Assert Title Bar Traffic Lights
    expect(page.locator(".traffic-lights .light.close")).to_be_visible()

    # Assert Dock
    expect(page.locator("#dock")).to_be_visible()
    expect(page.locator(".dock-icon").first).to_be_visible()

    # Check Navigation via Dock
    page.locator(".dock-icon").nth(1).click() # Memory icon
    expect(page.locator("#view-memory")).to_be_visible()
    expect(page.locator("#view-memory h2")).to_have_text("Hive Mind Knowledge")

    # Take screenshot
    page.screenshot(path="/home/jules/verification/macos_ui.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            time.sleep(2)
            verify_macos_ui(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_ui.png")
        finally:
            browser.close()
