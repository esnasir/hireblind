package com.hireblind.processing.repository;

import com.hireblind.processing.entity.ProcessingAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProcessingAttemptRepository extends JpaRepository<ProcessingAttempt, UUID> {
    List<ProcessingAttempt> findBySubmissionIdOrderByAttemptNumberDesc(UUID submissionId);
}
