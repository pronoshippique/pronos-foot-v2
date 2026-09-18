import AuthHeader from "@/components/AuthHeader";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Connexion — Pronos Foot",
};

export default function ConnexionPage() {
  return (
    <>
      <AuthHeader />
      <LoginForm />
    </>
  );
}
