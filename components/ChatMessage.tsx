import type { DisplayMessage } from "@/lib/types";
import CorrectionDisplay from "./Correction";
import HoverWord from "./HoverWord";

interface ChatMessageProps {
  message: DisplayMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
        {message.correction ? (
          <CorrectionDisplay correction={message.correction} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm leading-relaxed text-stone-800 shadow-sm ring-1 ring-stone-100">
        {message.tokens.map((token, index) => (
          <span key={`${token.word}-${index}`}>
            <HoverWord token={token} />
            {index < message.tokens.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
