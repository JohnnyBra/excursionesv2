
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_portal_links(page: Page):
    # 1. Verify Login Page Link
    page.goto("http://localhost:3006") # Port from dev_output.log

    # Check for "Volver a Portal Matriz" link
    portal_link_login = page.get_by_role("link", name="Volver a Portal Matriz")
    expect(portal_link_login).to_be_visible()

    # Take screenshot of login page
    page.screenshot(path="verification/login_page.png")
    print("Login page screenshot taken.")

    # 2. Login to verify Sidebar Link
    # Using 'direccion' / '123'

    page.get_by_placeholder("Usuario").fill("direccion")
    page.get_by_placeholder("••••••••").fill("123")
    page.get_by_role("button", name="Entrar con Credenciales").click()

    # Wait for dashboard
    expect(page.get_by_text("Dashboard")).to_be_visible()

    # 3. Verify Sidebar Link
    # Check for "Portal Matriz" link in sidebar
    portal_link_sidebar = page.get_by_role("link", name="Portal Matriz")
    expect(portal_link_sidebar).to_be_visible()

    # Take screenshot of dashboard with sidebar
    page.screenshot(path="verification/dashboard_sidebar.png")
    print("Dashboard screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_portal_links(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
