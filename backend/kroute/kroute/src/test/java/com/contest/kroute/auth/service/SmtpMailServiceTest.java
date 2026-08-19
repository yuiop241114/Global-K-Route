package com.contest.kroute.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.config.AppProperties;

class SmtpMailServiceTest {

	@Test
	void sendsUsernameReminderThroughConfiguredMailSender() {
		JavaMailSender mailSender = mock(JavaMailSender.class);
		SmtpMailService service = new SmtpMailService(mailSender, appProperties());
		UserAccount user = new UserAccount("traveler", "traveler@example.com", "password-hash");

		service.sendUsernameReminder(user);

		ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
		verify(mailSender).send(messageCaptor.capture());
		SimpleMailMessage message = messageCaptor.getValue();
		assertThat(message.getFrom()).isEqualTo("sender@gmail.com");
		assertThat(message.getTo()).containsExactly("traveler@example.com");
		assertThat(message.getSubject()).isEqualTo("Global K-Route username reminder");
		assertThat(message.getText()).contains("traveler");
	}

	private AppProperties appProperties() {
		return new AppProperties(
				new AppProperties.Cors("http://localhost:3000"),
				new AppProperties.TourApi("https://apis.example.com/B551011", "test-key"),
				new AppProperties.Kakao(""),
				new AppProperties.Upstash(new AppProperties.Upstash.Redis("", "")),
				new AppProperties.Auth(false, 7, 30),
				new AppProperties.Frontend("http://localhost:3000"),
				new AppProperties.Mail("sender@gmail.com")
		);
	}
}
