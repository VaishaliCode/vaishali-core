package com.vaishali.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Refuses to start the app in production (profile "prod") while it still uses the
 * public development defaults from application.properties. Without this, a forgotten
 * environment variable would let anyone who read the GitHub repo log in as admin.
 */
@Component
public class ProductionGuard {

    public ProductionGuard(Environment env,
                           @Value("${app.jwt.secret}") String jwtSecret,
                           @Value("${app.admin.password}") String adminPassword,
                           @Value("${app.cors.allowed-origins}") String corsOrigins,
                           @Value("${spring.datasource.url}") String dbUrl) {
        if (!env.acceptsProfiles(Profiles.of("prod"))) return;

        List<String> problems = new ArrayList<>();
        if (jwtSecret.startsWith("dev-only") || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            problems.add("JWT_SECRET must be a random value of at least 32 characters");
        }
        if ("change-me-now".equals(adminPassword) || adminPassword.length() < 12) {
            problems.add("ADMIN_PASSWORD must be set to a strong password (12+ characters)");
        }
        if (corsOrigins.contains("localhost")) {
            problems.add("CORS_ORIGINS must be the live site's address, e.g. https://your-site.vercel.app");
        }
        if (dbUrl.contains("localhost")) {
            problems.add("DB_URL must point at the production database");
        }
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Refusing to start in production: " + String.join("; ", problems));
        }
    }
}
