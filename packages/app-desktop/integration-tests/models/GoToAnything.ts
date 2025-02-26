
import { ElectronApplication, expect, Locator, Page } from '@playwright/test';
import MainScreen from './MainScreen';
import activateMainMenuItem from '../util/activateMainMenuItem';

export default class GoToAnything {
	public readonly containerLocator: Locator;
	public readonly inputLocator: Locator;

	public constructor(page: Page, private readonly mainScreen: MainScreen) {
		this.containerLocator = page.locator('.go-to-anything-dialog[open]');
		this.inputLocator = this.containerLocator.getByRole('textbox');
	}

	public async open(electronApp: ElectronApplication) {
		await this.mainScreen.waitFor();

		if (!await activateMainMenuItem(electronApp, 'Goto Anything...')) {
			throw new Error('Menu item for opening Goto Anything not found');
		}

		return this.waitFor();
	}

	public async waitFor() {
		await this.containerLocator.waitFor();
	}

	public async expectToBeClosed() {
		await expect(this.containerLocator).not.toBeAttached();
	}

	public async expectToBeOpen() {
		await expect(this.containerLocator).toBeAttached();
	}
}
