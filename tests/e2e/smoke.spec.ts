import { expect, test } from '@playwright/test'
import { resolve } from 'node:path'
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

test('imports a real source file and restores it after reload', async ({ page }) => {
  await page.goto('/')

  await page
    .getByTestId('source-file-input')
    .setInputFiles(resolve('test/fixtures/realdata/09-article-html-pasted.html'))

  await expect(page.getByTestId('file-import-results')).toContainText('09-article-html-pasted.html')
  await expect(page.getByText('llm-gemini 0.31').first()).toBeVisible()
  await expect(page.getByText('Saved locally')).toBeVisible()

  await page.reload()
  await expect(page.getByText('llm-gemini 0.31').first()).toBeVisible()
})

test('downloads and re-imports project JSON state', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('idea-title').fill('Portable backup project')
  await page.getByTestId('generate-draft').click()
  await expect(page.getByTestId('draft-editor')).toContainText('Portable backup project')
  await expect(page.getByText('Saved locally')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Project JSON' }).click()
  const download = await downloadPromise
  const filePath = resolve('test-results/project-roundtrip.json')
  await download.saveAs(filePath)

  await page.getByRole('button', { name: 'Blank project' }).first().click()
  await expect(page.getByTestId('idea-title')).toHaveValue('')

  await page.getByTestId('source-file-input').setInputFiles(filePath)
  await expect(page.getByTestId('idea-title')).toHaveValue('Portable backup project')
})

test('loads a small project from a share URL', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByRole('button', { name: 'Blank project' }).first().click()
  await expect(page.getByTestId('idea-title')).toHaveValue('')
  await page.getByTestId('idea-title').fill('Shareable project')
  await expect(page.getByTestId('idea-title')).toHaveValue('Shareable project')
  await page.waitForTimeout(700)

  await page.getByRole('button', { name: 'Share URL' }).click()
  const shareUrl = await page.getByTestId('share-url-output').inputValue()
  expect(shareUrl).toContain('#project=')

  await page.goto(shareUrl)
  await expect(page.getByTestId('idea-title')).toHaveValue('Shareable project')
})
