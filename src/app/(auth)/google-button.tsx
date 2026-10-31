import { Button } from "@/components/ui/button";
import { googleSignInAction } from "@/server/auth-actions";

export function GoogleButton({ callbackUrl, label = "Continue with Google" }: { callbackUrl: string; label?: string }) {
  return (
    <form action={googleSignInAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button type="submit" variant="secondary" size="lg" className="w-full">
        <svg viewBox="0 0 24 24" aria-hidden className="size-4">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        {label}
      </Button>
    </form>
  );
}
