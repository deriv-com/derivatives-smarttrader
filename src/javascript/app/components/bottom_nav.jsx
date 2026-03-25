import React from 'react';
import {
    StandaloneHouseBlankRegularIcon,
    StandaloneChartAreaFillIcon,
    StandaloneChartAreaRegularIcon,
    StandaloneBarsRegularIcon,
} from '@deriv/quill-icons';
import { localize } from '@deriv-com/translations';
import { useApp } from '../contexts/AppContext';
import { getBrandHomeUrl } from '../../../templates/_common/brand.config';
import Language from '../../_common/language';

const BottomNavComponent = () => {
    const { activeTab, setActiveTab } = useApp();

    return (
        <div className='bottom-nav'>
            <a
                className='bottom-nav__item'
                href={`${getBrandHomeUrl()}?lang=${Language.get()}`}
            >
                <StandaloneHouseBlankRegularIcon iconSize='sm' />
                <span className='bottom-nav__label'>{localize('Home')}</span>
            </a>
            <div
                className={`bottom-nav__item${activeTab === 'trade' ? ' bottom-nav__item--active' : ''}`}
                onClick={() => setActiveTab('trade')}
            >
                {activeTab === 'trade'
                    ? <StandaloneChartAreaFillIcon iconSize='sm' />
                    : <StandaloneChartAreaRegularIcon iconSize='sm' />
                }
                <span className='bottom-nav__label'>{localize('Trade')}</span>
            </div>
            <div
                className={`bottom-nav__item${activeTab === 'menu' ? ' bottom-nav__item--active' : ''}`}
                onClick={() => setActiveTab('menu')}
            >
                <StandaloneBarsRegularIcon iconSize='sm' />
                <span className='bottom-nav__label'>{localize('Menu')}</span>
            </div>
        </div>
    );
};

export default BottomNavComponent;
