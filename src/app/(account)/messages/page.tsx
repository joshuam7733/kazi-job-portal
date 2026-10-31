import { MessageSquare } from "lucide-react";

export default function MessagesIndex() {
  return (
    <div className="hidden h-full flex-col items-center justify-center p-10 text-center md:flex">
      <MessageSquare className="size-6 text-muted" aria-hidden />
      <p className="mt-3 font-semibold">Choose a conversation</p>
      <p className="mt-1 text-sm text-muted">Select a conversation on the left to read and reply.</p>
    </div>
  );
}
