import React from 'react';
import { Button } from '@deriv-com/quill-ui';
import { LabelPairedXmarkSmRegularIcon } from '@deriv/quill-icons';
import { localize } from '@deriv-com/translations';
import StepContent from './step_content';
import StepProgressBar from './step_progress_bar';
import { getMobileSteps, getDesktopSteps } from './steps_config';
import { isMobile } from '../../../_common/os_detect';
import {
    renderReactComponent,
    unmountReactComponent,
} from '../../../_common/react_root_manager';

const MigrationOnboarding = () => {
    const is_mobile = isMobile();
    const [current_step, setCurrentStep] = React.useState(0);
    const [is_open, setIsOpen] = React.useState(false);
    const [guide_completed, setGuideCompleted] = React.useState(
        () => localStorage.getItem('migration_onboarding_completed') === 'true'
    );
    const guide_timeout_ref = React.useRef(null);

    const steps = React.useMemo(
        () => (is_mobile ? getMobileSteps() : getDesktopSteps()),
        [is_mobile]
    );
    const total_steps = steps.length;
    const is_last_step = current_step === total_steps - 1;
    const is_first_step = current_step === 0;

    const onComplete = React.useCallback(() => {
        localStorage.setItem('migration_onboarding_completed', 'true');
        setGuideCompleted(true);
        setIsOpen(false);
    }, []);

    const onNext = () => {
        if (is_last_step) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const onBack = () => {
        if (!is_first_step) {
            setCurrentStep(prev => prev - 1);
        }
    };

    React.useEffect(() => {
        if (!guide_completed) {
            guide_timeout_ref.current = setTimeout(() => setIsOpen(true), 800);
        }
        return () => clearTimeout(guide_timeout_ref.current);
    }, [guide_completed]);

    if (!is_open) return null;

    const footer_class = `migration-onboarding__footer${is_first_step ? ' migration-onboarding__footer--single' : ''}`;

    return (
        <div className='migration-onboarding__overlay'>
            <div className='migration-onboarding__modal'>
                <div className='migration-onboarding__close-wrapper'>
                    <div
                        className='migration-onboarding__close'
                        onClick={onComplete}
                        role='button'
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && onComplete()}
                    >
                        <LabelPairedXmarkSmRegularIcon
                            fill='var(--component-textIcon-normal-prominent)'
                        />
                    </div>
                </div>
                <div className='migration-onboarding__header'>
                    <StepProgressBar total_steps={total_steps} current_step={current_step} />
                </div>
                <StepContent step={steps[current_step]} />
                <div className={footer_class}>
                    {!is_first_step && (
                        <Button
                            onClick={onBack}
                            className='migration-onboarding__back-button'
                            color='black-white'
                            variant='secondary'
                            size='lg'
                            label={localize('Back')}
                        />
                    )}
                    <Button
                        onClick={onNext}
                        className='migration-onboarding__next-button'
                        color='coral'
                        size='lg'
                        label={is_last_step ? localize('Got it') : localize('Next')}
                    />
                </div>
            </div>
        </div>
    );
};

const MemoizedMigrationOnboarding = React.memo(MigrationOnboarding);

const MigrationOnboardingModule = (() => {
    let container = null;

    const init = () => {
        if (container) remove();

        container = document.createElement('div');
        container.id = 'migration_onboarding_container';
        document.body.appendChild(container);

        renderReactComponent(<MemoizedMigrationOnboarding />, container);
    };

    const remove = () => {
        if (container) {
            unmountReactComponent(container);
            container.remove();
            container = null;
        }
    };

    return { init, remove };
})();

export default MigrationOnboardingModule;
