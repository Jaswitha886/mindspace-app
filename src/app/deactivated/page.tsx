import { AuthShell } from "@/components/auth-shell";
import { LogoutButton } from "@/features/auth/LogoutButton";

// Where requirePageRole sends a signed-in user whose account was switched off
// mid-session. It must be public: the proxy redirects anyone holding a valid
// cookie away from /login, so sending them there instead would loop forever.
export default function DeactivatedPage() {
  return (
    <AuthShell
      headline="Account deactivated"
      sub="Your MindSpace account has been switched off by an administrator. If you think that's a mistake, contact the wellness centre."
    >
      <div className="flex flex-col items-center gap-4">
        <p className="t-meta text-center">
          Signing out clears this session from your browser.
        </p>
        <LogoutButton variant="outline" size="md" />
      </div>
    </AuthShell>
  );
}
