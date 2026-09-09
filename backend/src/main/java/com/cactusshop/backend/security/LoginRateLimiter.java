package com.cactusshop.backend.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

// Rate limiter simplu, în memorie, pentru /api/auth/login.
// Blochează temporar un IP după prea multe încercări eșuate,
// ca să prevină brute-force pe parola de admin.
//
// NOTĂ: fiind în memorie, se resetează la fiecare restart al aplicației
// (deploy nou pe Railway). Pentru un site mai mare ai vrea Redis sau
// o soluție distribuită, dar pentru un magazin mic e suficient.
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MINUTES = 15;

    private final ConcurrentHashMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    private static class AttemptRecord {
        int failedCount = 0;
        Instant lockedUntil = null;
    }

    /**
     * @return true dacă acest IP e blocat momentan și nu ar trebui să i se permită să încerce login.
     */
    public boolean isBlocked(String ip) {
        AttemptRecord record = attempts.get(ip);
        if (record == null || record.lockedUntil == null) {
            return false;
        }
        if (Instant.now().isAfter(record.lockedUntil)) {
            // Perioada de blocare a expirat — resetăm complet
            attempts.remove(ip);
            return false;
        }
        return true;
    }

    /**
     * Apelat după un login eșuat. Dacă numărul de eșecuri consecutive
     * depășește pragul, IP-ul e blocat pentru LOCKOUT_DURATION_MINUTES.
     */
    public void recordFailure(String ip) {
        AttemptRecord record = attempts.computeIfAbsent(ip, k -> new AttemptRecord());
        record.failedCount++;
        if (record.failedCount >= MAX_ATTEMPTS) {
            record.lockedUntil = Instant.now().plusSeconds(LOCKOUT_DURATION_MINUTES * 60);
        }
    }

    /**
     * Apelat după un login reușit — resetează contorul pentru acest IP.
     */
    public void recordSuccess(String ip) {
        attempts.remove(ip);
    }

    /**
     * Câte minute mai rămân până se poate reîncerca, pentru mesajul de eroare.
     */
    public long minutesRemaining(String ip) {
        AttemptRecord record = attempts.get(ip);
        if (record == null || record.lockedUntil == null) return 0;
        long seconds = Instant.now().until(record.lockedUntil, java.time.temporal.ChronoUnit.SECONDS);
        return Math.max(1, seconds / 60 + (seconds % 60 > 0 ? 1 : 0));
    }
}