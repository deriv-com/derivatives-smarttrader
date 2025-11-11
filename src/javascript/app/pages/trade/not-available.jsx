import React from 'react';
import { Text, Button } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import { getElementById } from '../../../_common/common_functions';
import { renderReactComponent } from '../../../_common/react_root_manager';
import dataManager from '../../common/data_manager.js';

const NotAvailable = ({ title, body }) => (
    <div className='not-available-container'>
        <section className='not-available-section'>
            <Text size='xl' bold centered color='not-available-section-text'>
                {title}
            </Text>
            <Text size='lg' centered color='not-available-section-text'>
                {body}
            </Text>
            <Button
                onClick={(e) => {
                    setTimeout(() => {
                        document.getElementById('acc_switcher').click();
                    }, 10);
                    e.preventDefault();
                }}
                size='lg'
                label={localize('Switch to another account')}
            />
        </section>
    </div>
);

export const init = ({ ...props }) => {
    dataManager.setContract({
        hide_page_loader: true,
    });
    renderReactComponent(<NotAvailable {...props} />, getElementById('content'));
};

export default init;
