import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { CheckIcon, ArrowRightIcon, AlertCircleIcon } from '../../components/icons/index.tsx';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'basic' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  onConfirmChange: (newPlan: 'basic' | 'professional' | 'enterprise') => Promise<void>;
}

const planDetails = {
  basic: {
    name: 'Basic Clinic',
    price: '50,000',
    period: 'monthly',
    description: 'For solo practitioners and small clinics',
    features: [
      'Up to 5 staff accounts',
      'Up to 5 departments',
      'Up to 10 rooms',
      'Up to 20 beds',
      'Core EHR & Scheduling',
      'E-Prescribing',
      'Patient Portal Access',
      'Basic Reporting',
    ],
  },
  professional: {
    name: 'Professional Hospital',
    price: '250,000',
    period: 'monthly',
    description: 'For hospitals and multi-specialty clinics',
    features: [
      'Up to 50 staff accounts',
      'Up to 20 departments',
      'Up to 50 rooms',
      'Up to 100 beds',
      'Full Role Suite (Lab, Pharmacy, Radiology, Dietician)',
      'Inpatient & Triage Management',
      'Full AI Assistant Suite',
      'Advanced Analytics & Reporting',
      'Priority Support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    period: 'annual contract',
    description: 'For large hospital networks and health systems',
    features: [
      'Unlimited staff accounts',
      'Unlimited departments',
      'Unlimited rooms',
      'Unlimited beds',
      'Multiple facility locations',
      'Custom Integrations',
      'Dedicated Support & SLA',
      'Advanced Compliance Reporting',
      'API Access',
      'Multi-tenancy (Org hierarchy)',
      'Data Import/Export',
    ],
  },
};

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  billingCycle,
  onConfirmChange,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'enterprise'>(currentPlan);
  const [isLoading, setIsLoading] = useState(false);

  const isUpgrade = (plan: string) => {
    const order = { basic: 1, professional: 2, enterprise: 3 };
    return order[plan as keyof typeof order] > order[currentPlan];
  };

  // @ts-ignore - used in JSX conditionals
  const isDowngrade = (plan: string) => {
    const order = { basic: 1, professional: 2, enterprise: 3 };
    return order[plan as keyof typeof order] < order[currentPlan];
  };

  const handleConfirm = async () => {
    if (selectedPlan === currentPlan) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onConfirmChange(selectedPlan);
      onClose();
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanDetails = planDetails[selectedPlan];
  const actionType = selectedPlan === currentPlan ? 'Current' : isUpgrade(selectedPlan) ? 'Upgrade' : 'Downgrade';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Subscription Plan"
      footer={
        <>
          <Button
            onClick={onClose}
            style={{
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={selectedPlan === currentPlan}
          >
            {actionType === 'Current' ? 'Keep Current Plan' : `Confirm ${actionType}`}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Current Plan Info */}
        <div className="bg-background-tertiary border border-border-primary rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Current Plan</span>
            <span className="px-3 py-1 bg-primary text-white text-xs rounded-full font-semibold capitalize">
              {currentPlan}
            </span>
          </div>
          <h3 className="text-lg font-bold text-text-primary">{planDetails[currentPlan].name}</h3>
        </div>

        {/* Plan Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-text-primary">Select New Plan</label>
          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(planDetails) as Array<'basic' | 'professional' | 'enterprise'>).map((planKey) => {
              const plan = planDetails[planKey];
              const isCurrent = planKey === currentPlan;
              const isSelected = planKey === selectedPlan;
              
              return (
                <button
                  key={planKey}
                  onClick={() => setSelectedPlan(planKey)}
                  disabled={planKey === 'enterprise'}
                  className={`
                    relative border-2 rounded-lg p-4 text-left transition-all
                    ${isSelected ? 'border-primary bg-primary/5' : 'border-border-primary bg-background-secondary'}
                    ${isCurrent ? 'opacity-75' : ''}
                    ${planKey === 'enterprise' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/50'}
                  `}
                >
                  {isCurrent && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded font-semibold">
                      Current
                    </div>
                  )}
                  {planKey === 'enterprise' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-teal-500/10 text-teal-600 text-xs rounded font-semibold">
                      Contact Sales
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-base font-bold text-text-primary capitalize">{planKey}</h4>
                      <p className="text-xs text-text-secondary mt-1">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      {plan.price === 'Custom' ? (
                        <span className="text-lg font-bold text-primary">Custom</span>
                      ) : (
                        <>
                          <div className="text-lg font-bold text-text-primary">
                            ₦{billingCycle === 'annual' 
                              ? (parseInt(plan.price.replace(/,/g, '')) * 12 * 0.8).toLocaleString()
                              : plan.price
                            }
                          </div>
                          <div className="text-xs text-text-secondary">
                            /{billingCycle === 'annual' ? 'year' : plan.period}
                          </div>
                          {billingCycle === 'annual' && (
                            <div className="text-xs text-teal-600 mt-0.5">Save 20%</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 mt-3">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <CheckIcon className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-text-secondary">{feature}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Change Summary */}
        {selectedPlan !== currentPlan && selectedPlan !== 'enterprise' && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {isUpgrade(selectedPlan) ? (
                <ArrowRightIcon className="w-5 h-5 text-teal-600 mt-0.5" />
              ) : (
                <AlertCircleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-text-primary mb-1">
                  {isUpgrade(selectedPlan) ? 'Plan Upgrade' : 'Plan Downgrade'}
                </h4>
                <p className="text-xs text-text-secondary">
                  {isUpgrade(selectedPlan) ? (
                    <>
                      You'll immediately gain access to additional features and increased limits. 
                      Your next billing will reflect the new plan pricing.
                    </>
                  ) : (
                    <>
                      <strong className="text-amber-600">Warning:</strong> Downgrading may restrict access to certain features 
                      and reduce limits. Ensure your current usage is within the new plan's limits before proceeding.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Plan Details */}
        {selectedPlan !== currentPlan && (
          <div className="border border-border-primary rounded-lg p-4">
            <h4 className="font-semibold text-sm text-text-primary mb-3">
              {selectedPlanDetails.name} Features
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {selectedPlanDetails.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
