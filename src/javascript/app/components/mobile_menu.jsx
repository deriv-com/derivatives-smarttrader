import React, { useState, useEffect } from "react";
import { LabelPairedGlobeSmRegularIcon } from "@deriv/quill-icons";
import { localize } from "@deriv-com/translations";
import Url from "../../_common/url";
import Client from "../base/client";
import Language from "../../_common/language";
import { useApp } from "../contexts/AppContext";
import {
  getPlatformHostname,
  getBrandHomeUrl,
} from "../../../templates/_common/brand.config";
import { getAccountType } from "../../config";

const BUILD_HASH = process.env.BUILD_HASH || "";

/**
 * MobileMenuHeader - Header section with close button and language selector
 */

const MobileMenuHeader = ({ onClose, onLanguageClick }) => {
  const currentLang = Language.get();
  const langCode = currentLang ? currentLang.toUpperCase() : "EN";

  return (
    <div className="mobile__menu-header">
      <img
        id="mobile__menu-close"
        className="btn__close"
        src={Url.urlForStatic(`images/pages/header/ic-close.svg?${BUILD_HASH}`)}
        alt="Close"
        onClick={onClose}
      />
      <div className="mobile__menu-header-wrapper">
        <div className="mobile__menu-header-text">{localize("Menu")}</div>
        <div
          id="mobile__menu-language-selector"
          className="mobile__menu-language-selector"
          onClick={onLanguageClick}
        >
          <LabelPairedGlobeSmRegularIcon />
          <span
            id="mobile__menu-language-text"
            className="mobile__menu-language-text"
          >
            {langCode}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * MobileMenuContent - Main menu content with trade, reports, and logout
 */
const MobileMenuContent = ({ onReportsClick, onLogoutClick, isVisible }) => {
  const { isLoggedIn } = useApp();

  return (
    <div
      id="mobile_menu-content"
      className={`mobile__menu-content ${
        isVisible ? "mobile__menu-content--active" : ""
      }`}
    >
      <div className="mobile__platform-switcher-lists">
        <a
          className="mobile__platform-switcher-item"
          href={`${getBrandHomeUrl()}?lang=${Language.get()}`}
        >
          <img
            id="mobile__platform-switcher-icon-home"
            className="mobile__platform-switcher-icon"
            src={Url.urlForStatic(
              `images/pages/header/deriv-com-logo.svg?${BUILD_HASH}`
            )}
            alt="Deriv Home"
          />
          <div className="mobile__platform-switcher-text">
            {localize("Home")}
          </div>
        </a>
        {isLoggedIn && (
          <>
            <div
              id="mobile__platform-switcher-item-reports"
              className="mobile__platform-switcher-item client_logged_in"
              onClick={onReportsClick}
            >
              <img
                className="mobile__platform-switcher-icon reports-icon"
                src={Url.urlForStatic(
                  `images/pages/header/ic-reports.svg?${BUILD_HASH}`
                )}
                alt=""
              />
              <div className="mobile__platform-switcher-text">
                {localize("Reports")}
              </div>
              <img
                id="mobile__platform-switcher-icon-arrowright"
                className="mobile__platform-switcher-icon-right"
                src={Url.urlForStatic(
                  `images/pages/header/ic-chevron-right.svg?${BUILD_HASH}`
                )}
                alt=""
              />
            </div>
            <div
              className="mobile__platform-switcher-item client_logged_in logout"
              onClick={onLogoutClick}
            >
              <img
                className="mobile__platform-switcher-icon logout-icon"
                src={Url.urlForStatic(
                  `images/pages/header/ic-logout.svg?${BUILD_HASH}`
                )}
                alt=""
              />
              <div className="mobile__platform-switcher-text">
                {localize("Log out")}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * ReportsSubmenu - Submenu for reports section
 */
const ReportsSubmenu = ({ onBack }) => {
  // Get URL parameters for Reports links (computed once, used 3 times)
  const account_type = getAccountType();
  const redirect_url = getPlatformHostname();

  return (
    <div
      id="mobile__menu-content-submenu"
      className="mobile__menu-content-submenu mobile__menu-content-submenu--active mobile__menu-content client_logged_in"
    >
      <div
        id="mobile__menu-content-submenu-header"
        className="mobile__menu-content-submenu-header mobile__platform-switcher-item"
        onClick={onBack}
      >
        <img
          id="mobile__menu-content-submenu-icon-back"
          className="mobile__menu-content-submenu-icon"
          src={Url.urlForStatic(
            `images/pages/header/ic-chevron-left.svg?${BUILD_HASH}`
          )}
          alt="Back"
        />
        <div className="mobile__menu-content-submenu-header-text">
          {localize("Reports")}
        </div>
      </div>
      <div className="mobile__menu-content-submenu-lists">
        <a
          className="url-reports-positions mobile__menu-content-submenu-item mobile__platform-switcher-item"
          href={Url.urlForReports(
            "reports/positions",
            redirect_url,
            account_type
          )}
        >
          <img
            id="mobile__menu-content-submenu-icon-open"
            className="mobile__menu-content-submenu-icon"
            src={Url.urlForStatic(
              `images/pages/header/ic-portfolio.svg?${BUILD_HASH}`
            )}
            alt=""
          />
          <div className="mobile__menu-content-submenu-item-text">
            {localize("Open positions")}
          </div>
        </a>
        <a
          className="url-reports-profit mobile__menu-content-submenu-item mobile__platform-switcher-item"
          href={Url.urlForReports("reports/profit", redirect_url, account_type)}
        >
          <img
            id="mobile__menu-content-submenu-icon-profit"
            className="mobile__menu-content-submenu-icon"
            src={Url.urlForStatic(
              `images/pages/header/ic-profit-table.svg?${BUILD_HASH}`
            )}
            alt=""
          />
          <div className="mobile__menu-content-submenu-item-text">
            {localize("Profit table")}
          </div>
        </a>
        <a
          className="url-reports-statement mobile__menu-content-submenu-item mobile__platform-switcher-item"
          href={Url.urlForReports(
            "reports/statement",
            redirect_url,
            account_type
          )}
        >
          <img
            id="mobile__menu-content-submenu-icon-statement"
            className="mobile__menu-content-submenu-icon"
            src={Url.urlForStatic(
              `images/pages/header/ic-statement.svg?${BUILD_HASH}`
            )}
            alt=""
          />
          <div className="mobile__menu-content-submenu-item-text">
            {localize("Statements")}
          </div>
        </a>
      </div>
    </div>
  );
};

/**
 * LanguageSubmenu - Submenu for language selection
 */
const LanguageSubmenu = ({
  onBack,
  onLanguageSelect,
  availableLanguages,
  currentLanguage,
}) => (
  <div
    id="mobile__menu-content-submenu-language"
    className="mobile__menu-content-submenu mobile__menu-content-submenu--active mobile__menu-content-submenu-language mobile__menu-content"
  >
    <div
      id="mobile__menu-content-submenu-language-header"
      className="mobile__menu-content-submenu-header mobile__platform-switcher-item mobile__menu-content-submenu-language-header"
      onClick={onBack}
    >
      <img
        id="mobile__menu-content-submenu-language-icon-back"
        className="mobile__menu-content-submenu-icon"
        src={Url.urlForStatic(
          `images/pages/header/ic-chevron-left.svg?${BUILD_HASH}`
        )}
        alt="Back"
      />
      <div className="mobile__menu-content-submenu-header-text">
        {localize("Select language")}
      </div>
    </div>
    <div className="mobile__menu-content-submenu-lists mobile__language-grid">
      {availableLanguages.map((lang) => (
        <div
          key={lang.code}
          className={`mobile__language-item${
            currentLanguage === lang.code
              ? " mobile__language-item--active"
              : ""
          }`}
          data-language={lang.code}
          onClick={() => onLanguageSelect(lang.code)}
        >
          <div className="mobile__language-text">{lang.name}</div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * MobileMenuComponent - Main mobile menu component with state management
 */
const MobileMenuComponent = () => {
  const {
    isMobileMenuOpen,
    closeMobileMenu,
    availableLanguages,
    handleLanguageChange,
    currentLanguage,
  } = useApp();
  const [activeSubmenu, setActiveSubmenu] = useState(null); // null, 'reports', or 'language'

  // Handle body scroll locking when menu opens/closes
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("stop-scrolling");
    } else {
      document.body.classList.remove("stop-scrolling");
      // Reset submenu when menu closes
      setActiveSubmenu(null);
    }

    return () => {
      document.body.classList.remove("stop-scrolling");
    };
  }, [isMobileMenuOpen]);

  const handleClose = () => {
    closeMobileMenu();
  };

  const handleReportsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSubmenu("reports");
  };

  const handleLanguageClick = () => {
    setActiveSubmenu("language");
  };

  const handleBack = () => {
    setActiveSubmenu(null);
  };

  const handleLogout = () => {
    handleClose();
    Client.sendLogoutRequest();
  };

  const handleLanguageSelect = async (langCode) => {
    // Use centralized language change from AppContext
    await handleLanguageChange(langCode);
  };

  return (
    <div
      id="mobile__container"
      className={`mobile__container mobile-show ${
        isMobileMenuOpen ? "mobile__container--active" : ""
      }`}
    >
      <div id="mobile__menu" className="mobile__menu">
        <MobileMenuHeader
          onClose={handleClose}
          onLanguageClick={handleLanguageClick}
        />

        <MobileMenuContent
          onReportsClick={handleReportsClick}
          onLogoutClick={handleLogout}
          isVisible={!activeSubmenu}
        />

        {activeSubmenu === "reports" && <ReportsSubmenu onBack={handleBack} />}

        {activeSubmenu === "language" && (
          <LanguageSubmenu
            onBack={handleBack}
            onLanguageSelect={handleLanguageSelect}
            availableLanguages={availableLanguages}
            currentLanguage={currentLanguage}
          />
        )}

        <div className="mobile__menu-footer topbar">
          <span className="no-underline nowrap gmt-clock" />
          <div className="no-underline">
            <div className="network_status" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenuComponent;
