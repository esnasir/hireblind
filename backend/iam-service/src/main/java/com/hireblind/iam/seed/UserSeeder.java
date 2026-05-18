package com.hireblind.iam.seed;

import com.hireblind.iam.entity.Role;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Seeds the database with an admin and a recruiter user on first startup.
 * Uses hardcoded UUIDs so that other services can reference these users.
 */
@Component
public class UserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);

    // Hardcoded user IDs — shared across services
    public static final UUID ADMIN_USER_ID = UUID.fromString("d4e5f6a7-b8c9-0123-defa-234567890123");
    public static final UUID RECRUITER_USER_ID = UUID.fromString("e5f6a7b8-c9d0-1234-efab-345678901234");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${seed.admin.email:admin@hireblind.local}")
    private String adminEmail;

    @Value("${seed.admin.password:}")
    private String adminPassword;

    @Value("${seed.recruiter.email:recruiter@hireblind.local}")
    private String recruiterEmail;

    @Value("${seed.recruiter.password:}")
    private String recruiterPassword;

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!adminPassword.isBlank()) {
            seedUser(ADMIN_USER_ID, adminEmail, adminPassword, "System Admin", Role.ADMIN);
        } else {
            log.warn("Seed admin password is empty, skipping admin seed.");
        }
        
        if (!recruiterPassword.isBlank()) {
            seedUser(RECRUITER_USER_ID, recruiterEmail, recruiterPassword, "Jane Recruiter", Role.RECRUITER);
        } else {
            log.warn("Seed recruiter password is empty, skipping recruiter seed.");
        }
    }

    private void seedUser(UUID id, String email, String rawPassword, String fullName, Role role) {
        if (userRepository.existsByEmail(email)) {
            log.info("User already exists: {} — skipping seed", email);
            return;
        }

        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setFullName(fullName);
        user.setRole(role);
        user.setEnabled(true);

        userRepository.save(user);
        log.info("Seeded user: {} (role: {})", email, role);
    }
}
