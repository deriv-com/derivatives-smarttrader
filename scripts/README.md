# Scripts

**In this documents**

- [Translations](#translations)
- [Updating the Sitemap](#updating-the-sitemap)

## Translations

Translations use [`@deriv-com/translations`](https://github.com/deriv-com/translations). The catalogues are keyed by crc32 of the English text and loaded at runtime from `https://translations.deriv.com/<R2_PROJECT_NAME>/<TRANSLATIONS_ENVIRONMENT>/translations/<lang>.json` (`src/javascript/_common/translation-init.js`); nothing is bundled.

New strings are translated with Makima by the [Sync translations](../.github/workflows/sync-translations.yml) workflow (the shared `extract_and_sync_translations_makima` action), on every push to `master`, every 12 hours, and on demand. It extracts every `localize('...')` string in `src`, reuses the translations already on the CDN, sends only the new ones to Makima, and uploads the catalogues for `staging` and `production`. A run only uploads when the environment variable `MAKIMA_LIVE` is `true`; otherwise it is a dry run that saves the catalogues as a workflow artifact. A new string shows in English until the next run has translated it.

Terms that must stay in English (contract names, brand names) are listed in [translations.protected-terms.json](../translations.protected-terms.json), taken from the localisation team's "Translation/Transliteration of certain words" sheet.

### Writing translatable strings

The extractor only collects string literals passed to `localize()`:

1. Refactor the code so that the first argument passed to `localize()` is a string literal.
   i.e.
   ```js
   const text = localize(is_started ? 'Sell at market' : 'Sell');
   ```
   would change to:
   ```js
   const text = is_started ? localize('Sell at market') : localize('Sell');
   ```
2. Use `{{name}}` placeholders for values: `localize('Barrier is not an integer in range of {{param_1}} to {{param_2}}.', { param_1, param_2 })`.
3. When a string can't be a literal (e.g. a text that comes from the API), mark the call with `/* localize-ignore */` right after the first argument, so it's clear the string is intentionally not extracted.

## Updating the Sitemap

- The list of paths to include in `sitemap.xml` is here: [config/sitemap_urls.js](config/sitemap_urls.js)
- Once the paths are updated in the above file, run `./scripts/sitemap.js` or `grunt shell:sitemap` to generate new `sitemap.xml` files in `src/root_files` according to each section.
