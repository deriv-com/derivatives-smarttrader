/**
 * REST API utility module for fetching derivatives account data
 * A standalone implementation without React Query
 */
/* eslint-disable no-await-in-loop, no-continue */

/**
 * Creates a promise that resolves after the specified time
 * @param {number} ms - Time to sleep in milliseconds
 * @returns {Promise} Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise(resolve => {
    setTimeout(resolve, ms);
});

const { isProduction } = require('../config');
const { getApiCoreUrl } = require('../../templates/_common/brand.config');
const Client = require('../app/base/client');

/**
 * Generic fetch wrapper with default config and error handling
 *
 * @param {string} endpoint - API endpoint path (e.g., '/v1/derivatives/account')
 * @param {Object} options - Optional fetch options
 * @param {Object} retryConfig - Simple retry configuration (optional)
 * @param {number} retryConfig.maxRetries - Maximum number of retry attempts
 * @param {number} retryConfig.retryDelay - Delay between retries in milliseconds
 * @returns {Promise} Promise with response
 *
 * @example
 * const data = await fetchREST('/v1/endpoint');
 */
const fetchREST = async (endpoint, options, retryConfig = {}) => {
    const maxRetries = retryConfig.maxRetries || 0;
    const retryDelay = retryConfig.retryDelay || 1000;

    let attempts = 0;
    const maxAttempts = maxRetries + 1; // Initial attempt + retries

    while (attempts < maxAttempts) {
        try {
            // Use existing function to get the API Core URL
            const apiCoreUrl = getApiCoreUrl(isProduction());
            const url = `https://${apiCoreUrl}${endpoint}`;

            // Determine the method (default to GET if not specified)
            const method = options?.method || 'GET';

            // Only set Content-Type for methods that typically have a body
            const shouldSetContentType = ['POST', 'PUT', 'PATCH'].includes(method);

            const response = await fetch(url, {
                ...options,
                method,
                credentials: 'include', // Send cookies by default for authentication
                headers    : {
                    ...(shouldSetContentType && { 'Content-Type': 'application/json' }),
                    ...options?.headers,
                },
            });
            if (!response.ok) {
                // Try to parse error body for more detailed error information
                let errorBody;
                try {
                    errorBody = await response.json();
                } catch {
                    // If response body is not JSON, use generic error
                    errorBody = null;
                }

                // Extract error message from API response if available
                const errorMessage =
          errorBody?.errors?.[0]?.message ||
          `REST API Error: ${response.status} ${response.statusText}`;
                const errorCode = errorBody?.errors?.[0]?.code;

                // Create enhanced error with additional properties
                const error = new Error(errorMessage);

                error.status = response.status;
                error.statusText = response.statusText;
                error.code = errorCode;
                error.body = errorBody;
                error.isAuthError = response.status === 401 || response.status === 403;

                // Handle authentication errors automatically
                if (error.isAuthError) {
                    // eslint-disable-next-line no-console
                    console.error('Authentication error detected, logging out:', error);
                    // Don't await to prevent blocking other operations
                    // We just need to trigger the logout process
                    setTimeout(() => {
                        Client.sendLogoutRequest(false).catch((logoutError) => {
                            // eslint-disable-next-line no-console
                            console.error('Error during automatic logout:', logoutError);
                        });
                    }, 0);
                }

                // Don't retry auth errors or client errors (except 429 rate limit)
                const shouldRetry =
          attempts < maxRetries &&
          !error.isAuthError &&
          (error.status === 429 || error.status >= 500);
                if (shouldRetry) {
                    attempts++;
                    // Wait before retrying with exponential backoff
                    await sleep(retryDelay * attempts);
                    continue;
                }

                throw error;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // Handle network errors (DNS failures, timeouts) that bypass the response.ok check
            if (error instanceof TypeError && attempts < maxAttempts - 1) {
                // Network error - retry
                attempts++;
                await sleep(retryDelay * attempts);
                continue;
            }
            // If we've reached this point and still have an error, throw it
            throw error;
        }
    }

    // This point should never be reached as we either return data or throw an error,
    // but JavaScript needs an explicit return for all code paths
    throw new Error('Maximum retry attempts reached');
};

/**
 * Fetch derivatives account information
 *
 * @returns {Promise} Promise with derivatives account response containing:
 * - data: Array of account objects with account_id, balance, currency, status, etc.
 * - meta: Response metadata with endpoint, method, and timing information
 *
 * @example
 * try {
 *   const accountData = await fetchDerivativesAccount();
 * } catch (error) {
 *   console.error('Failed to fetch derivatives account:', error);
 *   // Check for specific error types
 *   if (error.isAuthError) {
 *     // Handle authentication errors
 *   }
 * }
 */
const fetchDerivativesAccount = () =>
// Use retry for server errors and rate limits, with exponential backoff
    fetchREST('/v1/derivatives/account', undefined, {
        maxRetries: 3,
        retryDelay: 1000,
    })
;

module.exports = {
    fetchREST,
    fetchDerivativesAccount,
};
