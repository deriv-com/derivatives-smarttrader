import React from 'react';
import PropTypes from 'prop-types';

const getImageSrc = (step, is_dark_mode_on) => {
    if (step.image) return step.image;
    return is_dark_mode_on ? step.image_dark : step.image_light;
};

const StepContent = ({ step, is_dark_mode_on }) => (
    <div className='migration-onboarding__content'>
        <h2 className='migration-onboarding__title'>{step.title}</h2>
        <p className='migration-onboarding__description'>{step.description}</p>
        <div className='migration-onboarding__image-wrapper'>
            <img
                className='migration-onboarding__image'
                src={getImageSrc(step, is_dark_mode_on)}
                alt=''
            />
        </div>
    </div>
);

StepContent.propTypes = {
    is_dark_mode_on: PropTypes.bool,
    step           : PropTypes.shape({
        description: PropTypes.string.isRequired,
        image      : PropTypes.string,
        image_dark : PropTypes.string,
        image_light: PropTypes.string,
        title      : PropTypes.string.isRequired,
    }).isRequired,
};

StepContent.defaultProps = {
    is_dark_mode_on: false,
};

export default React.memo(StepContent);
