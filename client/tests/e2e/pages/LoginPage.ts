import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput    = page.locator('#login-email');
    this.passwordInput = page.locator('#login-password');
    this.submitButton  = page.locator('#login-submit');
    this.errorMessage  = page.locator('[role="alert"], .toast-error, [data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible({ timeout: 10_000 });
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      // react-hot-toast renders toasts with role="status"
      const toast = this.page.locator('[role="status"]', { hasText: /invalid|error|wrong|not found/i }).first();
      await toast.waitFor({ state: 'visible', timeout: 5_000 });
      return toast.textContent();
    } catch {
      return null;
    }
  }
}
