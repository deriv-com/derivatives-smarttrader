import React from 'react';
import PropTypes from 'prop-types';

const StepProgressBar = ({ total_steps, current_step }) => (
    <div className='migration-onboarding__progress'>
        {Array.from({ length: total_steps }, (_, index) => (
            <div
                key={index}
                data-testid={`progress-segment-${index}`}
                className={`migration-onboarding__progress-segment${
                    index <= current_step ? ' migration-onboarding__progress-segment--active' : ''
                }`}
            />
        ))}
    </div>
);

StepProgressBar.propTypes = {
    current_step: PropTypes.number.isRequired,
    total_steps : PropTypes.number.isRequired,
};

export default React.memo(StepProgressBar);
