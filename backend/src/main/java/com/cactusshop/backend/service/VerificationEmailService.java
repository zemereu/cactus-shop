package com.cactusshop.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class VerificationEmailService {
    private final HttpClient client;
    private final String apiKey;
    private final String from;
    private final String publicUrl;
    private final JsonMapper json = JsonMapper.builder().build();

    @Autowired
    public VerificationEmailService(
            @Value("${BREVO_API_KEY:}") String apiKey,
            @Value("${app.mail.from:}") String from,
            @Value("${app.public-url}") String publicUrl) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(),
                apiKey, from, publicUrl);
    }

    VerificationEmailService(HttpClient client, String apiKey, String from, String publicUrl) {
        this.client = client;
        this.apiKey = apiKey;
        this.from = from;
        this.publicUrl = publicUrl;
    }

    public void send(String email, String token) {
        String link = publicUrl.replaceAll("/+$", "") + "/account.html?verify="
                + java.net.URLEncoder.encode(token, java.nio.charset.StandardCharsets.UTF_8);
        String safeLink = org.springframework.web.util.HtmlUtils.htmlEscape(link);

        sendMessage(email, "Verifică adresa de email — Cactus Shop",
                "Confirmă adresa de email în următoarele 24 de ore:\n" + link,
                "<p>Confirmă adresa de email în următoarele 24 de ore:</p>"
                        + "<p><a href=\"" + safeLink + "\">Verifică adresa de email</a></p>");
    }

    public void sendPasswordReset(String email, String token) {
        String link = publicUrl.replaceAll("/+$", "") + "/account.html#reset=" + token;
        String text = "Resetează parola în următoarele 30 de minute: " + link
                + "\nDacă nu ai cerut resetarea, ignoră acest mesaj.";

        sendMessage(email, "Resetare parolă — Cactus Shop", text,
                "<p>Linkul expiră în 30 de minute.</p><p><a href=\""
                        + org.springframework.web.util.HtmlUtils.htmlEscape(link)
                        + "\">Resetează parola</a></p><p>Dacă nu ai cerut resetarea, ignoră acest mesaj.</p>");
    }

    public void sendOrderConfirmation(com.cactusshop.backend.model.Order order) {
        String text = "Comanda #" + order.getId() + " a fost înregistrată.\n"
                + order.getPurchasedItems() + "\nTotal: " + order.getTotalPrice().setScale(2)
                + " RON\nStatus: " + order.getStatus() + "\nCod comandă: " + order.getOrderToken()
                + "\nPoți verifica statusul folosind codul și emailul la "
                + publicUrl.replaceAll("/+$", "") + "/orders.html"
                + "\nAcest mesaj confirmă înregistrarea comenzii, nu plata.";

        sendMessage(order.getEmail(), "Confirmare comandă #" + order.getId() + " — Cactus Shop",
                text, "<p>" + org.springframework.web.util.HtmlUtils.htmlEscape(text)
                        .replace("\n", "<br>") + "</p>");
    }

    private void sendMessage(String email, String subject, String text, String html) {
        if (apiKey.isBlank() || from.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Trimiterea emailurilor nu este configurată încă.");
        }

        String body = json.writeValueAsString(Map.of(
                "sender", Map.of("name", "Cactus Shop", "email", from),
                "to", List.of(Map.of("email", email)),
                "subject", subject,
                "textContent", text,
                "htmlContent", html));

        HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.brevo.com/v3/smtp/email"))
                .timeout(Duration.ofSeconds(10))
                .header("api-key", apiKey)
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            var response = client.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw unavailable();
            }
        } catch (IOException ex) {
            throw unavailable();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw unavailable();
        }
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Trimiterea emailului nu a putut fi confirmată. Verifică inboxul sau reîncearcă mai târziu.");
    }
}