// pages/DashboardPage.js — Page Object for site/dashboard.html
// ES6 export

import { BasePage } from './BasePage.js';

export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);

    this.heading = page.getByRole('heading', { level: 1 });
    this.userEmail = page.getByTestId('user-email');
    this.welcomeMsg = page.getByTestId('welcome');
    this.logoutButton = page.locator('#logout-btn');
    this.logoutOk = page.getByTestId('logout-ok');
    this.statsList = page.locator('#stats li');
    this.ordersLink = page.locator('#orders-link');
  }

  async open() {
    await this.goto('dashboard.html');
    return this;
  }

  // ---- assertions helpers (optional but readable) ----
  async expectLoggedIn(email) {
    await this.page.waitForURL(/dashboard\.html/);
    await this.heading.waitFor({ state: 'visible' });
    // userEmail / welcome are locators — tests can also assert directly
    await this.userEmail.waitFor({ state: 'visible' });
    if (email) {
      // caller can assert text: expect(await ... ) — keep simple:
      // we return the locator so test can: await expect(dash.userEmail).toHaveText(...)
    }
  }

  async logout() {
    await this.logoutButton.click();
    // page redirects to login.html after 200ms
    await this.page.waitForURL(/login\.html/);
  }
}
