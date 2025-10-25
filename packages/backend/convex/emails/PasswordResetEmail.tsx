import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  userName?: string;
  userEmail: string;
  resetUrl: string;
}

export function PasswordResetEmail({
  userName,
  userEmail,
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for Convex Template</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Password Reset Request</Heading>
          <Text style={text}>Hi {userName || userEmail},</Text>
          <Text style={text}>
            We received a request to reset your password. Click the button below
            to reset it:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            If you didn't request this, you can safely ignore this email. Your
            password won't be changed.
          </Text>
          <Text style={text}>
            This link will expire in 1 hour for security reasons.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If the button doesn't work, copy and paste this link into your
            browser:
          </Text>
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>
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

const buttonContainer = {
  padding: "20px 48px",
};

const button = {
  backgroundColor: "#007bff",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "50px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "200px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 48px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0 0 10px",
  padding: "0 48px",
};

const link = {
  color: "#007bff",
  fontSize: "12px",
  padding: "0 48px",
  textDecoration: "underline",
};