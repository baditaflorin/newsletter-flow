import { expect, test } from '@playwright/test'
import pkg from '../../package.json' with { type: 'json' }

test('homepage loads and generates a draft', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('app-shell')).toBeVisible()
  await expect(page.getByRole('link', { name: /star on github/i })).toHaveAttribute(
    'href',
    'https://github.com/baditaflorin/newsletter-flow',
  )
  await expect(page.getByText(`Version ${pkg.version}`)).toBeVisible()
  await expect(page.getByText(/Commit/)).toBeVisible()

  await page.getByTestId('idea-title').fill('A calmer publishing desk')
  await page.getByTestId('generate-draft').click()
  await expect(page.getByTestId('draft-editor')).toContainText('A calmer publishing desk')
  await page.getByTestId('export-substack').click()
})
