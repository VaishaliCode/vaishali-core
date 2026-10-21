package com.vaishali.core.auth;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Slows down password guessing on /api/auth/login.
 * - 5 failed attempts from one IP address within 15 minutes → that IP must wait.
 * - 30 failed attempts in total within 15 minutes → every login waits (stops guessing spread over many IPs).
 * A successful login clears that IP's record. Kept in memory: a restart resets it.
 */
@Component
public class LoginThrottle {

    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_PER_IP = 5;
    private static final int MAX_TOTAL = 30;
    private static final String TOTAL = "*";

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    /** Throws TooManyAttemptsException if this IP (or everyone) has failed too often recently. */
    public void check(String ip) {
        if (recent(TOTAL) >= MAX_TOTAL || recent(ip) >= MAX_PER_IP) {
            throw new TooManyAttemptsException();
        }
    }

    public void recordFailure(String ip) {
        add(ip);
        add(TOTAL);
    }

    public void recordSuccess(String ip) {
        failures.remove(ip);
    }

    private int recent(String key) {
        Deque<Instant> times = failures.get(key);
        if (times == null) return 0;
        synchronized (times) {
            prune(times);
            if (times.isEmpty()) failures.remove(key, times);
            return times.size();
        }
    }

    private void add(String key) {
        Deque<Instant> times = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (times) {
            prune(times);
            times.addLast(Instant.now());
        }
    }

    private static void prune(Deque<Instant> times) {
        Instant cutoff = Instant.now().minus(WINDOW);
        while (!times.isEmpty() && times.peekFirst().isBefore(cutoff)) times.pollFirst();
    }

    public static class TooManyAttemptsException extends RuntimeException {
        public TooManyAttemptsException() {
            super("Too many failed login attempts. Try again in 15 minutes.");
        }
    }
}
