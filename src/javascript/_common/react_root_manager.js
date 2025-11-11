import { createRoot } from 'react-dom/client';

/**
 * React Root Manager
 * Centralized utility for managing React 18 roots
 * Handles the migration from ReactDOM.render() to createRoot()
 */

const roots = new Map();

/**
 * Render a React component using React 18's createRoot API
 * @param {React.ReactElement} component - The React component to render
 * @param {HTMLElement} container - The DOM element to render into
 * @param {Function} callback - Optional callback to execute after render
 */
export const renderReactComponent = (component, container, callback) => {
    if (!container) {
        // eslint-disable-next-line no-console
        console.error('renderReactComponent: container is null or undefined');
        return;
    }

    try {
        // Check if we already have a root for this container
        let root = roots.get(container);

        if (!root) {
            // Create a new root for this container
            root = createRoot(container);
            roots.set(container, root);
        }

        // Render the component
        root.render(component);

        // Execute callback if provided
        if (callback && typeof callback === 'function') {
            // Use setTimeout to ensure callback runs after render
            setTimeout(callback, 0);
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error rendering React component:', error);
    }
};

/**
 * Unmount a React component and clean up its root
 * @param {HTMLElement} container - The DOM element containing the React component
 */
export const unmountReactComponent = (container) => {
    if (!container) {
        // eslint-disable-next-line no-console
        console.error('unmountReactComponent: container is null or undefined');
        return;
    }

    try {
        const root = roots.get(container);
        if (root) {
            root.unmount();
            roots.delete(container);
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error unmounting React component:', error);
    }
};

/**
 * Check if a container has an active React root
 * @param {HTMLElement} container - The DOM element to check
 * @returns {boolean} - True if the container has an active root
 */
export const hasReactRoot = (container) => roots.has(container);

/**
 * Clear all React roots (useful for cleanup in tests)
 */
export const clearAllRoots = () => {
    roots.forEach((root) => {
        try {
            root.unmount();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error unmounting root:', error);
        }
    });
    roots.clear();
};

export default {
    renderReactComponent,
    unmountReactComponent,
    hasReactRoot,
    clearAllRoots,
};
