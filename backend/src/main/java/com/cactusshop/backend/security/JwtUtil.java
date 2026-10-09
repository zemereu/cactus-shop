package com.cactusshop.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;

    @Value("${ADMIN_TOKEN_VERSION:0}")
    private String adminTokenVersion;

    private final long expirationMs = 7 * 24 * 3600000;

    public JwtUtil(@Value("${JWT_SECRET}") String secret) {
        this.key = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(String subject, String role) {
        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .claim(
                        "adminVersion",
                        "ADMIN".equals(role) ? adminTokenVersion : null
                )
                .issuedAt(new Date())
                .expiration(new Date(
                        System.currentTimeMillis()
                                + ("ADMIN".equals(role) ? 3600000L : expirationMs)
                ))
                .signWith(key)
                .compact();
    }

    public ResponseCookie createJwtCookie(String token) {
        return ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/api")
                .maxAge(Math.max(
                        0,
                        (parseClaims(token).getExpiration().getTime()
                                - System.currentTimeMillis()) / 1000
                ))
                .build();
    }

    public ResponseCookie createLogoutCookie() {
        return ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/api")
                .maxAge(0)
                .build();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return !"ADMIN".equals(claims.get("role", String.class))
                    || java.util.Objects.equals(
                    adminTokenVersion,
                    claims.get("adminVersion", String.class)
            );
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}