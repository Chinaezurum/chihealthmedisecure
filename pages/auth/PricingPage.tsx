import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { CheckIcon, LockIcon } from '../../components/icons/index.tsx';

interface PricingPageProps {
    onSelectPlan: () => void;
    onSelectPatientPlan: () => void;
}

const tiers = [
    {
        name: 'Patient Plus',
        prices: { monthly: 'Free', yearly: 'Free' },
        period: { monthly: 'for individuals', yearly: 'for individuals' },
        description: 'Empowering patients with access to their health data.',
        features: [
            'Access your health records',
            'Book appointments online',
            'Use the AI Health Assistant',
            'Connect with your providers',
        ],
        ctaText: 'Create Patient Account',
        isPatient: true,
    },
    {
        name: 'Basic Clinic',
        prices: { monthly: 50000, yearly: 500000 },
        period: { monthly: '/month', yearly: '/year' },
        description: 'For solo practitioners and small clinics getting started.',
        features: [
            'Up to 5 staff accounts',
            'Core EHR & Scheduling',
            'E-Prescribing',
            'Patient Portal Access',
            'Basic AI Summaries',
        ],
        ctaText: 'Get Started',
    },
    {
        name: 'Professional Hospital',
        prices: { monthly: 250000, yearly: 2500000 },
        period: { monthly: '/month', yearly: '/year' },
        description: 'For hospitals and multi-specialty clinics.',
        features: [
            'Up to 50 staff accounts',
            'All Basic Clinic features',
            'Full Role Suite (Lab, Pharmacy, etc.)',
            'Inpatient & Triage Management',
            'Full AI Assistant Suite',
        ],
        ctaText: 'Choose Professional',
        highlight: true,
    },
    {
        name: 'Enterprise',
        prices: { monthly: 'Custom', yearly: 'Custom' },
        period: { monthly: 'annual contract', yearly: 'annual contract' },
        description: 'For large hospital networks and health systems.',
        features: [
            'Unlimited staff accounts',
            'All Professional features',
            'Custom Integrations (HIS/API)',
            'Dedicated Support & SLA',
            'Advanced Compliance Reporting',
        ],
        ctaText: 'Contact Sales',
        isEnterprise: true,
    }
];

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, onSelectPatientPlan }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="pricing-page-container">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Flexible Plans for Every Healthcare Provider</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">Choose the right plan to empower your facility. All prices are for demonstration.</p>
            </div>
            
            <div className="billing-cycle-toggle-wrapper">
                <span className={`font-semibold ${billingCycle === 'monthly' ? 'text-primary' : 'text-text-secondary'}`}>Monthly</span>
                <div className="billing-cycle-toggle">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={billingCycle === 'monthly' ? 'active' : ''}
                        aria-pressed={billingCycle === 'monthly'}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={billingCycle === 'yearly' ? 'active' : ''}
                        aria-pressed={billingCycle === 'yearly'}
                    >
                        Yearly
                    </button>
                    <div 
                        className="toggle-glider"
                        style={{ transform: billingCycle === 'yearly' ? 'translateX(100%)' : 'translateX(0)' }}
                    ></div>
                </div>
                <span className={`font-semibold ${billingCycle === 'yearly' ? 'text-primary' : 'text-text-secondary'}`}>Yearly</span>
                <span className="savings-badge">Save up to 17%</span>
            </div>

            <div className="pricing-grid">
                {tiers.map((tier) => {
                    const price = tier.prices[billingCycle];
                    const period = tier.period[billingCycle];

                    return (
                        <div key={tier.name} className={`pricing-card ${tier.highlight ? 'highlight' : ''}`}>
                            {tier.highlight && <div className="most-popular-badge">Most Popular</div>}
                            <div className="pricing-card-header">
                                <h3 className="pricing-card-title">{tier.name}</h3>
                                <p className="pricing-card-description">{tier.description}</p>
                                <div className="pricing-card-price">
                                    <span className="price">{typeof price === 'number' ? `₦${price.toLocaleString()}`: price}</span>
                                    <span className="period">{period}</span>
                                </div>
                            </div>
                            <ul className="pricing-card-features">
                                {tier.features.map((feature, index) => (
                                    <li key={index} className="pricing-feature-item">
                                        <CheckIcon />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                             {!tier.isPatient && (
                                <div className="price-lock-guarantee">
                                    <LockIcon />
                                    <span>Price locked for 2 years</span>
                                </div>
                            )}
                            <div className="pricing-card-cta">
                                {tier.isEnterprise ? (
                                    <a href="mailto:sales@chihealth.com" className="btn btn-secondary btn-full-width">{tier.ctaText}</a>
                                ) : tier.isPatient ? (
                                    <Button onClick={onSelectPatientPlan} fullWidth className="btn-secondary">{tier.ctaText}</Button>
                                ) : (
                                    <Button onClick={onSelectPlan} fullWidth>{tier.ctaText}</Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};