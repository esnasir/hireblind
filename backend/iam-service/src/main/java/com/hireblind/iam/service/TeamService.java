package com.hireblind.iam.service;

import com.hireblind.iam.dto.AcceptInvitationRequest;
import com.hireblind.iam.dto.InvitationRequest;
import com.hireblind.iam.entity.Role;
import com.hireblind.iam.entity.Tenant;
import com.hireblind.iam.entity.User;
import com.hireblind.iam.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class TeamService {

    private static final Logger log = LoggerFactory.getLogger(TeamService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public TeamService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public void inviteMember(UUID inviterId, InvitationRequest request) {
        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new IllegalArgumentException("Inviter not found"));

        if (inviter.getRole() != Role.OWNER && inviter.getRole() != Role.ADMIN) {
            throw new SecurityException("Only owners and admins can invite members");
        }

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        User invitee = new User();
        invitee.setEmail(request.email());
        invitee.setFullName(request.fullName());
        invitee.setRole(Role.valueOf(request.role().toUpperCase()));
        invitee.setPasswordHash("INVITED_NO_PASSWORD"); // Temporary
        invitee.setTenant(inviter.getTenant());
        invitee.setInvitedBy(inviter);
        invitee.setStatus("INVITED");

        userRepository.save(invitee);

        log.info("User {} invited member {} as {}", inviter.getEmail(), invitee.getEmail(), invitee.getRole());
        
        // In a real scenario, we generate an invitation token and send an email
        // String token = jwtService.generateAccessToken(invitee.getId(), invitee.getEmail(), invitee.getRole().name(), inviter.getTenant().getId());
        // TODO: Send email
    }

    public void acceptInvitation(AcceptInvitationRequest request) {
        Claims claims = jwtService.validateToken(request.token());
        if (!"invitation".equals(claims.get("type"))) {
            throw new IllegalArgumentException("Invalid token type");
        }

        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!"INVITED".equals(user.getStatus())) {
            throw new IllegalArgumentException("Invitation already accepted or invalid");
        }

        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus("ACTIVE");
        userRepository.save(user);

        log.info("User {} successfully accepted their invitation", user.getEmail());
    }

    public java.util.List<com.hireblind.iam.dto.TeamMemberDto> getTeamMembers(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return userRepository.findByTenantId(user.getTenant().getId()).stream()
                .map(u -> new com.hireblind.iam.dto.TeamMemberDto(
                        u.getId(),
                        u.getEmail(),
                        u.getFullName(),
                        u.getRole().name(),
                        u.getStatus(),
                        u.getCreatedAt()
                ))
                .toList();
    }
}
