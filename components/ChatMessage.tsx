import type { DisplayMessage, LanguageCode } from "@/lib/types";
import LazyWordText from "./LazyWordText";
import SpeakButton from "./SpeakButton";
import UserBubble from "./UserBubble";

interface ChatMessageProps {
  message: DisplayMessage;
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  loading?: boolean;
  onAcknowledgeCorrection?: () => void;
  onSpendTokenizeCredit?: () => boolean;
}

export default function ChatMessage({
  message,
  targetLanguage,
  nativeLanguage,
  loading = false,
  onAcknowledgeCorrection,
  onSpendTokenizeCredit,
}: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <UserBubble
        message={message}
        targetLanguage={targetLanguage}
        nativeLanguage={nativeLanguage}
        loading={loading}
        onAcknowledgeCorrection={onAcknowledgeCorrection}
        onSpendTokenizeCredit={onSpendTokenizeCredit}
      />
    );
  }

  return (
    <div className="flex justify-start">
      <div className="relative max-w-[85%] rounded-2xl rounded-bl-md bg-stone-200 px-4 py-2.5 pr-8 text-sm leading-relaxed text-stone-800">
        <LazyWordText
          text={message.content}
          messageLanguage={targetLanguage}
          glossLanguage={nativeLanguage}
          onSpendTokenizeCredit={onSpendTokenizeCredit}
        />
        <SpeakButton
          text={message.content}
          language={targetLanguage}
          variant="assistant"
        />
      </div>
    </div>
  );
}
