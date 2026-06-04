import type { DisplayMessage, LanguageCode } from "@/lib/types";
import type { UsageSnapshot } from "@/lib/usage/client";
import LazyWordText from "./LazyWordText";
import SpeakButton from "./SpeakButton";
import UserBubble from "./UserBubble";

interface ChatMessageProps {
  message: DisplayMessage;
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  loading?: boolean;
  onAcknowledgeCorrection?: () => void;
  onRejectCorrection?: () => void;
  canSpendCredit?: () => boolean;
  onUsageUpdate?: (usage: UsageSnapshot) => void;
}

export default function ChatMessage({
  message,
  targetLanguage,
  nativeLanguage,
  loading = false,
  onAcknowledgeCorrection,
  onRejectCorrection,
  canSpendCredit,
  onUsageUpdate,
}: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <UserBubble
        message={message}
        targetLanguage={targetLanguage}
        nativeLanguage={nativeLanguage}
        loading={loading}
        onAcknowledgeCorrection={onAcknowledgeCorrection}
        onRejectCorrection={onRejectCorrection}
        canSpendCredit={canSpendCredit}
        onUsageUpdate={onUsageUpdate}
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
          canSpendCredit={canSpendCredit}
          onUsageUpdate={onUsageUpdate}
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
