import { expect, test } from '@playwright/test'
import { resolve } from 'node:path'

test('imported source with a javascript: canonical link never renders a clickable javascript: href', async ({
  page,
}) => {
  await page.goto('/')

  await page
    .getByTestId('source-file-input')
    .setInputFiles(resolve('test/fixtures/security/canonical-link-javascript-scheme.html'))

  await expect(page.getByTestId('file-import-results')).toContainText(
    'canonical-link-javascript-scheme.html',
  )
  await expect(page.getByText('Malicious Canonical Link Regression Fixture').first()).toBeVisible()

  // The source's title/summary are still shown as plain text - only the
  // clickable <a href> for the unsafe canonical URL must be suppressed.
  await expect(page.locator('a[href^="javascript:" i]')).toHaveCount(0)
})
