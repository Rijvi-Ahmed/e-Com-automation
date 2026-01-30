# HBK e-Commerce Automation

Playwright-based end-to-end test automation framework for HBK World e-commerce platform. This framework provides comprehensive testing capabilities for product specifications, sitemap validation, status code checking, search functionality, and e-commerce workflows.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Suites](#test-suites)
- [Page Objects](#page-objects)
- [Utilities](#utilities)

## Features

- **Product Specification Testing**: Compare API specifications with frontend (UI) specifications
- **All Model Comparison**: Validate product specifications against the "All Model" table data
- **Sitemap Validation**: Parse and validate sitemap URLs for accessibility
- **Status Code Checking**: Verify HTTP status codes for all pages in sitemaps
- **Product Search Testing**: Test faceted search with metric/imperial unit switching
- **E-commerce Workflows**: Test add-to-cart, save-for-later, and checkout flows
- **Configurable Products**: Test product configuration options
- **Multi-environment Support**: Run tests against dev, stage, or production environments

## Project Structure

```
HBK e-Com Automation/
├── env/                              # Environment configuration files
│   ├── .env.dev                      # Development environment
│   ├── .env.stage                    # Staging environment
│   └── .env.production               # Production environment
├── pages/                            # Page Object Models
│   ├── CookieCleanup.js              # Cookie management and cleanup
│   ├── HomePage.js                   # Home page interactions
│   ├── LoginPage.js                  # Login page interactions
│   ├── LoginSetup.js                 # Login setup utilities
│   └── Product.js                    # Product page interactions
├── tests/                            # Test specifications
│   ├── All-Model/                    # All Model table tests
│   │   ├── api_to_allmodel.spec.js   # Compare API specs to All Model table
│   │   └── sitemap_to_allmodel.spec.js
│   ├── E-com/                        # E-commerce workflow tests
│   │   ├── configurable_product.spec.js
│   │   └── Predefine_product.spec.js
│   ├── Search/                       # Search functionality tests
│   │   ├── Onsite-Search/
│   │   │   └── onsite_search.spec.js
│   │   └── Product-Search/
│   │       └── product_search.spec.js
│   ├── Specification/                # Product specification tests
│   │   ├── api_to_each_specification.spec.js
│   │   └── api_to_specification.spec.js
│   ├── Status-Code/                  # URL status code validation
│   │   ├── access_all_URLs.spec.js
│   │   ├── status_code_check.spec.js
│   │   └── status_code_check_specific_sitemap.spec.js
│   └── sitemap.spec.js               # Sitemap parsing tests
├── utilities/                        # Helper utilities
│   ├── ApiHelper.js                  # API interaction helper
│   └── SpecificationComparator.js    # Specification comparison logic
├── playwright.config.js              # Playwright configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## Prerequisites

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SBU-HTech/hbk-automation.git
   cd hbk-automation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Configuration

### Environment Variables

The project uses environment-specific `.env` files located in the `env/` folder:

| Variable | Description |
|----------|-------------|
| `URL` | Base URL of the application |
| `USERID` | User email for login |
| `PASSWORD` | User password for login |
| `AUTH_USERNAME` | HTTP Basic Auth username |
| `AUTH_PASSWORD` | HTTP Basic Auth password |
| `PRODUCT_NAME` | Default product code for testing |
| `API_BASE_URL` | API endpoint base URL |
| `API_QUERY_PARAMS` | API query parameters |
| `SITEMAPURL` | Sitemap index URL |
| `SITEMAPURLIND` | Individual sitemap URL |

### Playwright Configuration

The `playwright.config.js` file includes:
- **Browser**: Chromium (headless mode by default)
- **Timeout**: 180 seconds per test
- **Retries**: 2 retries on failure
- **Workers**: 1 (sequential execution)
- **Viewport**: 1536x738
- **Reporter**: HTML report

## Running Tests

### Using npm Scripts

```bash
# Product Search Tests
npm run test:product-search

# Status Code Check (all sitemaps)
npm run test:status-code

# URL Access Validation
npm run test:url-access

# Sitemap to All Model Comparison
npm run test:sitemap-to-allmodel-to-API

# Sitemap Parsing
npm run test:sitemap

# API to All Model Comparison
npm run test:Allmodel

# Status Code for Specific URLs
npm run test:status-code-defineURLs

# PDP Specification Tests
npm run test:PDP-specification

# PFP Specification Tests
npm run test:PFP-specification

# E-commerce Predefined Product Tests
npm run test:ecom-predefine
```

### Running with Different Environments

```bash
# Run against staging (default)
cross-env ENV=stage npx playwright test

# Run against development
cross-env ENV=dev npx playwright test

# Run against production
cross-env ENV=production npx playwright test
```

### Running Specific Tests

```bash
# Run a specific test file
npx playwright test tests/All-Model/api_to_allmodel.spec.js

# Run with debug mode
npx playwright test tests/All-Model/api_to_allmodel.spec.js --debug

# Run in headed mode (visible browser)
npx playwright test tests/Status-Code/status_code_check.spec.js --headed

# Run with UI mode
npx playwright test --ui
```

## Test Suites

### 1. All Model Tests (`tests/All-Model/`)

Tests that compare product specifications from the API with the "All Model" table on the frontend.

- **api_to_allmodel.spec.js**: Fetches specifications from API and compares with All Model table data for each product variant
- **sitemap_to_allmodel.spec.js**: Validates products from sitemap against All Model data

### 2. E-commerce Tests (`tests/E-com/`)

End-to-end e-commerce workflow tests.

- **Predefine_product.spec.js**: Tests for predefined sellable products including:
  - Login from header, All Model, and CTA panel
  - Add to cart from CTA and floating bar
  - Save/remove product for later
  - Price verification
  - Logout flows

- **configurable_product.spec.js**: Tests for configurable products with multiple options

### 3. Search Tests (`tests/Search/`)

Product search and filter functionality tests.

- **product_search.spec.js**: Tests faceted search with:
  - Metric/Imperial unit switching
  - Multiple facet filters
  - Result count validation

- **onsite_search.spec.js**: Onsite search functionality tests

### 4. Specification Tests (`tests/Specification/`)

Product specification comparison tests.

- **api_to_specification.spec.js**: Compares API specifications with frontend specification tables
- **api_to_each_specification.spec.js**: Individual product specification validation

### 5. Status Code Tests (`tests/Status-Code/`)

URL and sitemap validation tests.

- **status_code_check.spec.js**: Validates HTTP status codes for all URLs in sitemaps
- **access_all_URLs.spec.js**: Tests accessibility of all URLs
- **status_code_check_specific_sitemap.spec.js**: Tests specific sitemap URLs

## Page Objects

### Product.js

Main page object for product-related interactions:

- `gotoProductPage()` - Navigate to product page
- `acceptCookies()` - Handle cookie consent banner
- `clickAllModelTab()` - Switch to All Model tab
- `clickSpecificationTab()` - Switch to Specification tab
- `getProductCodes()` - Extract product codes from table
- `searchAndClickProduct(productCode)` - Find and click a product
- `getFrontendSpecifications()` - Extract specifications from UI
- `getAllModelSpecifications(productCode)` - Get All Model table data
- `addProductToCartCTA()` - Add product via CTA panel
- `saveProductForLaterCTA()` - Save product for later
- `adjustQuantity(quantity)` - Adjust product quantity

### LoginSetup.js

Login utility functions for different entry points:
- Login from header
- Login from All Model table
- Login from CTA panel

### CookieCleanup.js

Cookie and session management:
- Clear cookies
- Logout functionality
- Browser cleanup

## Utilities

### ApiHelper.js

API interaction helper for fetching product data:

- `getApiSpecifications(productId)` - Fetch all specifications from API
- `getApiSpecificationswithfirstclassification(productId)` - Fetch first classification specs
- `fetchWithRetry(apiUrl, retries)` - Retry mechanism for API calls

### SpecificationComparator.js

Comparison utilities for specifications:

- `compareSpecifications()` - Compare frontend and API specifications
- `logResults()` - Log match/mismatch results
- `compareSpecificationsAcrossProducts()` - Cross-product comparison

## Reports

After running tests, HTML reports are generated in the `playwright-report/` directory.

```bash
# View the report
npx playwright show-report
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure `AUTH_USERNAME` and `AUTH_PASSWORD` are correctly set in the environment file.

2. **Timeout Errors**: Increase timeout in `playwright.config.js` or specific test using `test.setTimeout()`.

3. **Element Not Found**: The page structure may have changed. Update the locators in the Page Objects.

4. **API Errors**: Verify `API_BASE_URL` and `API_QUERY_PARAMS` are correct.

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Run tests to ensure nothing is broken
4. Submit a pull request

## License

ISC
