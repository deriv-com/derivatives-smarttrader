# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
SmartTrader is a web-based trading application for binary options and derivatives trading. Built with React 18.3.1, jQuery 3.5.1, and a custom WebSocket architecture for real-time market data.

**Key Architecture**: Single-page application using IIFE module pattern, WebSocket-based real-time data, dual chart system (Highstock + WebtraderChart), and comprehensive caching layer.

## Common Commands

### Development
- `npm run start` - Start development server with hot reload (https://localhost)
- `npm run serve` - Watch files and rebuild on changes
- `npm run livereload` - Start live reload server
- `npm test` - Run Mocha test suite with Chai assertions
- `npm run eslint` - Auto-fix ESLint issues

### Build Tasks (Grunt)
- `grunt start` - Development server
- `grunt serve` - File watching
- `grunt test` - Run tests
- `grunt eslint` - Linting
- `grunt sass` - Compile SCSS
- `grunt webpack` - Bundle JavaScript
- `grunt dev` - Deploy to gh-pages (js/css and templates)
- `grunt deploy` - Deploy only js/css changes
- `grunt shell:compile_dev` - Recompile templates

### Translations
- `./scripts/update_translations.sh` - Update translations from Crowdin
- `scripts/extract_js_texts.js` - Extract translatable strings from JavaScript
- Strings must use `localize('text')` function
- Use `/* localize-ignore */` comment to skip extraction for specific strings

### Git & Deployment
- **Main branch**: `master` (not main)
- Release tags: `production_vYYYYMMDD_X` or `staging_vYYYYMMDD_X`
- Example: `git tag production_v20250112_0 -m 'Release message'`
- PRs: Create from feature branch to master, GitHub Actions auto-deploy test links
- Test deployment on Vercel: Push/create PR → get test link → register app at api.deriv.com/dashboard

## Core Files & Architecture

### Essential References
- [src/javascript/app/base/binary_loader.js](src/javascript/app/base/binary_loader.js) - Application lifecycle orchestrator, page initialization, SPA navigation
- [src/javascript/_common/base/socket_base.js](src/javascript/_common/base/socket_base.js) - WebSocket connection management with auto-reconnection, request buffering
- [src/javascript/app/base/socket.js](src/javascript/app/base/socket.js) - Application-specific WebSocket wrapper (BinarySocket)
- [src/javascript/_common/base/socket_cache.js](src/javascript/_common/base/socket_cache.js) - API response caching layer
- [src/javascript/app/pages/trade/get_ticks.js](src/javascript/app/pages/trade/get_ticks.js) - Market data request handler for real-time ticks
- [src/javascript/app/base/binary_pages.js](src/javascript/app/base/binary_pages.js) - SPA routing configuration

### Key Modules (IIFE Pattern)
- **BinaryLoader**: App initialization, page lifecycle, handles SPA navigation
- **BinarySocket**: WebSocket wrapper with auto-reconnection, request buffering, promise-based API
- **SocketCache**: Response caching with configurable expiry (10min for symbols, 60min for exchange rates)
- **GetTicks**: Real-time tick data processing and chart updates
- **Highchart** (Highstock): Contract analysis charts with barriers and zones
- **WebtraderChart**: Independent trading charts via @deriv-com/webtrader-charts

### Directory Structure
```
src/
├── javascript/
│   ├── _common/          # Shared utilities, base classes
│   │   └── base/         # Socket, cache, client, currency base classes
│   ├── app/
│   │   ├── base/         # Core app infrastructure (loader, pages, socket)
│   │   └── pages/        # Page-specific modules (trade, user, etc.)
│   ├── config.js         # API endpoints, app configuration
│   └── index.js          # Application entry point
├── sass/                 # SCSS stylesheets
├── templates/            # JSX templates
└── root_files/          # Static assets for root
```

## Code Style Guidelines

### JavaScript Patterns
- **IIFE Module Pattern**: All modules use `const ModuleName = (() => { /* private vars/methods */ return { /* public API */ }; })();`
- **ES Modules**: Use `import/export` syntax, not CommonJS `require()`
- **Destructuring**: Destructure imports when possible: `import { foo } from 'bar'`
- **jQuery Integration**: jQuery available globally as `$` for legacy compatibility (jQuery 3.5.1)
- **Promise-based**: Use promises for async operations, avoid callbacks where possible

### React Components
- **React 18.3.1**: Functional components with hooks preferred, class components for legacy
- **JSX Files**: Use `.jsx` extension for React components
- **Props Validation**: Use PropTypes for component props
- **HTML Parsing**: Use `html-react-parser` for HTML to React conversion
- **4-space indentation** for JSX (enforced by ESLint)

### WebSocket Patterns
- **Request Deduplication**: Automatic for `authorize`, `get_settings`, `residence_list`, etc.
- **Subscription Management**: Always `forget_all` before new subscriptions
- **Error Handling**: Implement reconnection logic and request buffering
- **Caching**: Use SocketCache for API responses with appropriate expiry times

### ESLint Configuration
- Extends `airbnb-base` and `binary` configs
- React plugin enabled
- Key rules: semicolons required, 1tbs brace style, no-console error
- Single quotes for JSX attributes (jsx-quotes: prefer-single)
- Auto-fix: `npm run eslint`

## Testing

### Running Tests
- `npm test` - Run full test suite
- Tests use **Mocha + Chai + Enzyme + Sinon + JSDOM**
- Test files: `__tests__/*.js` or `*.test.js`
- Mock utilities available via `mock-require`
- Browser globals (localStorage, sessionStorage) mocked via `mock-local-storage` and `jsdom-global`

### What to Verify
- WebSocket connection and reconnection
- Chart rendering and real-time updates
- Authentication flows
- Localization and language switching
- Cross-browser compatibility (last 2 versions, iOS Safari, last 3 Safari versions)

## Development Workflow

### Environment Setup
- **Node.js 18.x or higher** (recommended: 18.16.0)
- Ruby and Sass (`gem install sass`)
- Grunt CLI (`npm install -g grunt-cli`)
- Browser storage must be enabled (localStorage + sessionStorage)
- Install dependencies: `npm ci` (not `npm install`)

### Pre-commit Hooks (Husky)
The repository uses Husky for git hooks. Hooks automatically run before commits to enforce code quality.

### GitHub Actions Workflows
- `.github/workflows/release_production.yml` - Production releases
- `.github/workflows/release_staging.yml` - Staging releases
- `.github/workflows/test.yml` - Test on PR/push
- `.github/workflows/sync-translations.yml` - Crowdin sync
- `.github/workflows/claude.yml` - Claude Code integration

### Development Process
1. Create feature branch from **master** (not main)
2. Make changes and test locally with `npm run start`
3. Run linting: `npm run eslint`
4. Run tests: `npm test`
5. Commit (pre-commit hooks will run automatically)
6. Push and create PR to master
7. GitHub Actions will auto-deploy test link on Vercel

## WebSocket & Real-time Data

### Connection Management
```javascript
// Initialize WebSocket with auto-reconnection
BinarySocket.init({
    onOpen: callback,
    onMessage: callback,
    onDisconnect: callback
});

// Send requests with promise handling
BinarySocket.send({
    ticks_history: 'frxEURUSD',
    style: 'ticks',
    end: 'latest',
    count: 20,
    subscribe: 1
}).then(response => { /* handle response */ });
```

### Subscription Patterns
- Always call `BinarySocket.send({ forget_all: ['ticks', 'candles'] })` before new subscriptions
- Use `GetTicks.request()` for market data subscriptions
- Handle both `tick` and `history` message types
- Implement proper cleanup in component `onUnload` methods

### Caching Strategy (SocketCache)
- **10min cache**: `active_symbols`, `contracts_for`, `payout_currencies`
- **60min cache**: `exchange_rates`
- **State-only** (no expiry): `authorize`, `website_status`
- Cache keys include language, product_type, currency for specificity

## Chart Components

### Highstock/Highchart (Contract Analysis)
- **Purpose**: Contract-specific visualization with entry/exit points
- **Data Source**: GetTicks → BinarySocket (main connection)
- **Features**: Barriers, zones, contract markers, granularity calculation
- **Usage**: Contract lifecycle visualization, tick-by-tick analysis
- **Library**: highstock-release 5.0.14

### WebtraderChart (Trading Interface)
- **Purpose**: General market analysis and trading
- **Data Source**: @deriv-com/webtrader-charts (independent WebSocket)
- **Features**: Multiple timeframes, chart types, indicators
- **Usage**: Market analysis, technical indicators, drawing tools
- **Library**: @deriv-com/webtrader-charts ^0.6.5

### Chart Selection Logic
- Use **Highchart/Highstock** for contract-specific analysis
- Use **WebtraderChart** for general trading and market analysis
- Both can run simultaneously with separate WebSocket connections

## Common Tasks

### Adding a New Page
1. Create module in `src/javascript/app/pages/[page-name]/`
2. Add route in [src/javascript/app/base/binary_pages.js](src/javascript/app/base/binary_pages.js)
3. Create template in `src/templates/app/[page-name].jsx`
4. Add styles in `src/sass/app/[page-name].scss`
5. Test navigation and functionality

### Adding Translations
1. Use `localize('Your text here')` in code
2. Run `scripts/extract_js_texts.js` to extract strings
3. Run `./scripts/update_translations.sh` to push to Crowdin
4. Download translations from Crowdin (part of script)
5. Compile with `grunt shell:compile_dev`
6. Test language switching

**Important**: Refactor code so `localize()` receives string literals, not variables. If string literal not possible, add to `scripts/js_texts/static_strings_app.js`.

### WebSocket Integration
1. Use `BinarySocket.send()` for API calls
2. Implement proper error handling and reconnection
3. Use `BinarySocket.wait()` for waiting on specific responses
4. Clean up subscriptions in component lifecycle methods

### Chart Integration
1. For contract analysis: Use `Highchart.showChart(contract)`
2. For trading charts: Use `WebtraderChart.showChart()`
3. Handle chart cleanup: `chart.destroy()` in component unmount
4. Implement responsive chart resizing

### Template Changes
- To recompile all templates: `grunt shell:compile_dev`
- To recompile specific template: `grunt shell:compile_dev --path=about-us`
- Templates are JSX files in `src/templates/`

## Important Warnings & Requirements

### Critical Requirements
- **Node.js 18.x or higher** - Specified in package.json engines
- **Browser Storage Required** - App checks localStorage/sessionStorage support at startup
- **HTTPS Only** - Development server runs on https://localhost
- **jQuery Global** - Available as `$` globally, don't import separately
- **Master branch** - Main branch is "master", not "main"

### Performance Considerations
- **Request Deduplication**: Automatic for common API calls via SocketCache
- **Lazy Loading**: WebtraderChart uses `require.ensure()` for code splitting
- **Memory Management**: Always cleanup charts, subscriptions, and event listeners
- **Cache Strategy**: Leverage SocketCache for frequently accessed data

### Common Pitfalls
- **Dual WebSocket Connections**: Main app + WebtraderChart have separate connections
- **Language Redirects**: Unsupported languages redirect to `/en/` automatically
- **Storage Validation**: App disables login if storage unavailable
- **Chart Granularity**: Automatically calculated based on contract duration
- **Subscription Cleanup**: Must `forget_all` before new subscriptions
- **React Version**: Now on React 18.3.1, not 16.14.0
- **Branch Name**: Use "master", not "main"

### Error Handling Patterns
- **WebSocket Errors**: Implement auto-reconnection with request buffering
- **Cache Errors**: Clear cache and reload page on corruption
- **Authentication Errors**: Redirect to login or show appropriate messages
- **Chart Errors**: Graceful fallback and error display

## Key Dependencies
- React 18.3.1 (upgraded from 16.x)
- jQuery 3.5.1
- Grunt (build system)
- @deriv-com/webtrader-charts ^0.6.5
- highstock-release 5.0.14
- Mocha + Chai + Enzyme + Sinon (testing)
- @deriv-com/analytics, @deriv-com/auth-client, @deriv-com/translations

---

**Last Updated**: January 2025
