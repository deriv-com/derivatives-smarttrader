import React from 'react';
import PropTypes from 'prop-types';

const StepContent = ({ step }) => (
    <div className='migration-onboarding__content'>
        <h2 className='migration-onboarding__title'>{step.title}</h2>
        <p className='migration-onboarding__description'>{step.description}</p>
        <div className='migration-onboarding__image-wrapper'>
            <img
                className='migration-onboarding__image'
                src={step.image}
                alt=''
            />
        </div>
    </div>
);

StepContent.propTypes = {
    step: PropTypes.shape({
        description: PropTypes.string.isRequired,
        image      : PropTypes.string,
        title      : PropTypes.string.isRequired,
    }).isRequired,
};

export default React.memo(StepContent);
