"use client";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">
          About Trondbot
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-stone-700">
          <p>
            My father&apos;s name was Trond, and he was Norwegian. As he got
            older, he tried to teach me Norwegian just by speaking patiently
            with me on the phone in a mix of Norwegian and English.
          </p>
          <p>
            I kept thinking about how the best way to learn to speak a
            language is really just to try to use it, with lots of helpful
            feedback.
          </p>
          <p>So I built Trondbot to help people learn languages in this simple way. It has certainly helped me learn Norwegian!</p>
        </div>
        <div className="mt-4 border-t border-stone-100 pt-4">
          <p className="text-sm font-medium text-stone-800">Teg Grenager</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <a
              href="https://x.com/grenager"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4 text-stone-400"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Contact us
            </a>
            <a
              href="https://github.com/grenager/trondbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4 text-stone-400"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Star us on GitHub
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
