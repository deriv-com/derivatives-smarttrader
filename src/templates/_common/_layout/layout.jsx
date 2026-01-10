import React from 'react';
import { LabelPairedGlobeSmRegularIcon } from '@deriv/quill-icons';
import Head from './head.jsx';
import { localize } from '@deriv-com/translations';
// import Elevio from '../includes/elevio.jsx';
import Gtm from '../includes/gtm.jsx';

const CONTENT_PLACEHOLDER = 'CONTENT_PLACEHOLDER';

const WithLayout = ({ children }) => {
    const content_class = `${it.current_route || ''}-content`;
    return (
        <div id='content' className={it.current_route ? content_class : undefined}>
            <div id='page_info' style={{ display: 'none' }}>
                <div id='content_class'>{content_class}</div>
            </div>
            {it.layout !== 'full_width' ? (
                <div className='container'>{children}</div>
            ) : (
                children
            )}
        </div>
    );
};

const InnerContent = () =>
    it.layout ? (
        <WithLayout> {CONTENT_PLACEHOLDER} </WithLayout>
    ) : (
        CONTENT_PLACEHOLDER
    );

const Topbar = () => (
    <div className='no-print primary-bg-color-dark topbar mobile-hide'>
        <div id='topbar-info'>
            <div
                id='network_status_wrapper'
                className='no-underline'
                data-balloon-pos='up'
            >
                <div className='network_status' />
            </div>
            <div id='language-select'>
                <LabelPairedGlobeSmRegularIcon />
                <span id='language-select__text' />
            </div>
            <span className='no-underline nowrap gmt-clock' data-balloon-pos='up' />
            {/* <div id='topbar-whatsapp'>
                <img src={it.url_for('images/pages/footer/ic-whatsapp.svg')} />
            </div>
            <div id='deriv_livechat' />
            <div id='topbar-help-centre'>
                <img src={it.url_for('images/pages/footer/ic-help-centre.svg')} />
            </div> */}
            <div
                id='topbar-logout'
                className='logout no-underline'
                data-balloon-pos='up'
                data-balloon={localize('Log out')}
                style={{ display: 'none' }} // Initially hidden, will be shown via JS when logged in
            >
                <img src={it.url_for('images/pages/header/ic-logout.svg')} />
            </div>
            <div id='topbar-fullscreen'>
                <img src={it.url_for('images/pages/footer/ic-fullscreen.svg')} />
            </div>
        </div>
    </div>
);

const Layout = () => {
    if (it.is_pjax_request) {
        return <InnerContent />;
    }

    return (
        <html className='light'>
            <Head />
            <body className={it.language}>
                <Gtm />
                <div id='msg_notification' className='notice-msg center-text' />
                <div id='page-wrapper'>
                    <div id='header-container' />
                    <div id='sso_loader_container' />
                    <div id='content-holder'>
                        {/* <MobileMenu /> */}
                        {/* <a id='scrollup' /> */}
                        <InnerContent />
                    </div>
                    <Topbar />
                </div>
                {/* <Elevio /> */}
            </body>
        </html>
    );
};

export default Layout;
