package com.hireblind.processing.repository;

import com.hireblind.processing.entity.CandidateNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateNoteRepository extends JpaRepository<CandidateNote, UUID> {
    List<CandidateNote> findBySubmissionIdOrderByCreatedAtDesc(UUID submissionId);
}
