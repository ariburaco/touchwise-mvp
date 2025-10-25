import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { render } from '@react-email/render';
import { WelcomeEmail } from './emails/WelcomeEmail';
import { NotificationEmail } from './emails/NotificationEmail';
import { PasswordResetEmail } from './emails/PasswordResetEmail';
import { TwoFactorEmail } from './emails/TwoFactorEmail';
import { MagicLinkEmail } from './emails/MagicLinkEmail';
import "./polyfills";

/**
 * Send email action - internal use only
 */
export const sendEmail = internalAction({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    from: v.optional(v.string()),
    replyTo: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      // Dynamic import to avoid bundling issues
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: args.from || 'Convex Template <noreply@fileuploader.app>',
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        replyTo: args.replyTo,
      });

      if (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: error.message };
      }

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Email send error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
      : 'http://localhost:3000/auth/login';
    
    const html = await render(
      WelcomeEmail({
        userName: args.userName,
        userEmail: args.userEmail,
        loginUrl,
      })
    );

    const text = `Welcome to Convex Template, ${args.userName || 'there'}!
    
We're thrilled to have you on board. Your account has been successfully created with the email address: ${args.userEmail}

You can log in at: ${loginUrl}

Best regards,
The Convex Template Team`;

    return await ctx.runAction('emails:sendEmail' as any, {
      to: [args.userEmail],
      subject: `Welcome to Convex Template, ${args.userName || 'there'}!`,
      html,
      text,
    });
  },
});

/**
 * Send notification email
 */
export const sendNotificationEmail = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    notificationTitle: v.string(),
    notificationMessage: v.string(),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const html = await render(
      NotificationEmail({
        userName: args.userName,
        notificationTitle: args.notificationTitle,
        notificationMessage: args.notificationMessage,
        actionUrl: args.actionUrl,
        actionText: args.actionText,
      })
    );

    const text = `${args.notificationTitle}

Hi ${args.userName || 'there'},

${args.notificationMessage}

${args.actionUrl ? `View details: ${args.actionUrl}` : ''}

You received this notification from Convex Template.`;

    return await ctx.runAction('emails:sendEmail' as any, {
      to: [args.userEmail],
      subject: args.notificationTitle,
      html,
      text,
    });
  },
});

/**
 * Test email functionality (public action for testing)
 */
export const testEmail = action({
  args: {
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const html = `
      <h1>Test Email</h1>
      <p>If you received this, email sending is working correctly!</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `;

    return await ctx.runAction('emails:sendEmail' as any, {
      to: [args.to],
      subject: 'Test Email from Convex Template',
      html,
      text: 'Test Email - If you received this, email sending is working correctly!',
    });
  },
});

/**
 * Send batch notification emails
 */
export const sendBatchNotificationEmails = internalAction({
  args: {
    recipients: v.array(
      v.object({
        email: v.string(),
        name: v.optional(v.string()),
      })
    ),
    notificationTitle: v.string(),
    notificationMessage: v.string(),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await Promise.allSettled(
      args.recipients.map((recipient) =>
        ctx.runAction('emails:sendNotificationEmail' as any, {
          userEmail: recipient.email,
          userName: recipient.name,
          notificationTitle: args.notificationTitle,
          notificationMessage: args.notificationMessage,
          actionUrl: args.actionUrl,
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      sent: successful,
      failed,
      total: args.recipients.length,
    };
  },
});

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    resetUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      PasswordResetEmail({
        userName: args.userName,
        userEmail: args.userEmail,
        resetUrl: args.resetUrl,
      })
    );

    const text = `Password Reset Request

Hi ${args.userName || args.userEmail},

We received a request to reset your password. Click the link below to reset it:
${args.resetUrl}

If you didn't request this, you can safely ignore this email.
This link will expire in 1 hour for security reasons.`;

    return await ctx.runAction('emails:sendEmail' as any, {
      to: [args.userEmail],
      subject: 'Reset Your Password',
      html,
      text,
    });
  },
});

/**
 * Send two-factor authentication code
 */
export const sendTwoFactorEmail = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      TwoFactorEmail({
        userName: args.userName,
        userEmail: args.userEmail,
        code: args.code,
      })
    );

    const text = `Two-Factor Authentication Code

Hi ${args.userName || args.userEmail},

Your verification code is: ${args.code}

This code will expire in 5 minutes.
If you didn't request this code, please secure your account immediately.`;

    return await ctx.runAction('emails:sendEmail' as any, {
      to: [args.userEmail],
      subject: 'Your Two-Factor Authentication Code',
      html,
      text,
    });
  },
});

/**
 * Send magic link for passwordless login
 */
export const sendMagicLinkEmail = internalAction({
  args: {
    email: v.string(),
    url: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      MagicLinkEmail({
        email: args.email,
        url: args.url,
      })
    );

    const text = `Sign In to Your Account

Click the link below to sign in to your account:
${args.url}

This link will expire in 10 minutes for security reasons.
If you didn't request this, you can safely ignore this email.`;

    return await ctx.runAction('emails:sendEmail' as any, {
      to: [args.email],
      subject: 'Sign In to Convex Template',
      html,
      text,
    });
  },
});