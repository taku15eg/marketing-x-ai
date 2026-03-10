import Link from 'next/link';

interface PoweredByBadgeProps {
  className?: string;
}

export default function PoweredByBadge({ className = '' }: PoweredByBadgeProps) {
  return (
    <Link
      href="/"
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-gray-50 border border-gray-200
        text-[11px] text-gray-500 font-medium
        hover:bg-gray-100 hover:text-gray-600 hover:border-gray-300
        transition-all duration-200

        ${className}
      `}
    >
      <svg
        className="w-3.5 h-3.5 text-[#1B3A5C]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      <span>Powered by <span className="font-semibold text-[#1B3A5C]">Publish Gate</span></span>
    </Link>
  );
}
