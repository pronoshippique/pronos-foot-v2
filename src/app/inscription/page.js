import AuthHeader from "@/components/AuthHeader";
import InscriptionForm from "@/components/InscriptionForm";

export const metadata = {
  title: "Créer un compte — Pronos Foot",
};

export default function InscriptionPage() {
  return (
    <>
      <AuthHeader />
      <InscriptionForm />
    </>
  );
}
