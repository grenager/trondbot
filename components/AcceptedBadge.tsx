export default function AcceptedBadge() {
  return (
    <div
      className="mt-1.5 flex items-center gap-1 self-end text-xs font-medium text-green-600"
      aria-label="Message accepted"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>Perfect!</span>
    </div>
  );
}
