import type { DisplayMessage, LanguageCode } from "@/lib/types";
import HoverWord from "./HoverWord";
import SpeakButton from "./SpeakButton";
import UserBubble from "./UserBubble";

interface ChatMessageProps {
  message: DisplayMessage;
  language: LanguageCode;
  loading?: boolean;
  onAcknowledgeCorrection?: () => void;
}

export default function ChatMessage({
  message,
  language,
  loading = false,
  onAcknowledgeCorrection,
}: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <UserBubble
        message={message}
        language={language}
        loading={loading}
        onAcknowledgeCorrection={onAcknowledgeCorrection}
      />
    );
  }

  return (
    <div className="flex justify-start">
      <div className="relative max-w-[85%] rounded-2xl rounded-bl-md bg-stone-100 px-4 py-2.5 pr-8 text-sm leading-relaxed text-stone-800">
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
