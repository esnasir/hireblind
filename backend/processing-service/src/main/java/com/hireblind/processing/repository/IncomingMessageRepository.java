package com.hireblind.processing.repository;

import com.hireblind.processing.entity.IncomingMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface IncomingMessageRepository extends JpaRepository<IncomingMessage, UUID> {
    Optional<IncomingMessage> findBySourceMessageId(String sourceMessageId);
}
