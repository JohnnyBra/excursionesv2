
from playwright.sync_api import sync_playwright

def verify_login_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3006/login')
        page.wait_for_selector('text=Gestor de Excursiones')
        page.screenshot(path='verification/login_page.png')
        browser.close()

if __name__ == '__main__':
    verify_login_page()
