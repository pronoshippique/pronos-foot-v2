import AuthHeader from "@/components/AuthHeader";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Nouveau mot de passe — Pronos Foot",
};

export default function NouveauMotDePassePage() {
  return (
    <>
      <AuthHeader />
      <ResetPasswordForm />
    </>
  );
}
