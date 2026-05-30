import type { DisplayMessage, LanguageCode } from "@/lib/types";
import AcceptedBadge from "./AcceptedBadge";
import CorrectionAcknowledgment from "./CorrectionAcknowledgment";
import HoverWord from "./HoverWord";
import SpeakButton from "./SpeakButton";

interface ChatMessageProps {
  message: DisplayMessage;
  language: LanguageCode;
  onAcknowledgeCorrection?: () => void;
}

export default function ChatMessage({
  message,
  language,
  onAcknowledgeCorrection,
}: ChatMessageProps) {
  if (message.role === "user") {
    if (
      message.awaitingAcknowledgment &&
      message.correction &&
      onAcknowledgeCorrection
    ) {
      return (
        <CorrectionAcknowledgment
          original={message.content}
          correction={message.correction}
          language={language}
          onAcknowledge={onAcknowledgeCorrection}
        />
      );
    }

    return (
      <div className="flex flex-col items-end">
        {message.originalContent ? (
          <p className="mb-1 max-w-[85%] text-xs text-stone-400">
            {message.originalContent}
          </p>
        ) : null}
        <div className="relative max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 pr-8 text-sm text-white">
          {message.content}
          <SpeakButton
            text={message.content}
            language={language}
            variant="user"
          />
        </div>
        {message.accepted ? <AcceptedBadge /> : null}
        {message.originalContent ? (
          <div
            className="mt-1.5 flex items-center gap-1 self-end text-xs font-medium text-stone-400"
            aria-label="Message was corrected"
          >
            <span>Corrected</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="relative max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 pr-8 text-sm leading-relaxed text-stone-800 shadow-sm ring-1 ring-stone-100">
        {message.tokens.map((token, index) => (
          <span key={`${token.word}-${index}`}>
            <HoverWord token={token} />
            {index < message.tokens.length - 1 ? " " : ""}
          </span>
        ))}
        <SpeakButton
          text={message.content}
          language={language}
          variant="assistant"
        />
      </div>
    </div>
  );
}
