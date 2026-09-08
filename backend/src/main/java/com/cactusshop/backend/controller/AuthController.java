package com.cactusshop.backend.controller;

import com.cactusshop.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    // Citite din variabile de mediu, NU hardcodate în cod.
    // ADMIN_USERNAME = numele de utilizator, in clar.
    // ADMIN_PASSWORD_HASH = hash-ul BCrypt al parolei (NU parola în clar).
    // Generează un hash cu: new BCryptPasswordEncoder().encode("parola-ta")
    @Value("${ADMIN_USERNAME}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD_HASH}")
    private String adminPasswordHash;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Date incorecte");
        }

        boolean usernameMatches = adminUsername.equals(username);
        boolean passwordMatches = passwordEncoder.matches(password, adminPasswordHash);

        if (usernameMatches && passwordMatches) {
            String token = jwtUtil.generateToken(username);
            return ResponseEntity.ok(Map.of("token", token));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Date incorecte");
        }
    }
}