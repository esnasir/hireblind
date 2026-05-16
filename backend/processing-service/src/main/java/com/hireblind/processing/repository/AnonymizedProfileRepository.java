package com.hireblind.processing.repository;

import com.hireblind.processing.entity.AnonymizedProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnonymizedProfileRepository extends JpaRepository<AnonymizedProfile, UUID> {
    Optional<AnonymizedProfile> findBySubmissionId(UUID submissionId);
}
