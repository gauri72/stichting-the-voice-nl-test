import LoginBreadcrumbSection from "./LoginBreadcrumbSection";
import LoginFormSection from "./LoginFormSection";
import LoginCtaSection from "./LoginCtaSection";

export default function LoginPage() {
  return (
    <div id="login-navbar-top">
      <LoginBreadcrumbSection />
      <LoginFormSection />
      <LoginCtaSection />
    </div>
  );
}
