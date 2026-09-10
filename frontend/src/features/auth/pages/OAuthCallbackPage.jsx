import AuthLayout from "../components/AuthLayout";
import OAuthCallback from "../components/OAuthCallback";

function OAuthCallbackPage({ provider }) {
  return (
    <AuthLayout>
      <OAuthCallback provider={provider} />
    </AuthLayout>
  );
}

export default OAuthCallbackPage;
