// pages/LoginPage.js — Page Object for site/login.html
// ES6 export
// ============================================================
//
// POM rule of thumb:
//   LOCATORS  → class properties (getters / fields)
//   ACTIONS   → methods (login, open, clickSignIn)
//   URL/paths → constants or methods
//
// Tests should NOT know CSS selectors — only this class knows.

import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page); // call BasePage constructor → sets this.page

    // ---- locators (WHERE) ----
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByTestId('login-error');
    this.backHomeLink = page.getByTestId('back-home');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  // ---- open the page ----
  async open() {
    await this.goto('login.html');
    return this; // allow chaining: await new LoginPage(page).open()
  }

  // ---- ACTIONS (WHAT user does) ----
  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  // high-level action: full login in one call
  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  async loginExpectingError(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
    // stay on login page — error shown
  }
}
