// pages/HomePage.js — Page Object for site/index.html
// ES6 export

import { BasePage } from './BasePage.js';

export class HomePage extends BasePage {
  constructor(page) {
    super(page);

    this.heading = page.getByRole('heading', { level: 1 });
    this.searchInput = page.locator('#search');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.searchResult = page.getByTestId('search-result');
    this.cartCount = page.locator('#cart-count');
    this.productCards = page.locator('.product');
  }

  async open() {
    await this.goto('index.html');
    return this;
  }

  // locator for ONE product by SKU
  productCard(sku) {
    return this.page.locator(`.product[data-sku="${sku}"]`);
  }

  addToCartButton(sku) {
    return this.page.locator(`.add-btn[data-sku="${sku}"]`);
  }

  // ---- actions ----
  async addProduct(sku) {
    await this.addToCartButton(sku).click();
  }

  async addProductTimes(sku, times) {
    for (let i = 0; i < times; i += 1) {
      await this.addProduct(sku);
    }
  }

  async search(term) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  async productCount() {
    return this.productCards.count();
  }
}
