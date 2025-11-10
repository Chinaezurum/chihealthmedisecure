import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { 
  CheckIcon, 
  CreditCardIcon, 
  CalendarIcon, 
  ShieldCheckIcon,
  DollarSignIcon,
  SparklesIcon,
  UsersIcon,
  BuildingIcon,
  ArrowRightIcon
} from '../../components/icons/index.tsx';

const planDetails = {
    name: 'Professional Hospital',
    price: '250,000',
    period: 'monthly',
    status: 'Active',
    nextBillingDate: 'August 15, 2024',
    features: [
        'Up to 50 staff accounts',
        'Full Role Suite (Lab, Pharmacy, etc.)',
        'Inpatient & Triage Management',
        'Full AI Assistant Suite',
    ]
};

const availablePlans = [
    {
        name: 'Basic Clinic',
        price: '50,000',
        period: 'monthly',
        description: 'For solo practitioners and small clinics',
        features: ['Up to 5 staff accounts', 'Core EHR & Scheduling', 'E-Prescribing', 'Patient Portal Access'],
        popular: false,
    },
    {
        name: 'Professional Hospital',
        price: '250,000',
        period: 'monthly',
        description: 'For hospitals and multi-specialty clinics',
        features: ['Up to 50 staff accounts', 'Full Role Suite', 'Inpatient & Triage Management', 'Full AI Assistant Suite'],
        popular: true,
        current: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: 'annual contract',
        description: 'For large hospital networks and health systems',
        features: ['Unlimited staff accounts', 'Custom Integrations', 'Dedicated Support & SLA', 'Advanced Compliance Reporting'],
        popular: false,
    },
];

