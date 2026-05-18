package com.hireblind.processing.repository;

import com.hireblind.processing.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    List<Submission> findByCampaignIdOrderByReceivedAtDesc(UUID campaignId);
    List<Submission> findByCampaignIdIsNull();
    long countByCampaignId(UUID campaignId);
    long countByProcessingStatus(com.hireblind.processing.entity.ProcessingStatus status);

    @Query("SELECT s FROM Submission s LEFT JOIN ScoringResult sr ON s.currentScoreId = sr.id " +
           "WHERE s.campaignId = :campaignId " +
           "ORDER BY COALESCE(sr.scoreValue, 0) DESC, s.receivedAt DESC")
    List<Submission> findByCampaignIdOrderByMatchScoreDesc(@Param("campaignId") UUID campaignId);
}
