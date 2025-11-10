import React from 'react';
import { ShieldCheckIcon, LockIcon, KeyIcon } from '../icons/index.tsx';

const features = [
    {
        icon: LockIcon,
        title: 'End-to-End Encryption',
        description: 'Your data is secured with industry-standard encryption both in transit and at rest, ensuring privacy and integrity.',
    },
    {
        icon: ShieldCheckIcon,
        title: 'HIPAA & NDPR Aligned',
        description: 'Built with technical safeguards aligned with global standards like HIPAA and NDPR to protect sensitive patient health information.',
    },
    {
        icon: KeyIcon,
        title: 'Role-Based Access Control',
        description: 'Access to patient records is strictly controlled, ensuring only authorized healthcare professionals can view your data.',
    }
];

export const SecurityAssurance: React.FC = () => {
    return (
        <div className="security-assurance-container">
            {features.map((feature, index) => (
                <div key={index} className="security-feature-item">
                    <div className="security-feature-icon">
                        <feature.icon />
                    </div>
                    <div className="security-feature-text">
                        <h3 className="security-feature-title">{feature.title}</h3>
                        <p className="security-feature-description">{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};