export const SubscriptionView: React.FC = () => {
  const [showChangePlan, setShowChangePlan] = useState(false);

  return (
    <div className="subscription-page-redesign">
      {/* Hero Header */}
      <div className="subscription-hero-section">
        <div className="subscription-hero-content">
          <div>
            <h1 className="subscription-hero-title">Subscription & Billing</h1>
            <p className="subscription-hero-subtitle">Manage your plan, billing, and payment methods</p>
          </div>
          <div className="subscription-status-badge">
            <div className="subscription-status-indicator"></div>
            <span>Active Subscription</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="subscription-content-grid">
        {/* Current Plan Card */}
        <div className="subscription-main-column">
          <div className="subscription-plan-card">
            <div className="subscription-plan-header">
              <div className="subscription-plan-icon-wrapper">
                <BuildingIcon className="w-6 h-6" />
              </div>
              <div className="subscription-plan-header-content">
                <h2 className="subscription-plan-title">Current Plan</h2>
                <p className="subscription-plan-subtitle">Your active subscription details</p>
              </div>
              <div className="subscription-plan-badge">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Active</span>
              </div>
            </div>

            <div className="subscription-plan-body">
              <div className="subscription-plan-name-section">
                <h3 className="subscription-plan-name">{planDetails.name}</h3>
                <div className="subscription-plan-price">
                  <span className="subscription-plan-currency">₦</span>
                  <span className="subscription-plan-amount">{planDetails.price}</span>
                  <span className="subscription-plan-period">/{planDetails.period}</span>
                </div>
              </div>

              <div className="subscription-features-section">
                <h4 className="subscription-features-title">Plan Features</h4>
                <div className="subscription-features-grid">
                  {planDetails.features.map((feature, index) => (
                    <div key={index} className="subscription-feature-item">
                      <div className="subscription-feature-icon">
                        <CheckIcon className="w-5 h-5" />
                      </div>
                      <span className="subscription-feature-text">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subscription-plan-actions">
                <Button 
                  onClick={() => setShowChangePlan(!showChangePlan)}
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)'
                  }}
                >
                  Change Plan
                </Button>
                <Button 
                  style={{
                    backgroundColor: 'var(--error-color)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>

          {/* Available Plans (when changing) */}
          {showChangePlan && (
            <div className="subscription-available-plans">
              <h3 className="subscription-available-plans-title">Available Plans</h3>
              <div className="subscription-plans-grid">
                {availablePlans.map((plan, index) => (
                  <div 
                    key={index} 
                    className={`subscription-plan-option ${plan.current ? 'subscription-plan-current' : ''} ${plan.popular ? 'subscription-plan-popular' : ''}`}
                  >
                    {plan.popular && (
                      <div className="subscription-plan-popular-badge">Most Popular</div>
                    )}
                    {plan.current && (
                      <div className="subscription-plan-current-badge">Current Plan</div>
                    )}
                    <div className="subscription-plan-option-header">
                      <h4 className="subscription-plan-option-name">{plan.name}</h4>
                      <div className="subscription-plan-option-price">
                        {plan.price === 'Custom' ? (
                          <span className="subscription-plan-custom-price">Custom Pricing</span>
                        ) : (
                          <>
                            <span className="subscription-plan-option-currency">₦</span>
                            <span className="subscription-plan-option-amount">{plan.price}</span>
                            <span className="subscription-plan-option-period">/{plan.period}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="subscription-plan-option-description">{plan.description}</p>
                    <ul className="subscription-plan-option-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="subscription-plan-option-feature">
                          <CheckIcon className="w-4 h-4" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {!plan.current && (
                      <Button 
                        fullWidth
                        style={{
                          marginTop: '1rem',
                          background: plan.popular 
                            ? 'linear-gradient(135deg, var(--teal-600) 0%, var(--teal-500) 100%)'
                            : 'var(--background-secondary)',
                          color: plan.popular ? 'white' : 'var(--text-primary)',
                          border: plan.popular ? 'none' : '1px solid var(--border-primary)'
                        }}
                      >
                        {plan.price === 'Custom' ? 'Contact Sales' : 'Switch to This Plan'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Billing Details Sidebar */}
        <div className="subscription-sidebar-column">
          {/* Billing Information Card */}
          <div className="subscription-billing-card">
            <div className="subscription-billing-header">
              <div className="subscription-billing-icon-wrapper">
                <CreditCardIcon className="w-5 h-5" />
              </div>
              <h3 className="subscription-billing-title">Billing Details</h3>
            </div>
            <div className="subscription-billing-content">
              <div className="subscription-billing-item">
                <div className="subscription-billing-item-header">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="subscription-billing-item-label">Next Billing Date</span>
                </div>
                <p className="subscription-billing-item-value">{planDetails.nextBillingDate}</p>
              </div>

              <div className="subscription-billing-item">
                <div className="subscription-billing-item-header">
                  <CreditCardIcon className="w-4 h-4" />
                  <span className="subscription-billing-item-label">Payment Method</span>
                </div>
                <div className="subscription-payment-method">
                  <div className="subscription-payment-icon">
                    <CreditCardIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="subscription-payment-type">Mastercard</p>
                    <p className="subscription-payment-number">**** **** **** 1234</p>
                  </div>
                </div>
              </div>

              <Button 
                fullWidth
                style={{
                  marginTop: '1rem',
                  background: 'linear-gradient(135deg, var(--teal-600) 0%, var(--teal-500) 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                <CreditCardIcon className="w-4 h-4" />
                <span>Update Payment Method</span>
              </Button>
            </div>
          </div>

          {/* Billing History Card */}
          <div className="subscription-billing-history-card">
            <div className="subscription-billing-history-header">
              <h3 className="subscription-billing-history-title">Billing History</h3>
              <button className="subscription-view-all-link">
                View All
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="subscription-billing-history-list">
              <div className="subscription-billing-history-item">
                <div className="subscription-billing-history-item-content">
                  <p className="subscription-billing-history-item-date">July 15, 2024</p>
                  <p className="subscription-billing-history-item-amount">₦250,000</p>
                </div>
                <div className="subscription-billing-history-item-status">
                  <CheckIcon className="w-4 h-4" />
                  <span>Paid</span>
                </div>
              </div>
              <div className="subscription-billing-history-item">
                <div className="subscription-billing-history-item-content">
                  <p className="subscription-billing-history-item-date">June 15, 2024</p>
                  <p className="subscription-billing-history-item-amount">₦250,000</p>
                </div>
                <div className="subscription-billing-history-item-status">
                  <CheckIcon className="w-4 h-4" />
                  <span>Paid</span>
                </div>
              </div>
              <div className="subscription-billing-history-item">
                <div className="subscription-billing-history-item-content">
                  <p className="subscription-billing-history-item-date">May 15, 2024</p>
                  <p className="subscription-billing-history-item-amount">₦250,000</p>
                </div>
                <div className="subscription-billing-history-item-status">
                  <CheckIcon className="w-4 h-4" />
                  <span>Paid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Summary Card */}
          <div className="subscription-usage-card">
            <div className="subscription-usage-header">
              <SparklesIcon className="w-5 h-5" />
              <h3 className="subscription-usage-title">Usage Summary</h3>
            </div>
            <div className="subscription-usage-content">
              <div className="subscription-usage-item">
                <div className="subscription-usage-item-header">
                  <UsersIcon className="w-4 h-4" />
                  <span className="subscription-usage-item-label">Staff Accounts</span>
                </div>
                <div className="subscription-usage-item-value">
                  <span className="subscription-usage-current">12</span>
                  <span className="subscription-usage-limit">/ 50</span>
                </div>
                <div className="subscription-usage-bar">
                  <div className="subscription-usage-bar-fill" style={{ width: '24%' }}></div>
                </div>
              </div>
              <div className="subscription-usage-item">
                <div className="subscription-usage-item-header">
                  <BuildingIcon className="w-4 h-4" />
                  <span className="subscription-usage-item-label">Organizations</span>
                </div>
                <div className="subscription-usage-item-value">
                  <span className="subscription-usage-current">3</span>
                  <span className="subscription-usage-limit">/ Unlimited</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
