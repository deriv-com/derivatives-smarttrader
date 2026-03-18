import React from 'react';
import PropTypes from 'prop-types';
import { ActionSheet, Modal, Text } from '@deriv-com/quill-ui';
import { isMobile } from '../../../javascript/_common/os_detect';
import {
    renderReactComponent,
    unmountReactComponent,
} from '../../../javascript/_common/react_root_manager';

const CompleteProfileModal = ({
    onClose,
    onComplete,
    title,
    message,
    buttonText,
}) => {
    const is_mobile = isMobile();

    const handleComplete = () => {
        onClose();
        if (onComplete) onComplete();
    };

    // Mobile Action Sheet
    if (is_mobile) {
        return (
            <ActionSheet.Root
                isOpen={true}
                onClose={onClose}
                expandable={false}
                position='left'
            >
                <ActionSheet.Portal showHandlebar shouldCloseOnDrag>
                    <ActionSheet.Content>
                        <Text size='lg' bold>
                            {title}
                        </Text>
                        <div style={{ marginTop: '16px' }}>
                            <Text size='sm'>{message}</Text>
                        </div>
                    </ActionSheet.Content>
                    <ActionSheet.Footer
                        alignment='vertical'
                        primaryButtonColor='coral'
                        primaryAction={{
                            content : buttonText,
                            onAction: handleComplete,
                        }}
                    />
                </ActionSheet.Portal>
            </ActionSheet.Root>
        );
    }

    // Desktop Modal
    return (
        <Modal
            isOpened={true}
            toggleModal={onClose}
            showCrossIcon={true}
            buttonColor='coral'
            primaryButtonCallback={handleComplete}
            primaryButtonLabel={buttonText}
            shouldCloseOnPrimaryButtonClick
            width='sm'
            portalId='complete_profile_modal_container'
        >
            <Modal.Header title={title} />
            <Modal.Body>
                <Text size='sm'>{message}</Text>
            </Modal.Body>
        </Modal>
    );
};

CompleteProfileModal.propTypes = {
    buttonText: PropTypes.string.isRequired,
    message   : PropTypes.string.isRequired,
    onClose   : PropTypes.func.isRequired,
    onComplete: PropTypes.func.isRequired,
    title     : PropTypes.string.isRequired,
};

const CompleteProfileModalModule = (() => {
    let container = null;

    const init = (props) => {
    // Clean up any existing modal first
        if (container) {
            remove();
        }

        container = document.createElement('div');
        container.id = 'complete_profile_modal_container';
        container.className = 'complete_profile_modal_container';
        document.body.appendChild(container);

        renderReactComponent(<CompleteProfileModal {...props} />, container);
    };

    const remove = () => {
        if (container) {
            unmountReactComponent(container);
            container.remove();
            container = null;
        }
    };

    return {
        init,
        remove,
    };
})();

export default CompleteProfileModalModule;
