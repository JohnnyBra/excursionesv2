from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()

    # Listen for errors
    page.on("requestfailed", lambda request: print(f"Request failed: {request.url} - {request.failure}"))
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    # 1. Login
    print("Navigating to login...")
    page.goto("http://localhost:3005/#/login")

    # Take screenshot of login page (gradient check)
    page.wait_for_timeout(2000)
    page.screenshot(path="verification/login_page.png")

    print("Logging in...")
    page.fill("input[name='username']", "direccion")
    page.fill("input[name='password']", "123")
    page.click("button[type='submit']")

    # Wait for dashboard
    expect(page.get_by_text("Hola, Dirección")).to_be_visible(timeout=10000)
    print("Login successful.")

    # 2. Enable Dark Mode
    print("Enabling Dark Mode...")
    # Navigate to Settings via sidebar
    page.click("nav >> text=Configuración")

    # Check if we are on settings page
    expect(page.get_by_text("Seguridad y Perfil")).to_be_visible()

    # Click "Oscuro" button.
    print("Clicking 'Oscuro' button...")
    page.click("button:has-text('Oscuro')")
    page.wait_for_timeout(2000) # Wait for transition

    # Check html class
    html_class = page.eval_on_selector("html", "el => el.className")
    print(f"HTML Class after clicking Oscuro: '{html_class}'")

    # Take screenshot of settings page
    page.screenshot(path="verification/settings_page_dark.png")

    if 'dark' not in html_class:
        print("ERROR: Dark mode not applied!")

    # 3. Go to Excursions
    print("Navigating to Excursions...")
    page.click("nav >> text=Excursiones")
    page.wait_for_timeout(1000)

    # Take screenshot of Excursions List (Dark)
    page.screenshot(path="verification/excursions_list_dark.png")

    # 4. Create New Excursion
    print("Creating new excursion...")

    # Find create button (blue +)
    # The button text might be inside SVG or just title attr
    # Let's rely on class
    page.locator("button.bg-blue-600").first.click()

    # Wait for form
    expect(page.locator("input[placeholder='Título']")).to_be_visible()

    # Fill data
    page.fill("input[placeholder='Título']", "Excursión Dark Mode 2")
    page.fill("input[placeholder='Destino']", "Museo del Prado")

    print("Taking screenshot of form...")
    page.screenshot(path="verification/dark_mode_form.png")

    # Save
    print("Saving excursion...")
    page.click("button:has-text('Guardar')")

    # Wait for details view.
    expect(page.get_by_text("Museo del Prado").first).to_be_visible()

    print("Taking screenshot of details...")
    page.screenshot(path="verification/dark_mode_details.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
