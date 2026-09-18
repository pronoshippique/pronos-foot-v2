import AuthHeader from "@/components/AuthHeader";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "Mot de passe oublié — Pronos Foot",
};

export default async function MotDePasseOubliePage({ searchParams }) {
  const params = await searchParams;
  const expired = params?.erreur === "lien";

  return (
    <>
      <AuthHeader />
      <ForgotPasswordForm expired={expired} />
    </>
  );
}
