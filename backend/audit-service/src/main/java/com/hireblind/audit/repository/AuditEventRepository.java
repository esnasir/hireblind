package com.hireblind.audit.repository;

import com.hireblind.audit.entity.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
    List<AuditEvent> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
    List<AuditEvent> findByActionTypeOrderByTimestampDesc(String actionType);
    List<AuditEvent> findByActorIdOrderByTimestampDesc(String actorId);
    List<AuditEvent> findAllByOrderByTimestampDesc();
}
