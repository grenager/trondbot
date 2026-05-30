"use client";

import { useState } from "react";

export default function AboutModal() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="About Trondbot"
        className="text-stone-400 transition-colors hover:text-stone-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-stone-900/40"
            onClick={() => setOpen(false)}
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
            <div className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
              <p className="font-medium text-stone-800">Teg Grenager</p>
              <a
                href="https://x.com/grenager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                @grenager
              </a>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
