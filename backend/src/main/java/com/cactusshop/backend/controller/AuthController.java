package com.cactusshop.backend.controller;

import com.cactusshop.backend.security.JwtUtil;
import com.cactusshop.backend.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest request) {

        String clientIp = extractClientIp(request);

        if (rateLimiter.isBlocked(clientIp)) {
            long minutes = rateLimiter.minutesRemaining(clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Prea multe încercări eșuate. Încearcă din nou peste " + minutes + " minute.");
        }

        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            rateLimiter.recordFailure(clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Date incorecte");
        }

        boolean usernameMatches = adminUsername.equals(username);
        boolean passwordMatches = passwordEncoder.matches(password, adminPasswordHash);

        if (usernameMatches && passwordMatches) {
            rateLimiter.recordSuccess(clientIp);
            String token = jwtUtil.generateToken(username, "ADMIN");
            return ResponseEntity.ok(Map.of("token", token));
        } else {
            rateLimiter.recordFailure(clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Date incorecte");
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}