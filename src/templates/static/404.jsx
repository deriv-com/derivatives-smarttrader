import React from 'react';
import { localize } from '@deriv-com/translations';

const Page404 = () => (
    <div className='container static-page-layout static_full'>
        <div className='page_404 static-content'>
            <div className='gr-row'>
                <div className='gr-12'>
                    <h1>{localize('Oops... Page Not Available')}</h1>
                </div>
                <div className='gr-8 gr-12-m gr-12-p gr-6-t'>
                    <p>{localize('The page you requested could not be found. Either it no longer exists or the address is wrong. Please check for any typos.')}</p>
                    <p dangerouslySetInnerHTML={{ __html: localize('<a href="{{url}}">Return to trading page</a>', { url: it.url_for('trading') }) }} />
                </div>
                <div className='gr-4 gr-12-m gr-12-p gr-6-t'>
                    <div className='big-error-code'>404</div>
                </div>
            </div>
        </div>
    </div>
);

export default Page404;
