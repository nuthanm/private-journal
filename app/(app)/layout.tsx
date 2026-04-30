import PhoneShell from "@/components/PhoneShell";
import SessionGuard from "@/components/SessionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhoneShell>
      <SessionGuard>{children}</SessionGuard>
    </PhoneShell>
  );
}
