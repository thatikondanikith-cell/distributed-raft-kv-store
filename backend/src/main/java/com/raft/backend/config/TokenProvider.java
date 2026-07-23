package com.raft.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Lightweight HMAC-SHA256 token provider.
 * Format: base64(email:expiry):signature
 * No external JWT library required.
 */
@Component
public class TokenProvider {

    @Value("${raft.jwt.secret}")
    private String secret;

    @Value("${raft.jwt.expiry-ms}")
    private long expiryMs;

    public String generateToken(String email) {
        long expiry = System.currentTimeMillis() + expiryMs;
        String payload = Base64.getEncoder().encodeToString(
                (email + ":" + expiry).getBytes(StandardCharsets.UTF_8));
        String sig = hmac(payload);
        return payload + "." + sig;
    }

    public String validateToken(String token) {
        if (token == null || !token.contains(".")) return null;
        int dot = token.lastIndexOf('.');
        String payload = token.substring(0, dot);
        String sig = token.substring(dot + 1);
        if (!hmac(payload).equals(sig)) return null;

        try {
            String decoded = new String(Base64.getDecoder().decode(payload), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length < 2) return null;
            long expiry = Long.parseLong(parts[parts.length - 1]);
            if (System.currentTimeMillis() > expiry) return null;
            // email may contain colons – rejoin all but last segment
            StringBuilder emailBuilder = new StringBuilder();
            for (int i = 0; i < parts.length - 1; i++) {
                if (i > 0) emailBuilder.append(":");
                emailBuilder.append(parts[i]);
            }
            return emailBuilder.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        } catch (Exception e) {
            throw new RuntimeException("HMAC error", e);
        }
    }
}
