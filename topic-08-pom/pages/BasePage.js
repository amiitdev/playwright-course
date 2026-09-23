// pages/BasePage.js — BASE class shared by all page objects
// ES6 export
// ============================================================
//
// BasePage holds things EVERY page needs:
//   - the Playwright `page` object
//   - a goto() helper
//
// Child classes:  class LoginPage extends BasePage { ... }

export class BasePage {
  // constructor runs when: new LoginPage(page)
  constructor(page) {
    this.page = page; // keep reference for subclasses
  }

  // every page can navigate with a relative path
  async goto(path = 'index.html') {
    await this.page.goto(path);
  }

  async title() {
    return this.page.title();
  }

  async url() {
    return this.page.url();
  }
}
