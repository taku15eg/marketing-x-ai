'use client';

interface LoadingProgressProps {
  currentStep: number; // 1-4
  message: string;
}

const STEPS = [
  { number: 1, label: '企業調査', icon: 'building' },
  { number: 2, label: 'ページ読取', icon: 'eye' },
  { number: 3, label: '課題診断', icon: 'search' },
  { number: 4, label: '提案作成', icon: 'document' },
] as const;

function StepIcon({ icon, isActive }: { icon: string; isActive: boolean }) {
  const color = isActive ? 'currentColor' : 'currentColor';

  switch (icon) {
    case 'building':
      return (
        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'eye':
      return (
        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case 'search':
      return (
        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'document':
      return (
        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function LoadingProgress({ currentStep, message }: LoadingProgressProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isPending = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                    ${isCompleted
                      ? 'bg-[#1B3A5C] text-white'
                      : isActive
                        ? 'bg-[#1B3A5C] text-white ring-4 ring-[#1B3A5C]/20'
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <StepIcon icon={step.icon} isActive={isActive} />
                  )}

                  {/* Pulse animation for active step */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-[#1B3A5C]/20" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-2 text-xs font-medium font-['Noto_Sans_JP'] transition-colors duration-300
                    ${isCompleted || isActive ? 'text-[#1B3A5C]' : 'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-3 mt-[-1.5rem]">
                  <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`
                        h-full bg-[#1B3A5C] rounded-full transition-all duration-700 ease-out
                        ${isCompleted ? 'w-full' : isActive ? 'w-1/2 animate-pulse' : 'w-0'}
                      `}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-[#1B3A5C] to-[#2a5a8c] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={4}
          aria-label={`ステップ ${currentStep} / 4`}
        />
      </div>

      {/* Message */}
      <div className="text-center">
        <p className="text-base text-[#1B3A5C] font-medium font-['Noto_Sans_JP'] animate-pulse">
          {message}
        </p>
        <p className="mt-2 text-sm text-gray-400 font-['Noto_Sans_JP']">
          ステップ {currentStep} / 4
        </p>
      </div>
    </div>
  );
}
