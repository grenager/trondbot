import type { DisplayMessage, LanguageCode } from "@/lib/types";
import AcceptedBadge from "./AcceptedBadge";
import CorrectionDisplay from "./Correction";
import HoverWord from "./HoverWord";
import SpeakButton from "./SpeakButton";

interface ChatMessageProps {
  message: DisplayMessage;
  language: LanguageCode;
}

export default function ChatMessage({ message, language }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end">
        <div className="flex max-w-[85%] items-end gap-1">
          <div className="rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white">
            {message.content}
          </div>
          <SpeakButton
            text={message.content}
            language={language}
            variant="user"
          />
        </div>
        {message.correction ? (
          <CorrectionDisplay
            correction={message.correction}
            language={language}
          />
        ) : message.accepted ? (
          <AcceptedBadge />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-end gap-1">
        <div className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm leading-relaxed text-stone-800 shadow-sm ring-1 ring-stone-100">
          {message.tokens.map((token, index) => (
            <span key={`${token.word}-${index}`}>
              <HoverWord token={token} />
              {index < message.tokens.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
        <SpeakButton
          text={message.content}
          language={language}
          variant="assistant"
        />
      </div>
    </div>
  );
}
