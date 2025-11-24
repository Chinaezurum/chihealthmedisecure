import React from 'react';
import { Patient } from '../../types';
import * as Icons from '../icons';

interface NutritionPlanModalProps {
    patient: Patient;
    onClose: () => void;
}

export const NutritionPlanModal: React.FC<NutritionPlanModalProps> = ({ patient, onClose }) => {
    // Mock nutrition plan data - in production, fetch from API
    const nutritionPlan = {
        id: `plan-${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        planType: 'Heart-Healthy Diet',
        startDate: '2025-01-15',
        duration: '12 weeks',
        status: 'Active',
        calories: {
            daily: 2000,
            breakfast: 400,
            lunch: 600,
            dinner: 700,
            snacks: 300,
        },
        macros: {
            protein: '25%',
            carbs: '45%',
            fats: '30%',
        },
        guidelines: [
            'Low sodium (< 2,300mg/day)',
            'Rich in omega-3 fatty acids',
            'High fiber (25-30g/day)',
            'Limit saturated fats',
            'Increase fruits and vegetables',
        ],
        meals: [
            {
                type: 'Breakfast',
                suggestions: ['Oatmeal with berries and nuts', 'Greek yogurt with granola', 'Whole grain toast with avocado'],
            },
            {
                type: 'Lunch',
                suggestions: ['Grilled salmon with quinoa', 'Chicken salad with olive oil', 'Lentil soup with whole grain bread'],
            },
            {
                type: 'Dinner',
                suggestions: ['Baked chicken with vegetables', 'Stir-fried tofu with brown rice', 'Grilled fish with sweet potato'],
            },
            {
                type: 'Snacks',
                suggestions: ['Mixed nuts (unsalted)', 'Fresh fruit', 'Carrot sticks with hummus'],
            },
        ],
        restrictions: ['No added salt in cooking', 'Avoid processed foods', 'Limit red meat to once per week'],
        progress: {
            adherence: '85%',
            weightChange: '-2.5 kg',
            lastUpdated: '2025-11-20',
        },
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-background-secondary rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <Icons.DietIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{nutritionPlan.planType}</h2>
                                <p className="text-white/90">Patient: {patient.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                        >
                            <Icons.XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                    {/* Plan Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-background-tertiary border border-border-primary rounded-lg p-4">
                            <p className="text-text-secondary text-sm mb-1">Duration</p>
                            <p className="text-text-primary font-bold text-lg">{nutritionPlan.duration}</p>
                        </div>
                        <div className="bg-background-tertiary border border-border-primary rounded-lg p-4">
                            <p className="text-text-secondary text-sm mb-1">Daily Calories</p>
                            <p className="text-text-primary font-bold text-lg">{nutritionPlan.calories.daily} kcal</p>
                        </div>
                        <div className="bg-background-tertiary border border-border-primary rounded-lg p-4">
                            <p className="text-text-secondary text-sm mb-1">Adherence</p>
                            <p className="text-green-600 dark:text-green-400 font-bold text-lg">{nutritionPlan.progress.adherence}</p>
                        </div>
                        <div className="bg-background-tertiary border border-border-primary rounded-lg p-4">
                            <p className="text-text-secondary text-sm mb-1">Weight Change</p>
                            <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">{nutritionPlan.progress.weightChange}</p>
                        </div>
                    </div>

                    {/* Macronutrient Distribution */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                            <Icons.PieChartIcon className="w-5 h-5 text-primary" />
                            Macronutrient Distribution
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                                <p className="text-blue-600 dark:text-blue-400 font-bold text-2xl">{nutritionPlan.macros.protein}</p>
                                <p className="text-text-secondary text-sm mt-1">Protein</p>
                            </div>
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                                <p className="text-yellow-600 dark:text-yellow-400 font-bold text-2xl">{nutritionPlan.macros.carbs}</p>
                                <p className="text-text-secondary text-sm mt-1">Carbohydrates</p>
                            </div>
                            <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center">
                                <p className="text-orange-600 dark:text-orange-400 font-bold text-2xl">{nutritionPlan.macros.fats}</p>
                                <p className="text-text-secondary text-sm mt-1">Healthy Fats</p>
                            </div>
                        </div>
                    </div>

                    {/* Dietary Guidelines */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                            <Icons.CheckCircleIcon className="w-5 h-5 text-primary" />
                            Dietary Guidelines
                        </h3>
                        <ul className="space-y-2">
                            {nutritionPlan.guidelines.map((guideline, index) => (
                                <li key={index} className="flex items-start gap-3 bg-background-tertiary border border-border-primary rounded-lg p-3">
                                    <Icons.CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-text-primary">{guideline}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Meal Suggestions */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                            <Icons.DietIcon className="w-5 h-5 text-primary" />
                            Meal Suggestions
                        </h3>
                        <div className="space-y-4">
                            {nutritionPlan.meals.map((meal, index) => (
                                <div key={index} className="bg-background-tertiary border border-border-primary rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-text-primary">{meal.type}</h4>
                                        <span className="text-sm text-text-secondary">
                                            {nutritionPlan.calories[meal.type.toLowerCase() as keyof typeof nutritionPlan.calories] || '—'} kcal
                                        </span>
                                    </div>
                                    <ul className="space-y-1">
                                        {meal.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                                                <span className="text-primary">•</span>
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Restrictions */}
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                            <Icons.AlertTriangleIcon className="w-5 h-5 text-orange-500" />
                            Dietary Restrictions
                        </h3>
                        <ul className="space-y-2">
                            {nutritionPlan.restrictions.map((restriction, index) => (
                                <li key={index} className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                    <Icons.XCircleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-text-primary">{restriction}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border-primary p-4 bg-background-tertiary flex justify-between items-center">
                    <p className="text-sm text-text-secondary">
                        Last updated: {nutritionPlan.progress.lastUpdated}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
