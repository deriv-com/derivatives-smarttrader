import { useEffect } from 'react';

/**
 * Hook that handles clicks outside of the passed ref element
 * @param {React.RefObject} ref - Reference to the element to monitor for outside clicks
 * @param {Function} callback - Callback function to execute when a click outside occurs
 * @param {boolean} [isActive=true] - Whether to actively listen for outside clicks
 */
const useOutsideClick = (ref, callback, isActive = true) => {
    useEffect(() => {
        if (!isActive) return () => {}; // Return empty cleanup function when not active

        const handleClickOutside = (event) => {
            // If the ref or ref.current is null, or if the element contains the clicked target, do nothing
            if (!ref || !ref.current || ref.current.contains(event.target)) return;

            // Otherwise, execute the callback
            callback(event);
        };

        // Attach the event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Clean up the event listener on unmount or when dependencies change
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback, isActive]); // Re-run effect if any of these dependencies change
};

export default useOutsideClick;
