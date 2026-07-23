package com.raft.backend.controller;

import com.raft.backend.config.TokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles email OTP authentication flow.
 *
 * POST /api/auth/send-otp   { "email": "user@example.com" }
 * POST /api/auth/verify-otp { "email": "user@example.com", "otp": "123456" }
 *
 * If SMTP is not configured the OTP is printed to the console so that
 * development / local testing is never blocked.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final long OTP_EXPIRY_MS = 5 * 60 * 1000L; // 5 minutes

    private final TokenProvider tokenProvider;
    private final JavaMailSender mailSender;

    // email -> [otp, expiryTimestamp]
    private final ConcurrentHashMap<String, long[]> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom rng = new SecureRandom();

    public AuthController(TokenProvider tokenProvider,
                          @Autowired(required = false) JavaMailSender mailSender) {
        this.tokenProvider = tokenProvider;
        this.mailSender    = mailSender;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || !email.matches("^[\\w.+-]+@[\\w-]+\\.[\\w.]+$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Please provide a valid email address."));
        }

        int otp = 100_000 + rng.nextInt(900_000);
        long expiry = System.currentTimeMillis() + OTP_EXPIRY_MS;
        otpStore.put(email.toLowerCase(), new long[]{ otp, expiry });

        boolean sent = trySendEmail(email, otp);
        if (!sent) {
            log.warn("[AUTH] SMTP not configured — OTP for {} is: {}", email, otp);
            System.out.printf("%n[AUTH] ============================================%n");
            System.out.printf("[AUTH] OTP for %-40s : %06d%n", email, otp);
            System.out.printf("[AUTH] ============================================%n%n");
        }

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent to " + email + (sent ? "" : " (check server console)")));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otpStr = body.get("otp");
        if (email == null || otpStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "email and otp are required."));
        }

        long[] stored = otpStore.get(email.toLowerCase());
        if (stored == null) {
            return ResponseEntity.status(401).body(Map.of("error", "No OTP found. Please request a new one."));
        }
        if (System.currentTimeMillis() > stored[1]) {
            otpStore.remove(email.toLowerCase());
            return ResponseEntity.status(401).body(Map.of("error", "OTP has expired. Please request a new one."));
        }
        try {
            if (Integer.parseInt(otpStr.trim()) != (int) stored[0]) {
                return ResponseEntity.status(401).body(Map.of("error", "Incorrect OTP. Please try again."));
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP must be a 6-digit number."));
        }

        otpStore.remove(email.toLowerCase());
        String token = tokenProvider.generateToken(email);
        log.info("[AUTH] Login successful for {}", email);
        return ResponseEntity.ok(Map.of("token", token, "email", email));
    }

    // ----------------------------------------------------------------
    private boolean trySendEmail(String to, int otp) {
        if (mailSender == null) return false;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("Raft KV Store — Your Login OTP");
            msg.setText(
                "Hello,\n\n" +
                "Your one-time password for Raft KV Store is:\n\n" +
                "  " + String.format("%06d", otp) + "\n\n" +
                "This code expires in 5 minutes. Do not share it.\n\n" +
                "— Raft KV Store"
            );
            mailSender.send(msg);
            return true;
        } catch (Exception e) {
            log.warn("[AUTH] Email send failed: {}", e.getMessage());
            return false;
        }
    }
}
