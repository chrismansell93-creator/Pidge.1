import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Safety — Pidge" };

export default function SafetyPage() {
  return (
    <LegalPage title="Safety Centre">
      <p>Pidge is for consenting adults. Meet in public first. Tell a friend where you are going. Never send money or share bank details.</p>
      <h2 className="text-lg font-black text-white">If something feels wrong</h2>
      <p>Use Report on a profile. For immediate danger call local emergency services. To report someone under 18, use the underage report reason so we can remove the account.</p>
      <h2 className="text-lg font-black text-white">Location</h2>
      <p>We use precise location only to sort people by distance after you allow it. You can refuse GPS and stay on a saved pin. Other people see distance, not your exact street address.</p>
    </LegalPage>
  );
}
