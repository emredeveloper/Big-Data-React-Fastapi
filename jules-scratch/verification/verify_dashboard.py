from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Wait for the title to be correct
        expect(page).to_have_title("🔥 Canlı Veri Dashboard")

        # Wait for the cards to be visible
        expect(page.locator(".value-cards-grid")).to_be_visible()

        # Wait for the charts to be visible
        expect(page.locator(".charts-grid")).to_be_visible()

        # Wait for the table to be visible
        expect(page.locator(".data-table-container")).to_be_visible()

        page.screenshot(path="jules-scratch/verification/dashboard.png")
        browser.close()

if __name__ == "__main__":
    run()
