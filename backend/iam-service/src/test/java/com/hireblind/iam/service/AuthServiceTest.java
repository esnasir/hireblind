package com.hireblind.iam.service;

import com.hireblind.iam.dto.LoginRequest;
import com.hireblind.iam.dto.LoginResponse;
import com.hireblind.iam.entity.Role;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("admin@hireblind.com");
        testUser.setPasswordHash("hashed-password");
        testUser.setFullName("Test Admin");
        testUser.setRole(Role.ADMIN);
        testUser.setEnabled(true);
    }

    @Test
    @DisplayName("Login succeeds with valid credentials")
    void loginSuccess() {
        when(userRepository.findByEmail("admin@hireblind.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("admin123", "hashed-password")).thenReturn(true);
        when(jwtService.generateAccessToken(eq(testUser.getId()), eq("admin@hireblind.com"), eq("ADMIN"), eq(testUser.getTenant().getId())))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(eq(testUser.getId()), eq("admin@hireblind.com"), eq("ADMIN"), eq(testUser.getTenant().getId())))
                .thenReturn("refresh-token");

        LoginResponse response = authService.login(new LoginRequest("admin@hireblind.com", "admin123"));

        assertNotNull(response);
        assertEquals("access-token", response.accessToken());
        assertEquals("refresh-token", response.refreshToken());
        assertEquals("admin@hireblind.com", response.user().email());
        assertEquals("ADMIN", response.user().role());
    }

    @Test
    @DisplayName("Login fails with wrong password")
    void loginFailsWrongPassword() {
        when(userRepository.findByEmail("admin@hireblind.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () ->
                authService.login(new LoginRequest("admin@hireblind.com", "wrong-password"))
        );
    }

    @Test
    @DisplayName("Login fails with unknown email")
    void loginFailsUnknownEmail() {
        when(userRepository.findByEmail("unknown@hireblind.com")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                authService.login(new LoginRequest("unknown@hireblind.com", "password"))
        );
    }

    @Test
    @DisplayName("Login fails for disabled account")
    void loginFailsDisabledAccount() {
        testUser.setEnabled(false);
        when(userRepository.findByEmail("admin@hireblind.com")).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () ->
                authService.login(new LoginRequest("admin@hireblind.com", "admin123"))
        );
    }

    @Test
    @DisplayName("getCurrentUser returns user profile")
    void getCurrentUser() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

        var response = authService.getCurrentUser(testUser.getId().toString());

        assertEquals("admin@hireblind.com", response.email());
        assertEquals("Test Admin", response.fullName());
    }
}
