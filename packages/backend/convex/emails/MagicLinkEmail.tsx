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

interface MagicLinkEmailProps {
  email: string;
  url: string;
}

export function MagicLinkEmail({ email, url }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to Convex Template</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <div style={logo}>✨</div>
          </Section>
          <Heading style={h1}>Sign in to Convex Template</Heading>
          <Text style={text}>Hi there,</Text>
          <Text style={text}>
            Click the button below to sign in to your account. No password
            needed!
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Sign In Instantly
            </Button>
          </Section>
          <Text style={text}>
            This magic link will expire in 10 minutes for security reasons.
          </Text>
          <Section style={benefitsSection}>
            <Text style={benefitTitle}>Why magic links?</Text>
            <Text style={benefitText}>✓ No passwords to remember</Text>
            <Text style={benefitText}>✓ More secure than traditional passwords</Text>
            <Text style={benefitText}>✓ Quick and easy access</Text>
          </Section>
          <Text style={text}>
            If you didn't request this link, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If the button doesn't work, copy and paste this link into your
            browser:
          </Text>
          <Link href={url} style={link}>
            {url}
          </Link>
          <Text style={footer}>
            This email was sent to {email}
          </Text>
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

const logoSection = {
  textAlign: "center" as const,
  padding: "20px 0",
};

const logo = {
  display: "inline-block",
  fontSize: "48px",
  lineHeight: "1",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  padding: "0 48px",
  textAlign: "center" as const,
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
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#22c55e",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "50px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "220px",
};

const benefitsSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  margin: "20px 48px",
  padding: "20px",
};

const benefitTitle = {
  color: "#4b5563",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const benefitText = {
  color: "#22c55e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "6px 0",
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
  textAlign: "center" as const,
};

const link = {
  color: "#22c55e",
  fontSize: "12px",
  padding: "0 48px",
  textDecoration: "underline",
  display: "block",
  textAlign: "center" as const,
  marginBottom: "10px",
};