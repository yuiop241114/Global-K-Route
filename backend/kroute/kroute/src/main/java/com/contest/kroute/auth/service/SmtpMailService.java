package com.contest.kroute.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.exception.AuthException;
import com.contest.kroute.config.AppProperties;

@Service
@Profile("!local")
public class SmtpMailService {
	private static final Logger log = LoggerFactory.getLogger(SmtpMailService.class);

	private final JavaMailSender mailSender;
	private final AppProperties appProperties;

	public SmtpMailService(JavaMailSender mailSender, AppProperties appProperties) {
		this.mailSender = mailSender;
		this.appProperties = appProperties;
	}

	public void sendUsernameReminder(UserAccount user) {
		String subject = "Global K-Route username reminder";
		String text = "Your Global K-Route username is " + user.getUsername() + ".";
		send(user.getEmail(), subject, text);
	}

	public void sendPasswordReset(UserAccount user, String resetUrl, long validMinutes) {
		String subject = "Global K-Route password reset";
		String text = "Open the link below to reset your Global K-Route password.\n"
				+ "This link is valid for " + validMinutes + " minutes and can be used only once.\n\n"
				+ resetUrl;
		send(user.getEmail(), subject, text);
	}

	private void send(String recipient, String subject, String text) {
		String fromEmail = appProperties.mail().fromEmail();
		if (fromEmail == null || fromEmail.isBlank()) {
			log.error("SMTP delivery is not configured; check the mail environment variables");
			throw new AuthException(HttpStatus.SERVICE_UNAVAILABLE, "Email delivery is not configured");
		}

		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(fromEmail);
		message.setTo(recipient);
		message.setSubject(subject);
		message.setText(text);

		try {
			mailSender.send(message);
		} catch (MailException exception) {
			log.error("SMTP email delivery failed", exception);
			throw new AuthException(HttpStatus.BAD_GATEWAY, "Email delivery failed");
		}
	}
}
