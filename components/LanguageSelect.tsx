import type { LanguageCode } from "@/lib/types";
import { LANGUAGES } from "@/lib/languages";

interface LanguageSelectProps {
  id: string;
  label: string;
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
}

export default function LanguageSelect({
  id,
  label,
  value,
  onChange,
}: LanguageSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-stone-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  );
}
