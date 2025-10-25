import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TwoFactorEmailProps {
  userName?: string;
  userEmail: string;
  code: string;
}

export function TwoFactorEmail({
  userName,
  userEmail,
  code,
}: TwoFactorEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your two-factor authentication code: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Two-Factor Authentication</Heading>
          <Text style={text}>Hi {userName || userEmail},</Text>
          <Text style={text}>
            Your verification code is:
          </Text>
          <Section style={codeContainer}>
            <div style={codeBox}>
              <Text style={codeText}>{code}</Text>
            </div>
          </Section>
          <Text style={text}>
            Enter this code to complete your sign-in. This code will expire in 5 minutes.
          </Text>
          <Text style={warningText}>
            If you didn't request this code, please secure your account
            immediately by changing your password.
          </Text>
          <Section style={securitySection}>
            <Text style={securityTitle}>Security Tips:</Text>
            <Text style={securityText}>
              • Never share this code with anyone
            </Text>
            <Text style={securityText}>
              • Convex Template staff will never ask for this code
            </Text>
            <Text style={securityText}>
              • This code is only valid for 5 minutes
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 10px",
  padding: "0 48px",
};

const codeContainer = {
  padding: "20px 48px",
  textAlign: "center" as const,
};

const codeBox = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  display: "inline-block",
  padding: "24px 32px",
};

const codeText = {
  color: "#1f2937",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "4px",
  lineHeight: "42px",
  margin: "0",
};

const warningText = {
  color: "#dc2626",
  fontSize: "14px",
  fontWeight: "500",
  lineHeight: "20px",
  margin: "20px 0 10px",
  padding: "0 48px",
};

const securitySection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  margin: "20px 48px",
  padding: "16px",
};

const securityTitle = {
  color: "#4b5563",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const securityText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "18px",
  margin: "4px 0",
};