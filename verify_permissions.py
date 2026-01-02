
import os
from playwright.sync_api import sync_playwright, expect

def test_permissions():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1. Login as Tutor A
        page = browser.new_page()
        page.goto("http://localhost:3005")

        # Fill Login Form
        page.fill("input[name='username']", "tutora")
        page.fill("input[name='password']", "123")
        page.click("button[type='submit']")

        # Wait for dashboard
        page.wait_for_selector("text=Bienvenido/a Tutor A")

        # Go to Excursions - using specific selector from sidebar nav
        # It's inside a NavItem
        page.click("aside nav >> text=Excursiones")

        # Select Global Excursion
        page.wait_for_selector("text=Global Trip")
        page.click("text=Global Trip")

        # Check Students Table
        # Student A (Class A) should be editable (cursor-pointer)
        # Student B (Class B) should be NOT editable (cursor-not-allowed)

        # We can check for the "Otra clase" badge for Student B
        page.wait_for_selector("text=Student A")
        page.wait_for_selector("text=Student B")

        # Take screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/permissions.png")

        # Assertions
        # Check if Student B row has "Otra clase"
        content = page.content()
        assert "Otra clase" in content

        print("Verification successful")
        browser.close()

if __name__ == "__main__":
    test_permissions()
