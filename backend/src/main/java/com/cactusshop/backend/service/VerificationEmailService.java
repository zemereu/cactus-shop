package com.cactusshop.backend.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VerificationEmailService {

    private final ObjectProvider<JavaMailSender> sender;
    private final String from;
    private final String publicUrl;

    public VerificationEmailService(
            ObjectProvider<JavaMailSender> sender,
            @Value("${app.mail.from:}") String from,
            @Value("${app.public-url}") String publicUrl) {
        this.sender = sender;
        this.from = from;
        this.publicUrl = publicUrl;
    }

    public void send(String email, String token) {
        JavaMailSender mail = sender.getIfAvailable();

        if (mail == null || from.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Trimiterea emailurilor nu este configurată încă."
            );
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Verifică adresa de email — Cactus Shop");
        message.setText(
                "Confirmă adresa de email în următoarele 24 de ore:\n"
                        + publicUrl.replaceAll("/+$", "")
                        + "/account.html?verify=" + token
        );

        try {
            mail.send(message);
        } catch (org.springframework.mail.MailException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Emailul nu a putut fi trimis. Reîncearcă mai târziu."
            );
        }
    }
}