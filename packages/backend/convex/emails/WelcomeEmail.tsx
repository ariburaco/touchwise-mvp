import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userName?: string;
  userEmail: string;
  loginUrl?: string;
}

export function WelcomeEmail({
  userName = 'there',
  userEmail,
  loginUrl = 'http://localhost:3000/auth/login',
}: WelcomeEmailProps) {
  const preview = `Welcome to Convex Template, ${userName}!`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Convex Template</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={heading}>
              Welcome, {userName}!
            </Heading>
            
            <Text style={paragraph}>
              We're thrilled to have you on board. Your account has been successfully
              created with the email address: <strong>{userEmail}</strong>
            </Text>

            <Text style={paragraph}>
              Here's what you can do next:
            </Text>

            <Section style={features}>
              <Text style={featureItem}>
                ✓ Complete your profile with a photo and bio
              </Text>
              <Text style={featureItem}>
                ✓ Explore the dashboard and analytics
              </Text>
              <Text style={featureItem}>
                ✓ Customize your notification preferences
              </Text>
              <Text style={featureItem}>
                ✓ Invite team members to collaborate
              </Text>
            </Section>

            <Hr style={hr} />

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Go to Dashboard
              </Button>
            </Section>

            <Text style={paragraph}>
              If you have any questions or need assistance, feel free to reach out
              to our support team. We're here to help!
            </Text>

            <Text style={signature}>
              Best regards,
              <br />
              The Convex Template Team
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Convex Template. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href="#" style={link}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href="#" style={link}>
                Terms of Service
              </Link>
              {' • '}
              <Link href="#" style={link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
};

const header = {
  padding: '32px 20px',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0',
  color: '#5b21b6',
  fontSize: '28px',
  fontWeight: '700',
};

const content = {
  padding: '32px 20px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
  color: '#111827',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  color: '#374151',
};

const features = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const featureItem = {
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
  color: '#4b5563',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#5b21b6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const signature = {
  fontSize: '15px',
  lineHeight: '24px',
  margin: '32px 0 0',
  color: '#6b7280',
};

const footer = {
  padding: '32px 20px',
  borderTop: '1px solid #e5e7eb',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
};

const footerLinks = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0 0 0',
};

const link = {
  color: '#5b21b6',
  textDecoration: 'underline',
};