package com.cactusshop.backend.controller;

import com.cactusshop.backend.security.JwtUtil;
import com.cactusshop.backend.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginRateLimiter rateLimiter;

    @Value("${ADMIN_USERNAME}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD_HASH}")
    private String adminPasswordHash;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> credentials,
            HttpServletRequest request) {

        if (!rateLimiter.tryAcquire("admin", "login", 5)) {
            return ResponseEntity.status(429)
                    .header("Retry-After", "900")
                    .body(Map.of(
                            "error",
                            "Prea multe încercări. Reîncearcă peste 15 minute."
                    ));
        }

        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null
                || password.getBytes(
                java.nio.charset.StandardCharsets.UTF_8
        ).length > 72) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Date incorecte");
        }

        boolean usernameMatches = adminUsername.equals(username);
        boolean passwordMatches = passwordEncoder.matches(
                password, adminPasswordHash
        );

        if (usernameMatches && passwordMatches) {
            String token = jwtUtil.generateToken(username, "ADMIN");

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.SET_COOKIE,
                            jwtUtil.createJwtCookie(token).toString()
                    )
                    .body(Map.of("message", "Login reusit"));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Date incorecte");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        jwtUtil.createLogoutCookie().toString()
                )
                .body(Map.of("message", "Deconectat"));
    }

    @GetMapping("/me")
    public Map<String, String> me() {
        return Map.of("role", "ADMIN");
    }
}