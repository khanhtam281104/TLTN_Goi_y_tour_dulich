package com.tltn.tour.repository;

import com.tltn.tour.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    Optional<UserSession> findByToken(String token);
    void deleteByToken(String token);
    void deleteByUserId(Long userId);
}
