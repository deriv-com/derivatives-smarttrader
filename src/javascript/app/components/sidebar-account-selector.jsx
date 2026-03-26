import React from 'react';
import { StandaloneRightFromBracketRegularIcon } from '@deriv/quill-icons';
import { localize } from '@deriv-com/translations';
import Client from '../base/client';

const SidebarAccountSelector = ({ onClose }) => {
    const handleLogout = () => {
        if (onClose) onClose();
        Client.sendLogoutRequest();
    };

    return (
        <div className='flyout-selector'>
            <button
                className='flyout-selector__option'
                onClick={handleLogout}
                type='button'
            >
                <StandaloneRightFromBracketRegularIcon iconSize='sm' />
                <span>{localize('Log out')}</span>
            </button>
        </div>
    );
};

export default SidebarAccountSelector;
