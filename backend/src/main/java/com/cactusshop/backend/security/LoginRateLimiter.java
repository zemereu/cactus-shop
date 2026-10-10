package com.cactusshop.backend.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class LoginRateLimiter {

    private static final long WINDOW = Duration.ofMinutes(15).toMillis();
    private final Map<String, Attempt> attempts = new HashMap<>();
    private final Clock clock;

    private record Attempt(int count, long expiresAt) {}

    public LoginRateLimiter() {
        this(Clock.systemUTC());
    }

    LoginRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public synchronized boolean tryAcquire(
            String scope, String identity, int limit) {
        long now = clock.millis();

        attempts.entrySet().removeIf(
                entry -> entry.getValue().expiresAt() <= now
        );

        String key = scope + ":" + identity;
        Attempt old = attempts.get(key);

        if (old != null && old.count() >= limit) {
            return false;
        }

        if (old == null && attempts.size() >= 10000) {
            return false;
        }

        attempts.put(key, new Attempt(
                old == null ? 1 : old.count() + 1,
                old == null ? now + WINDOW : old.expiresAt()
        ));

        return true;
    }
}