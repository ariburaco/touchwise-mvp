import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface NotificationEmailProps {
  userName?: string;
  notificationTitle: string;
  notificationMessage: string;
  actionUrl?: string;
  actionText?: string;
  timestamp?: string;
}

export function NotificationEmail({
  userName = 'there',
  notificationTitle,
  notificationMessage,
  actionUrl,
  actionText = 'View Details',
  timestamp = new Date().toISOString(),
}: NotificationEmailProps) {
  const preview = notificationTitle;

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
            <Text style={greeting}>Hi {userName},</Text>
            
            <Section style={notificationBox}>
              <Heading style={heading}>
                {notificationTitle}
              </Heading>
              
              <Text style={message}>
                {notificationMessage}
              </Text>

              <Text style={timestampText}>
                {new Date(timestamp).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </Section>

            {actionUrl && (
              <>
                <Hr style={hr} />
                <Section style={buttonContainer}>
                  <Button style={button} href={actionUrl}>
                    {actionText}
                  </Button>
                </Section>
              </>
            )}

            <Text style={footerNote}>
              You received this email because you have notifications enabled for
              your account. You can manage your notification preferences in your
              account settings.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Convex Template. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NotificationEmail;

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

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
  color: '#374151',
};

const notificationBox = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #5b21b6',
  borderRadius: '4px',
  padding: '20px',
  margin: '20px 0',
};

const heading = {
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 12px',
  color: '#111827',
};

const message = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '12px 0',
  color: '#374151',
};

const timestampText = {
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0 0',
  color: '#6b7280',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
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

const footerNote = {
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
  color: '#6b7280',
  fontStyle: 'italic',
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