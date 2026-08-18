import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Safety — Pidge" };

export default function SafetyPage() {
  return (
    <LegalPage title="Safety Centre">
      <p>Pidge is an 18+ dating app. We do not allow anyone under 18. We have zero tolerance for child sexual abuse and exploitation (CSAE), including child sexual abuse material (CSAM).</p>
      <h2 className="text-lg font-black text-white">Child sexual abuse and exploitation</h2>
      <p>Accounts that involve minors, sexual content involving minors, grooming, or any CSAE are banned and removed. We may preserve evidence and report it to the National Center for Missing &amp; Exploited Children (NCMEC) and law enforcement where required.</p>
      <h2 className="text-lg font-black text-white">How we prevent it</h2>
      <p>Signup requires a date of birth and an 18+ confirmation. Underage accounts are deleted. Users can report profiles in the app, including an “underage” reason. We review reports and remove violating content and accounts.</p>
      <h2 className="text-lg font-black text-white">How to report</h2>
      <p>In the app, open a profile and use Report. Choose the underage reason if you believe someone is under 18. You can also email support@pidge.dating. For immediate danger, contact local emergency services.</p>
      <h2 className="text-lg font-black text-white">Child safety contact</h2>
      <p>Child safety and CSAM reports: support@pidge.dating. This inbox is monitored for CSAE reports.</p>
      <h2 className="text-lg font-black text-white">Meeting in person</h2>
      <p>Meet in public first. Tell a friend where you are going. Never send money or share bank details.</p>
      <h2 className="text-lg font-black text-white">Location</h2>
      <p>We use precise location only to sort people by distance after you allow it. You can refuse GPS. Other people see distance, not your street address.</p>
    </LegalPage>
  );
}
