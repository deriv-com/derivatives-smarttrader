/**
 * Development Keyboard Shortcuts
 *
 * Provides keyboard shortcuts for development environment switching
 * Similar to derivatives-bot functionality
 */

const { LocalStorageConstants, LocalStorageUtils } = require('@deriv-com/utils');

const DevShortcuts = (() => {
    let isInitialized = false;

    /**
     * Initialize development keyboard shortcuts
     */
    const init = () => {
        if (isInitialized) return;
        
        // Only enable in development environments
        if (!isDevelopmentEnvironment()) return;
        
        document.addEventListener('keydown', handleKeyDown);
        isInitialized = true;
        
        // eslint-disable-next-line no-console
        console.log('Development shortcuts enabled:');
        // eslint-disable-next-line no-console
        console.log('  Cmd/Ctrl + Shift + D: Switch to QA server (qa197.deriv.dev)');
    };

    /**
     * Handle keyboard shortcuts
     */
    const handleKeyDown = (event) => {
        // CMD+Shift+D or Ctrl+Shift+D to switch to QA server
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyD') {
            event.preventDefault();
            switchToQAServer();
        }
    };

    /**
     * Switch to QA server configuration
     */
    const switchToQAServer = () => {
        const qaServerUrl = 'qa197.deriv.dev';
        
        try {
            // Store QA server configuration (no app_id needed for token-based auth)
            LocalStorageUtils.setValue(LocalStorageConstants.configServerURL, qaServerUrl);
            
            // Also set traditional localStorage keys for compatibility
            localStorage.setItem('config.server_url', qaServerUrl);
            
            // Show confirmation
            showServerSwitchNotification(qaServerUrl);
            
            // Reload to apply changes
            setTimeout(() => {
                // eslint-disable-next-line no-console
                console.log('DevShortcuts: Reloading page after server switch');
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to switch to QA server:', error);
            showErrorNotification('Failed to switch server configuration');
        }
    };

    /**
     * Show server switch confirmation notification
     */
    const showServerSwitchNotification = (serverUrl) => {
        const notification = createNotification(
            `🔧 Switching to QA Server
            
Server: ${serverUrl}

Reloading in 1.5 seconds...`,
            'success'
        );
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    };

    /**
     * Show error notification
     */
    const showErrorNotification = (message) => {
        const notification = createNotification(`❌ ${message}`, 'error');
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    };

    /**
     * Create a notification element
     */
    const createNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            white-space: pre-line;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            line-height: 1.4;
        `;
        
        notification.textContent = message;
        return notification;
    };

    /**
     * Check if running in development environment
     */
    const isDevelopmentEnvironment = () => {
        const hostname = window.location.hostname;
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.includes('staging') ||
            hostname.includes('test') ||
            hostname.includes('dev') ||
            // Enable for any non-production domain for development purposes
            !hostname.includes('smarttrader.deriv.com')
        );
    };

    /**
     * Get current server configuration
     */
    const getCurrentServerConfig = () => ({
        serverUrl: LocalStorageUtils.getValue(LocalStorageConstants.configServerURL) ||
                       localStorage.getItem('config.server_url'),
        appId: LocalStorageUtils.getValue(LocalStorageConstants.configAppId) ||
                   localStorage.getItem('config.app_id'),
    });

    /**
     * Cleanup event listeners
     */
    const destroy = () => {
        if (isInitialized) {
            document.removeEventListener('keydown', handleKeyDown);
            isInitialized = false;
        }
    };

    return {
        init,
        destroy,
        switchToQAServer,
        getCurrentServerConfig,
        isDevelopmentEnvironment,
    };
})();

module.exports = DevShortcuts;
 
