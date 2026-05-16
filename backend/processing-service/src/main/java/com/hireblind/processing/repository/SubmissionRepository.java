package com.hireblind.processing.repository;

import com.hireblind.processing.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    List<Submission> findByCampaignIdOrderByReceivedAtDesc(UUID campaignId);
    long countByCampaignId(UUID campaignId);
    long countByProcessingStatus(com.hireblind.processing.entity.ProcessingStatus status);
}
