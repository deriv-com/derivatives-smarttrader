import React from 'react';

const MobileMenu = () => (
    <div id='mobile__container' className='mobile__container mobile-show'>
        <div id='mobile__menu' className='mobile__menu'>
            <div className='mobile__menu-header'>
                <img id='mobile__menu-close' className='btn__close' />
                <div className='mobile__menu-header-wrapper'>
                    <div className='mobile__menu-header-text'>{it.L('Menu')}</div>
                    {/* Temporarily hiding mobile language switcher */}
                    {/* <div id='mobile__menu-language-selector' className='mobile__menu-language-selector'>
                        <img id='mobile__menu-language-flag' className='mobile__menu-language-flag' src='../images/languages/ic-flag-uk.svg' alt='English' />
                        <span id='mobile__menu-language-text' className='mobile__menu-language-text'>EN</span>
                    </div> */}
                </div>
            </div>
            <div id='mobile_menu-content' className='mobile__menu-content mobile__menu-content--active'>
                <div className='mobile__platform-switcher-lists'>
                    <div className='mobile__platform-switcher-item'>
                        <img id='mobile__platform-switcher-icon-trade' className='mobile__platform-switcher-icon' />
                        <div className='mobile__platform-switcher-text mobile__platform-switcher-text-bold'>{it.L('Trade')}</div>
                    </div>
                    <div id='mobile__platform-switcher-item-reports' className='mobile__platform-switcher-item client_logged_in invisible'>
                        <img className='mobile__platform-switcher-icon reports-icon' />
                        <div className='mobile__platform-switcher-text'>{it.L('Reports')}</div>
                        <img id='mobile__platform-switcher-icon-arrowright' className='mobile__platform-switcher-icon-right' />
                    </div>
                    <div className='mobile__platform-switcher-item client_logged_in invisible logout'>
                        <img className='mobile__platform-switcher-icon logout-icon' />
                        <div className='mobile__platform-switcher-text'>{it.L('Log out')}</div>
                    </div>
                </div>
            </div>
            <div id='mobile__menu-content-submenu' className='mobile__menu-content-submenu mobile__menu-content client_logged_in invisible'>
                <div id='mobile__menu-content-submenu-header' className='mobile__menu-content-submenu-header mobile__platform-switcher-item'>
                    <img id='mobile__menu-content-submenu-icon-back' className='mobile__menu-content-submenu-icon' />
                    <div className='mobile__menu-content-submenu-header-text' >{it.L('Reports')}</div>
                </div>
                <div className='mobile__menu-content-submenu-lists'>
                    <a className='url-reports-positions mobile__menu-content-submenu-item mobile__platform-switcher-item'>
                        <img id='mobile__menu-content-submenu-icon-open' className='mobile__menu-content-submenu-icon' />
                        <div className='mobile__menu-content-submenu-item-text'>{it.L('Open positions')}</div>
                    </a>
                    <a className='url-reports-profit mobile__menu-content-submenu-item mobile__platform-switcher-item'>
                        <img id='mobile__menu-content-submenu-icon-profit' className='mobile__menu-content-submenu-icon' />
                        <div className='mobile__menu-content-submenu-item-text'>{it.L('Profit table')}</div>
                    </a>
                    <a className='url-reports-statement mobile__menu-content-submenu-item mobile__platform-switcher-item'>
                        <img id='mobile__menu-content-submenu-icon-statement' className='mobile__menu-content-submenu-icon' />
                        <div className='mobile__menu-content-submenu-item-text'>{it.L('Statements')}</div>
                    </a>
                </div>
            </div>

            <div id='mobile__menu-content-submenu-language' className='mobile__menu-content-submenu mobile__menu-content-submenu-language'>
                <div id='mobile__menu-content-submenu-language-header' className='mobile__menu-content-submenu-header mobile__platform-switcher-item mobile__menu-content-submenu-language-header'>
                    <img id='mobile__menu-content-submenu-language-icon-back' className='mobile__menu-content-submenu-icon' />
                    <div className='mobile__menu-content-submenu-header-text'>{it.L('Select language')}</div>
                </div>
                <div className='mobile__menu-content-submenu-lists mobile__language-grid'>
                    <div className='mobile__language-item' data-language='EN'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-uk.svg' alt='English' />
                        <div className='mobile__language-text'>English</div>
                    </div>
                    <div className='mobile__language-item' data-language='DE'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-de.svg' alt='Deutsch' />
                        <div className='mobile__language-text'>Deutsch</div>
                    </div>
                    <div className='mobile__language-item' data-language='ES'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-es.svg' alt='Español' />
                        <div className='mobile__language-text'>Español</div>
                    </div>
                    <div className='mobile__language-item' data-language='FR'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-fr.svg' alt='Français' />
                        <div className='mobile__language-text'>Français</div>
                    </div>
                    <div className='mobile__language-item' data-language='IT'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-it.svg' alt='Italiano' />
                        <div className='mobile__language-text'>Italiano</div>
                    </div>
                    <div className='mobile__language-item' data-language='PL'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-pl.svg' alt='Polish' />
                        <div className='mobile__language-text'>Polish</div>
                    </div>
                    <div className='mobile__language-item' data-language='RU'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-ru.svg' alt='Русский' />
                        <div className='mobile__language-text'>Русский</div>
                    </div>
                    <div className='mobile__language-item' data-language='TH'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-th.svg' alt='ไทย' />
                        <div className='mobile__language-text'>ไทย</div>
                    </div>
                    <div className='mobile__language-item' data-language='VI'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-vi.svg' alt='Tiếng Việt' />
                        <div className='mobile__language-text'>Tiếng Việt</div>
                    </div>
                    <div className='mobile__language-item' data-language='ZH_CN'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-zh_cn.svg' alt='简体中文' />
                        <div className='mobile__language-text'>简体中文</div>
                    </div>
                    <div className='mobile__language-item' data-language='ZH_TW'>
                        <img className='mobile__language-flag' src='../images/languages/ic-flag-zh_tw.svg' alt='繁體中文' />
                        <div className='mobile__language-text'>繁體中文</div>
                    </div>
                </div>
            </div>
            <div className='mobile__menu-footer topbar'>
                <span className='no-underline nowrap gmt-clock' />
                <div className='no-underline'>
                    <div className='network_status' />
                </div>
            </div>
        </div>
    </div>
);

export default MobileMenu;
