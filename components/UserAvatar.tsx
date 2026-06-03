"use client";

import { useEffect, useState } from "react";

interface UserAvatarProps {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  signedIn: boolean;
  size?: "sm" | "md";
}

function getInitials(email: string | null, displayName: string | null): string {
  if (displayName) {
    const parts: string[] = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
  }

  if (email) {
    const localPart: string = email.split("@")[0] ?? email;
    return localPart.slice(0, 2).toUpperCase();
  }

  return "?";
}

export default function UserAvatar({
  email,
  displayName,
  avatarUrl,
  signedIn,
  size = "md",
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const sizeClasses: string =
    size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]";

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  if (!signedIn) {
    return (
      <span
        className={`inline-flex ${sizeClasses} items-center justify-center rounded-full bg-stone-100 text-stone-600`}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3"
        >
          <path
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  if (avatarUrl && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClasses} block shrink-0 rounded-full object-cover`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={`inline-flex ${sizeClasses} items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700`}
      aria-hidden="true"
    >
      {getInitials(email, displayName)}
    </span>
  );
}
