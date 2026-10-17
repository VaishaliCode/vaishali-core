package com.vaishali.core.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final long expiryHours;

    public TokenService(JwtEncoder encoder, @Value("${app.jwt.expiry-hours}") long expiryHours) {
        this.encoder = encoder;
        this.expiryHours = expiryHours;
    }

    public String generate(String username) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("vaishali-core")
                .issuedAt(now)
                .expiresAt(now.plus(expiryHours, ChronoUnit.HOURS))
                .subject(username)
                .claim("scope", "ADMIN")
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long expirySeconds() {
        return expiryHours * 3600;
    }
}