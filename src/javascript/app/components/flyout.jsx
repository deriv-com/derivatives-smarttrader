import React from 'react';
import { LabelPairedXmarkSmRegularIcon } from '@deriv/quill-icons';

const Flyout = ({ is_open, onClose, title, header_content, footer_content, children, className }) => {
    const baseClass = 'dc-flyout';
    const classes = [
        baseClass,
        className,
        is_open ? `${baseClass}--open` : '',
    ].filter(Boolean).join(' ');

    const bodyClasses = [
        `${baseClass}__body`,
        footer_content ? `${baseClass}__body--with-footer` : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            role='dialog'
            aria-labelledby='flyout-title'
            aria-hidden={!is_open}
            aria-modal='true'
        >
            <div className={`${baseClass}__header`}>
                {header_content || (
                    <>
                        <span className={`${baseClass}__title`} id='flyout-title'>
                            {title}
                        </span>
                        <button
                            className={`${baseClass}__icon-close`}
                            onClick={onClose}
                            aria-label='Close flyout'
                            type='button'
                        >
                            <LabelPairedXmarkSmRegularIcon />
                        </button>
                    </>
                )}
            </div>
            <div className={bodyClasses}>
                {children}
            </div>
            {footer_content && <div className={`${baseClass}__footer`}>{footer_content}</div>}
        </div>
    );
};

export default Flyout;
