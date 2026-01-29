from playwright.sync_api import sync_playwright
import time

def verify_coordinator_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Login as Direccion
        print("Logging in as Direccion...")
        try:
            page.goto("http://localhost:3006/#/login")
            page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        page.fill('input[name="username"]', "direccion")
        page.fill('input[name="password"]', "123")
        page.click('button[type="submit"]')

        # Wait for dashboard
        try:
            page.wait_for_url("http://localhost:3006/#/", timeout=5000)
        except:
             print("Login might have failed or slow")
             page.screenshot(path="/home/jules/verification/login_fail.png")

        print("Logged in.")

        # 2. Go to Users
        page.click('text="Usuarios & Permisos"')
        # Wait for list to load
        page.wait_for_selector('text="Listado de Usuarios"')
        print("In User Manager.")

        # 3. Create a Test User (Coordinator)
        page.click('text="Crear Usuario"')

        # Fill Form
        # We need specific selectors. The UserManager renders inputs.
        # "Nombre"
        page.fill('input[placeholder="Nombre"]', "Test Coordinator")
        # "Usuario (Login)"
        page.fill('input[placeholder="Usuario (Login)"]', "coord_test")
        # "Email"
        page.fill('input[placeholder="Email"]', "coord@test.com")

        # Select Coordinator Cycle.
        # The select has default text "-- Sin Rol de Coordinación --"
        # We pick the 2nd option (index 1) which should be a cycle.
        selects = page.locator('select')
        # We expect 2 selects: Role and Coordinator (since Role defaults to Tutor)
        # Verify role is Tutor

        # Find the select that contains options for cycles (starts with c1, c2.. or has text "Coordinador:")
        # Let's just target the select that isn't the role one.
        # Role select has options "Tutor", "Dirección"...

        # Let's try to select by value if we know cycle IDs? c1, c2...
        # Or select the second select element

        # Wait for the specific select to appear
        page.wait_for_timeout(500)

        # Target the Coordinator select
        coord_select = page.locator('select').nth(1)
        coord_select.select_option(index=1)

        page.click('button:has-text("Guardar")')
        print("Created Coordinator User.")
        time.sleep(1)

        # 4. Logout
        page.click('button:has-text("Cerrar Sesión")')
        page.wait_for_url("http://localhost:3006/#/login")

        # 5. Login as Coordinator
        print("Logging in as Coordinator...")
        page.fill('input[name="username"]', "coord_test")
        page.fill('input[name="password"]', "123")
        page.click('button[type="submit"]')
        page.wait_for_url("http://localhost:3006/#/")

        # 6. Check Sidebar for Toggle
        time.sleep(2)
        page.screenshot(path="/home/jules/verification/coordinator_sidebar.png")
        print("Screenshots taken.")

        browser.close()

if __name__ == "__main__":
    verify_coordinator_feature()
