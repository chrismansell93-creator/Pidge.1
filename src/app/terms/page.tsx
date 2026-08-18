import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Terms of Use — Pidge" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>By creating an account you confirm you are at least 18 and agree to these terms.</p>
      <h2 className="text-lg font-black text-white">The service</h2>
      <p>Pidge shows nearby adults who also use the app. Limited is free with adverts and caps. Unlimited is a £10 per month Google Play subscription.</p>
      <h2 className="text-lg font-black text-white">Your conduct</h2>
      <p>No harassment, hate, illegal activity, spam, or sexual content involving minors. You must only upload photos of yourself that you have the right to use. We may remove content and ban accounts that break these rules.</p>
      <h2 className="text-lg font-black text-white">Payments</h2>
      <p>Unlimited is billed only by Google Play. Refunds and cancellation follow Google Play rules. Turning Unlimited off in the app does not always stop Play renewals — cancel the subscription in Google Play as well.</p>
      <h2 className="text-lg font-black text-white">Disclaimers</h2>
      <p>Meetups are at your own risk. We do not run background checks. The service is provided as-is. UK law applies.</p>
    </LegalPage>
  );
}
