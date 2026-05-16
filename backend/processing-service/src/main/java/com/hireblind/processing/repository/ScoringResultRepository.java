package com.hireblind.processing.repository;

import com.hireblind.processing.entity.ScoringResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScoringResultRepository extends JpaRepository<ScoringResult, UUID> {
    Optional<ScoringResult> findBySubmissionId(UUID submissionId);
}
