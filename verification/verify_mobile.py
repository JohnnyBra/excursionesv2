from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        print("Navigating to login...")
        page.goto("http://localhost:3006/#/login")

        try:
            page.wait_for_selector("input[type='text']", timeout=10000)
        except:
            if page.url.endswith("#/"):
                print("Already on dashboard.")
            else:
                print("Login input not found.")
                raise

        if page.locator("input[type='text']").is_visible():
            print("Logging in...")
            page.fill("input[type='text']", "direccion")
            page.fill("input[type='password']", "123")
            page.click("button[type='submit']")

        print("Waiting for dashboard...")
        page.wait_for_url("http://localhost:3006/#/", timeout=10000)

        print("Verifying Mobile Nav...")
        # Use exact matches or roles
        expect(page.get_by_role("button", name="Inicio")).to_be_visible()
        expect(page.get_by_role("button", name="Excursiones")).to_be_visible()

        print("Navigating to Excursions...")
        page.get_by_role("button", name="Excursiones").click()
        page.wait_for_url("http://localhost:3006/#/excursions")

        print("Verifying List View...")
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/mobile_list_view.png")

        print("Selecting an excursion...")
        # Look for the card. In mobile it's a div with glass classes.
        # We can look for text inside the list.
        # Assuming there are no excursions initially in empty DB?
        # But server has INITIAL_DATA which has NO excursions.
        # "excursions": [] in server.js

        # If no excursions, we can't verify details view.
        # We should create one?
        # We are "DIRECCION", we can probably create one?
        # But "Tesorería no crea", "Dirección" can create?
        # In ExcursionManager: user?.role !== UserRole.TESORERIA can create.
        # So yes.

        if page.locator("text=No hay excursiones").count() > 0 or page.locator("text=Selecciona una excursión").count() == 0:
             # Try to click the + button in the header (mobile view has it?)
             # In mobile view, Sidebar List has header with Plus button?
             # Yes:
             # {mode !== 'treasury' && user?.role !== UserRole.TESORERIA && (
             #   <button onClick={handleCreateNew} ... <Plus size={18} />

             print("Creating new excursion for test...")
             # Locate the Plus button. It's inside the sidebar header.
             # It might be hard to distinguish from other buttons.
             # It has <Plus>.
             # Locator by selector? button containing svg.lucide-plus
             # Or just by index?

             # Actually, if list is empty, we see "No hay excursiones"?
             # No, if list is empty, we just see empty list.
             # The Plus button is in the top right of the "Excursiones" panel.

             # Let's try to find it.
             plus_btn = page.locator("button:has(svg.lucide-plus)").first
             if plus_btn.is_visible():
                 plus_btn.click()
                 print("Clicked Create New.")
                 page.wait_for_timeout(500)
                 page.screenshot(path="verification/mobile_create_view.png")

                 # Now we should be in Details view (Edit mode)
                 # Check for "Nueva Excursión" input
                 expect(page.get_by_placeholder("Título")).to_be_visible()

                 # Fill title
                 page.fill("input[placeholder='Título']", "Test Excursion Mobile")
                 page.fill("input[type='datetime-local']", "2026-05-20T09:00")

                 # Save
                 page.get_by_role("button", name="Guardar").click()
                 print("Saved new excursion.")
                 page.wait_for_timeout(1000)

                 # Now we should be in Details view (Read mode)
                 page.screenshot(path="verification/mobile_details_view.png")

                 # Check for Back button
                 back_button = page.locator("button.md\\:hidden").first
                 expect(back_button).to_be_visible()
                 print("Back button verified.")

                 # Click back
                 back_button.click()
                 print("Clicked Back.")
                 page.wait_for_timeout(500)
                 page.screenshot(path="verification/mobile_back_to_list.png")

                 # Should see list again
                 expect(page.get_by_text("Test Excursion Mobile")).to_be_visible()

             else:
                 print("Plus button not found.")
        else:
            # Excursions exist
            first_excursion = page.locator(".glass-panel .cursor-pointer").first
            if first_excursion.count() > 0:
                first_excursion.click()
                print("Clicked excursion.")
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/mobile_details_view.png")

                back_button = page.locator("button.md\\:hidden").first
                expect(back_button).to_be_visible()
                print("Back button verified.")

        browser.close()
        print("Verification complete.")

if __name__ == "__main__":
    run()
