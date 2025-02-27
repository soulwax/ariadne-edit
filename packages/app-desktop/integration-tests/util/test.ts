import { resolve, join, dirname } from 'path';
import { remove, mkdirp } from 'fs-extra';
import { _electron as electron, Page, ElectronApplication, test as base } from '@playwright/test';
import uuid from '@joplin/lib/uuid';
import createStartupArgs from './createStartupArgs';
import firstNonDevToolsWindow from './firstNonDevToolsWindow';



type JoplinFixtures = {
	profileDirectory: string;
	electronApp: ElectronApplication;
	startupPluginsLoaded: Promise<void>;
	mainWindow: Page;
};

// A custom fixture that loads an electron app. See
// https://playwright.dev/docs/test-fixtures

export const test = base.extend<JoplinFixtures>({
	// Playwright fails if we don't use the object destructuring
	// pattern in the first argument.
	//
	// See https://github.com/microsoft/playwright/issues/8798
	//
	// eslint-disable-next-line no-empty-pattern
	profileDirectory: async ({ }, use) => {
		const profilePath = resolve(join(dirname(__dirname), 'test-profile'));
		const profileSubdir = join(profilePath, uuid.createNano());
		await mkdirp(profileSubdir);

		await use(profileSubdir);

		await remove(profileSubdir);
	},

	electronApp: async ({ profileDirectory }, use) => {
		const startupArgs = createStartupArgs(profileDirectory);
		const electronApp = await electron.launch({ args: startupArgs });

		await use(electronApp);

		await electronApp.firstWindow();
		await electronApp.close();
	},

	startupPluginsLoaded: async ({ electronApp }, use) => {
		const startupPluginsLoadedPromise = electronApp.evaluate(({ ipcMain }) => {
			return new Promise<void>(resolve => {
				ipcMain.once('startup-plugins-loaded', () => resolve());
			});
		});

		await use(startupPluginsLoadedPromise);
	},

	mainWindow: async ({ electronApp }, use) => {
		const mainWindow = await firstNonDevToolsWindow(electronApp);
		await use(mainWindow);
	},
});

export { default as expect } from './extendedExpect';
