"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    steps: string[];
}

export default function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>

                {/* Active Progress Bar */}
                <div
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
                                ${isActive ? 'border-indigo-600 text-indigo-600 font-bold scale-110' :
                                        isCompleted ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-400'}
                                `}
                            >
                                {isCompleted ? <Check size={16} /> : stepNumber}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${isActive ? 'text-indigo-700' : 'text-gray-500'}`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
