package com.hireblind.campaign.repository;

import com.hireblind.campaign.entity.Campaign;
import com.hireblind.campaign.entity.CampaignStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
    Optional<Campaign> findByPublicSlug(String publicSlug);

    List<Campaign> findByStatus(CampaignStatus status);

    List<Campaign> findByOwnerUserId(UUID ownerUserId);

    long countByStatus(CampaignStatus status);
}
