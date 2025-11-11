import React, { useEffect, useState } from 'react';
import parse from 'html-react-parser';
import { SectionMessage, Skeleton, Text } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import { contract_explanation_data } from './data/explanation.js';
import Language from '../../../_common/language';
import Url from '../../../_common/url';
import dataManager from '../../common/data_manager.js';
import { useContractChange } from '../../hooks/events.js';

export const Explanation = ({ explanation_only = false }) => {

    const [form_name, setFormName] = useState(null);

    const has_contract_changes = useContractChange();

    useEffect(() => {
        const actual_form_name = dataManager.getContract('explanation_form_name');
        setFormName(null);
        
        setTimeout(() => {
            // [AI] - Add validation to ensure we have valid form name and data
            if (
                actual_form_name &&
                contract_explanation_data &&
                contract_explanation_data.explain &&
                contract_explanation_data.explain[actual_form_name]
            ) {
                setFormName(actual_form_name);
            }
            // [/AI]
        }, 500);
       
    }, [has_contract_changes]);

    const language = Language.get().toLowerCase();
    
    // Languages with available explanation images
    const available_languages = ['de', 'en', 'es', 'fr', 'id', 'it', 'pl', 'pt', 'ru', 'th', 'vi', 'zh_cn', 'zh_tw'];
    
    // Use English as fallback if language images don't exist
    const image_lang = available_languages.includes(language) ? language : 'en';
    
    const image_path = Url.urlForStatic(
        `images/pages/trade-explanation/${image_lang}/`
    );
    const Notes = () => (
        <>
            <strong>{localize('Note')}: </strong>
            {contract_explanation_data.note[form_name]?.content?.map((data, idx) => (
                <span key={idx}>{parse(data)}</span>
            )) || <span>{localize('Note content not available')}</span>}
        </>
    );

    const images = {
        risefall: {
            image1: 'rises.svg',
            image2: 'falls.svg',
        },
        higherlower: {
            image1: 'higher.svg',
            image2: 'lower.svg',
        },
        touchnotouch: {
            image1: 'touch.svg',
            image2: 'no-touch.svg',
        },
        endsinout: {
            image1: 'ends-between.svg',
            image2: 'ends-outside.svg',
        },
        staysinout: {
            image1: 'stays-between.svg',
            image2: 'goes-outside.svg',
        },
        digits: {
            image1: 'matches.svg',
            image2: 'differs.svg',
        },
        evenodd: {
            image1: 'even.svg',
            image2: 'odd.svg',
        },
        overunder: {
            image1: 'over.svg',
            image2: 'under.svg',
        },
        // Removed lookback image mappings as lookback functionality has been removed
        reset: {
            image1: 'reset-call.svg',
            image2: 'reset-put.svg',
        },
        highlowticks: {
            image1: 'high-tick.svg',
            image2: 'low-tick.svg',
        },
        runs: {
            image1: 'only-ups.svg',
            image2: 'only-downs.svg',
        },
    };

    if (form_name) {
        return (
            <div className='tab-explanation'>
                {/* ========== Winning ========== */}
                {!explanation_only && (
                    <>
                        <div id='explanation_winning'>
                            <div id={`winning_${form_name}`}>
                                <div className='explanation-heading'>
                                    <Text size='lg' bold>{localize('Winning the contract')}</Text>
                                </div>
                                <div className='explanation-content'>
                                    {contract_explanation_data.winning[form_name]?.content?.map(
                                        (data, idx) => (
                                            <Text key={idx}>{parse(data)}</Text>
                                        )
                                    ) || <Text>{localize('Explanation content not available')}</Text>}
                                </div>
                                
                            </div>
                        </div>
                          
                        {/* ========== Image ========== */}
                        {images[form_name] && (
                            <div id='explanation_image'>
                                <div className='gr-row'>
                                    <div className='gr-2 hide-mobile' />
                                    <div
                                        className='gr-4 gr-12-m padding-right'
                                        style={{ margin: 'auto' }}
                                    >
                                        <img
                                            id='explanation_image_1'
                                            className='responsive'
                                            src={`${image_path}${images[form_name].image1}?${process.env.BUILD_HASH}`}
                                        />
                                    </div>
                                    {images[form_name].image2 && (
                                        <div className='gr-4 gr-12-m padding-left'>
                                            <img
                                                id='explanation_image_2'
                                                className='responsive'
                                                src={`${image_path}${images[form_name].image2}?${process.env.BUILD_HASH}`}
                                            />
                                        </div>
                                    )}
                                   
                                    <div className='gr-2 hide-mobile' />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ========== Explain ========== */}
                <div id='explanation_explain' className='gr-child'>
                    <div id={`explain_${form_name}`}  >
                        <div className='explanation-heading'>
                            <Text size='lg' bold >{contract_explanation_data.explain[form_name]?.title || 'Contract Explanation'}</Text>
                        </div>
                        <div className='explanation-content'>
                            {contract_explanation_data.explain[form_name]?.content?.map(
                                (data, idx) => (
                                    <Text key={idx}>{parse(data)}</Text>
                                )
                            ) || <Text>{localize('Explanation content not available')}</Text>}
                        </div>
                        
                        {contract_explanation_data.explain[form_name]?.title_secondary && (
                            <div className='explanation-heading secondary-heading'>
                                <Text size='lg' bold>
                                    {contract_explanation_data.explain[form_name]?.title_secondary}
                                </Text>
                            </div>
                        )}
                        
                        {contract_explanation_data.explain[form_name]?.content_secondary && (
                            <div className='explanation-content'>
                                {contract_explanation_data.explain[form_name]?.content_secondary?.map(
                                    (data, idx) => (
                                        <Text key={idx}>{parse(data)}</Text>
                                    )
                                ) || <Text>{localize('Secondary content not available')}</Text>}
                            </div>
                        )}
                       
                    </div>
                </div>

                {/* ========== Note ========== */}
                {!explanation_only && (
                    contract_explanation_data.note?.[form_name] && (
                        <SectionMessage status='info' message={<Notes />} size='sm' />
                    )
                )}
            </div>
        );
    }
    
    if (explanation_only) {
        return (
            <div className='explanation-container-loader'>
                <Skeleton.Square width={250} height={50} rounded />
                <Skeleton.Square fullWidth height={30} rounded />
                <Skeleton.Square fullWidth height={30} rounded />
                <Skeleton.Square fullWidth height={30} rounded />
            </div>);
    }
    
    return (
        <div className='explanation-container-loader'>
            <Skeleton.Square width={250} height={50} rounded />
            <Skeleton.Square fullWidth height={30} rounded />
            <Skeleton.Square fullWidth height={30} rounded />
            <Skeleton.Square fullWidth height={30} rounded />
            <div className='section-loaders'>
                <Skeleton.Square width={300} height={195} rounded />
                <Skeleton.Square width={300} height={195} rounded />
            </div>
            <Skeleton.Square width={250} height={50} rounded />
            <Skeleton.Square fullWidth height={30} rounded />
            <Skeleton.Square fullWidth height={30} rounded />
            <Skeleton.Square fullWidth height={30} rounded />
            <Skeleton.Square fullWidth height={120} rounded />
        </div>
    );
    
};
