import React, { useEffect } from 'react';
import { localize } from '@deriv-com/translations';
import { LegacyClose1pxIcon } from '@deriv/quill-icons/Legacy';

// Constant for localStorage key
export const TOOLTIP_SHOWN_KEY = 'account_switcher_tooltip_shown';

/**
 * AccountSwitcherTooltip - Displays a tooltip with spotlight on account switcher
 */
const AccountSwitcherTooltip = ({ onClose, isVisible }) => {
    // Prevent scrolling when overlay is active and add special class for topbar hiding
    useEffect(() => {
        if (isVisible) {
            // Disable scrolling on body
            document.body.style.overflow = 'hidden';

            // Add class to body for hiding the topbar
            document.body.classList.add('tooltip-active');

            // Cleanup function to re-enable scrolling when component unmounts or isVisible changes
            return () => {
                document.body.style.overflow = '';
                document.body.classList.remove('tooltip-active');
            };
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className='acc-tooltip__container'>
            <div className='acc-tooltip__overlay' onClick={onClose} />
            <div className='acc-tooltip__highlight' />
            <div className='acc-tooltip__content'>
                <h4>{localize('New update!')}</h4>
                <p>{localize('Switch between Real and Demo accounts instantly.')}</p>
                <button className='acc-tooltip__got-it-btn' onClick={onClose}>
                    {localize('Got it')}
                </button>
                <div className='acc-tooltip__pointer' />
                <div className='acc-tooltip__close' onClick={onClose}>
                    <LegacyClose1pxIcon iconSize='xs' fill='#ffffff' />
                </div>
            </div>
        </div>
    );
};

export default AccountSwitcherTooltip;
