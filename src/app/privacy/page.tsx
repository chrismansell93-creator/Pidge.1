import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Privacy Policy — Pidge" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Last updated 16 August 2026. Pidge (“we”) is a location-based dating and social discovery app for adults 18+.</p>
      <h2 className="text-lg font-black text-white">What we collect</h2>
      <p>Account data (name, email, password hash, date of birth), profile data (photos, bio, gender, who you are into, tribes), precise location when you allow GPS, device data needed to run the app, Google Play purchase tokens for Unlimited, and reports you send. We do not take card numbers in the app.</p>
      <h2 className="text-lg font-black text-white">How we use it</h2>
      <p>To show people nearby, keep you signed in, process Unlimited memberships, prevent abuse, and improve safety. Location is used to sort the grid by distance. We do not sell your personal information.</p>
      <h2 className="text-lg font-black text-white">Who we share with</h2>
      <p>Other users see the profile you publish and an approximate distance. Google Play processes Unlimited payments. We may share data if required by law or to investigate harm.</p>
      <h2 className="text-lg font-black text-white">Your choices</h2>
      <p>You can edit or delete your profile, turn off location, or delete your account from Me → Delete account. Deleted profiles are removed from the grid. Contact support@pidge.dating for access requests.</p>
      <h2 className="text-lg font-black text-white">Children</h2>
      <p>Pidge is 18+. We do not knowingly collect data from anyone under 18. Report suspected underage accounts immediately.</p>
    </LegalPage>
  );
}
