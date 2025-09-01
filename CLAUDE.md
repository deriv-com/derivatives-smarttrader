# Deriv SmartTrader - Claude Development Guide

## Project Overview
SmartTrader is a web-based trading application for binary options and derivatives trading. Built with React 16.14.0, jQuery 3.5.1, and a custom WebSocket architecture for real-time market data.

**Key Architecture**: Single-page application using IIFE module pattern, WebSocket-based real-time data, dual chart system (Highchart + WebtraderChart), and comprehensive caching layer.

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

### Git & Deployment
- `git tag production_vYYYYMMDD_X -m 'Release message'` - Create release tag
- `gh pr create` - Create pull request (requires gh CLI)
- `gh issue view <number>` - View GitHub issue details

## Core Files & Architecture

### Essential References
- `guide-ai/smarttrader-architecture.md` - Complete architecture documentation with implementation details
- `guide-ai/live-market-data-architecture.md` - WebSocket and real-time data flow patterns
- `src/javascript/app/base/binary_loader.js` - Application lifecycle orchestrator
- `src/javascript/_common/base/socket_base.js` - WebSocket connection management
- `src/javascript/app/pages/trade/get_ticks.js` - Market data request handler

### Key Modules
- **BinaryLoader**: App initialization, page lifecycle, SPA navigation
- **BinarySocketBase**: WebSocket with auto-reconnection, request buffering, caching
- **GetTicks**: Real-time tick data processing and chart updates
- **Highchart**: Contract analysis charts with barriers and zones
- **WebtraderChart**: Independent trading charts via @deriv-com/webtrader-charts

## Code Style Guidelines

### JavaScript Patterns
- **IIFE Module Pattern**: All components use `const ComponentName = (() => { /* private vars/methods */ return { /* public API */ }; })();`
- **ES Modules**: Use `import/export` syntax, not CommonJS `require()`
- **Destructuring**: Destructure imports when possible: `import { foo } from 'bar'`
- **jQuery Integration**: jQuery available globally as `$` for legacy compatibility
- **Promise-based**: Use promises for async operations, avoid callbacks where possible

### React Components
- **React 16.14.0**: Class components and functional components with hooks
- **JSX Files**: Use `.jsx` extension for React components
- **Props Validation**: Use PropTypes for component props
- **HTML Parsing**: Use `html-react-parser` for HTML to React conversion

### WebSocket Patterns
- **Request Deduplication**: Automatic for `authorize`, `get_settings`, `residence_list`, etc.
- **Subscription Management**: Always `forget_all` before new subscriptions
- **Error Handling**: Implement reconnection logic and request buffering
- **Caching**: Use SocketCache for API responses with appropriate expiry times

## Testing Instructions

### Running Tests
- `npm test` - Run full test suite
- Tests use **Mocha + Chai + Enzyme + Sinon + JSDOM**
- Test files: `__tests__/*.js` or `*.test.js`
- Mock utilities available via `mock-require`

### What to Verify
- WebSocket connection and reconnection
- Chart rendering and real-time updates
- Authentication flows
- Localization and language switching
- Cross-browser compatibility (last 2 versions, iOS Safari)

## Development Workflow

### Environment Setup
- **Node.js 18.x EXACTLY** (critical requirement)
- Browser storage must be enabled (localStorage + sessionStorage)
- Install dependencies: `npm ci` (not `npm install`)

### Development Process
1. Create feature branch from main
2. Make changes and test locally with `npm run start`
3. Run linting: `npm run eslint`
4. Run tests: `npm test`
5. Create PR with descriptive commit messages

### Branch Strategy
- `main` - Production branch
- Feature branches: `feature/description`
- Release tags: `production_vYYYYMMDD_X`

## WebSocket & Real-time Data Patterns

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

### Caching Strategy
- **10min cache**: `active_symbols`, `contracts_for`, `payout_currencies`
- **60min cache**: `exchange_rates`
- **State-only**: `authorize`, `website_status`
- Cache keys include language, product_type, currency for specificity

## Chart Components

### Highchart (Contract Analysis)
- **Purpose**: Contract-specific visualization with entry/exit points
- **Data Source**: GetTicks → BinarySocket (main connection)
- **Features**: Barriers, zones, contract markers, granularity calculation
- **Usage**: Contract lifecycle visualization, tick-by-tick analysis

### WebtraderChart (Trading Interface)
- **Purpose**: General market analysis and trading
- **Data Source**: @deriv-com/webtrader-charts (independent WebSocket)
- **Features**: Multiple timeframes, chart types, indicators
- **Usage**: Market analysis, technical indicators, drawing tools

### Chart Selection Logic
- Use **Highchart** for contract-specific analysis
- Use **WebtraderChart** for general trading and market analysis
- Both can run simultaneously with separate WebSocket connections

## Common Tasks

### Adding a New Page
1. Create module in `src/javascript/app/pages/[page-name]/`
2. Add route in `src/javascript/app/base/binary_pages.js`
3. Create template in `src/templates/app/[page-name].jsx`
4. Add styles in `src/sass/app/[page-name].scss`
5. Test navigation and functionality

### Adding Translations
1. Use `localize('Your text here')` in code
2. Run `scripts/extract_js_texts.js` to extract strings
3. Update `.po` files in `src/translations/`
4. Compile with `grunt shell:compile_dev`
5. Test language switching

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

## Important Warnings & Requirements

### Critical Requirements
- **Node.js 18.x EXACTLY** - Other versions will cause build failures
- **Browser Storage Required** - App checks localStorage/sessionStorage support
- **HTTPS Only** - Development server runs on https://localhost
- **jQuery Global** - Available as `$` globally, don't import separately

### Performance Considerations
- **Request Deduplication**: Automatic for common API calls
- **Lazy Loading**: WebtraderChart uses `require.ensure()` for code splitting
- **Memory Management**: Always cleanup charts, subscriptions, and event listeners
- **Cache Strategy**: Leverage SocketCache for frequently accessed data

### Common Pitfalls
- **Dual WebSocket Connections**: Main app + WebtraderChart have separate connections
- **Language Redirects**: Unsupported languages redirect to `/en/` automatically
- **Storage Validation**: App disables login if storage unavailable
- **Chart Granularity**: Automatically calculated based on contract duration
- **Subscription Cleanup**: Must `forget_all` before new subscriptions

### Error Handling Patterns
- **WebSocket Errors**: Implement auto-reconnection with request buffering
- **Cache Errors**: Clear cache and reload page on corruption
- **Authentication Errors**: Redirect to login or show appropriate messages
- **Chart Errors**: Graceful fallback and error display

## Development Tips

### Debugging
- Use browser DevTools for client-side debugging
- Monitor WebSocket messages in Network tab
- Check console for real-time data flow
- Use React DevTools for component inspection

### Performance Optimization
- Use `BinarySocket.wait()` to avoid duplicate API calls
- Implement proper component lifecycle cleanup
- Leverage caching for frequently accessed data
- Use lazy loading for heavy components

### Testing Strategy
- Test WebSocket connection and reconnection scenarios
- Verify chart rendering with different data sets
- Test authentication flows and error states
- Validate localization and language switching

---

**Architecture Reference**: See `guide-ai/smarttrader-architecture.md` for complete technical details, implementation patterns, and API reference.

**Last Updated**: January 2025
