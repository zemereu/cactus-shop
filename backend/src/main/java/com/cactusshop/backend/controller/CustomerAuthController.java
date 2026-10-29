package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CustomerLoginDTO;
import com.cactusshop.backend.dto.CustomerProfileDTO;
import com.cactusshop.backend.dto.CustomerRegisterDTO;
import com.cactusshop.backend.dto.CustomerUpdateDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.security.JwtUtil;
import com.cactusshop.backend.security.ClientIpResolver;
import com.cactusshop.backend.security.LoginRateLimiter;
import com.cactusshop.backend.service.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerAuthController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginRateLimiter rateLimiter;

    @Autowired
    private ClientIpResolver clientIpResolver;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody CustomerRegisterDTO request,
            HttpServletRequest httpRequest) {

        if (!rateLimiter.tryAcquire("register", clientIpResolver.resolve(httpRequest), 20)) {
            return ResponseEntity.status(429).header("Retry-After", "900")
                    .body(Map.of("error", "Prea multe încercări. Reîncearcă peste 15 minute."));
        }

        try {
            Customer customer = customerService.register(request);
            String jwt = jwtUtil.generateToken(customer.getEmail(), "CUSTOMER");
            boolean emailSent = customerService.sendInitialVerification(customer);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtUtil.createJwtCookie(jwt).toString())
                    .body(Map.of(
                            "name", customer.getName(),
                            "verificationEmailSent", emailSent,
                            "message", emailSent
                                    ? "Cont creat. Verifică emailul și folderul Spam pentru activare."
                                    : "Cont creat. Trimiterea emailului nu a putut fi confirmată. Verifică inboxul sau apasă Retrimite codul."
                    ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody CustomerLoginDTO request,
            HttpServletRequest httpRequest) {

        String clientIp = clientIpResolver.resolve(httpRequest);
        String email = request.email().trim().toLowerCase(java.util.Locale.ROOT);
        if (!rateLimiter.tryAcquire("customer-ip", clientIp, 20)
                || !rateLimiter.tryAcquire("customer", clientIp + "|" + email, 5)) {
            return ResponseEntity.status(429).header("Retry-After", "900")
                    .body(Map.of("error", "Prea multe încercări. Reîncearcă peste 15 minute."));
        }

        Customer customer = customerService.authenticate(request.email(), request.password());
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email sau parola incorecte.");
        }

        String token = jwtUtil.generateToken(customer.getEmail(), "CUSTOMER");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.createJwtCookie(token).toString())
                .body(Map.of("name", customer.getName()));
    }

    public record ForgotPasswordRequest(
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Email
            @jakarta.validation.constraints.Size(max = 255)
            String email) {}

    public record ResetPasswordRequest(
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Pattern(regexp = "[0-9a-f]{64}")
            String token,
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Size(min = 8, max = 72)
            String password) {}

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest http) {

        if (!rateLimiter.tryAcquire("reset-ip", clientIpResolver.resolve(http), 20))
            return ResponseEntity.status(429).header("Retry-After", "900")
                    .body(Map.of("error", "Prea multe cereri. Reîncearcă peste 15 minute."));

        if (rateLimiter.tryAcquire(
                "reset-email", request.email().trim().toLowerCase(java.util.Locale.ROOT), 3))
            customerService.requestPasswordReset(request.email());

        return ResponseEntity.ok(Map.of(
                "message",
                "Dacă există un cont cu această adresă, vei primi un link de resetare. Verifică și folderul Spam."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest http) {

        if (!rateLimiter.tryAcquire("reset-submit", clientIpResolver.resolve(http), 20))
            return ResponseEntity.status(429).header("Retry-After", "900")
                    .body(Map.of("error", "Prea multe cereri. Reîncearcă peste 15 minute."));

        customerService.resetPassword(request.token(), request.password());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.createLogoutCookie().toString())
                .body(Map.of("message", "Parola a fost schimbată. Autentifică-te cu noua parolă."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.createLogoutCookie().toString())
                .body(Map.of("message", "Deconectat"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        try {
            CustomerProfileDTO profile = customerService.getProfile(authentication.getName());
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody CustomerUpdateDTO request) {
        try {
            CustomerProfileDTO profile = customerService.updateProfile(authentication.getName(), request);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyAccount(@RequestParam String token) {
        boolean success = customerService.verifyAccount(token);

        if (success) {
            return ResponseEntity.ok(Map.of("message", "Contul a fost verificat cu succes!"));
        }

        return ResponseEntity.badRequest().body("Token invalid sau cont deja verificat.");
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(Authentication authentication) {
        if (!rateLimiter.tryAcquire("verify-email", authentication.getName(), 3))
            return ResponseEntity.status(429)
                    .body(Map.of("error", "Așteaptă 15 minute înainte de retrimitere."));

        String message = customerService.resendVerification(authentication.getName());

        if (message == null) {
            return ResponseEntity.ok(Map.of("message", "Contul este deja verificat."));
        }

        return ResponseEntity.ok(Map.of("message", message));
    }
}