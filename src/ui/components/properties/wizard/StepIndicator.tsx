"use client";



interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    steps: string[];
    onStepClick?: (step: number) => void;
}

export default function StepIndicator({ currentStep, totalSteps, steps, onStepClick }: StepIndicatorProps) {
    return (
        <div className="w-full py-6 px-4">
            <div className="flex items-center justify-between relative">
                {/* Background Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-indigo-50 -z-10 rounded-full"></div>

                {/* Active Progress Line */}
                <div
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <div
                            key={index}
                            className={`flex flex-col items-center relative group ${onStepClick ? 'cursor-pointer' : ''}`}
                            onClick={() => onStepClick && onStepClick(stepNumber)}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all duration-300 z-10
                                ${isActive
                                        ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 shadow-lg scale-110'
                                        : isCompleted
                                            ? 'bg-white text-gray-700 border-gray-300 font-medium'
                                            : 'bg-white text-gray-400 border-gray-200'
                                    }`}
                            >
                                {stepNumber}
                            </div>
                            <span
                                className={`absolute top-12 text-xs font-semibold whitespace-nowrap transition-colors duration-300
                                ${isActive ? 'text-indigo-700' : 'text-gray-400'}`}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
