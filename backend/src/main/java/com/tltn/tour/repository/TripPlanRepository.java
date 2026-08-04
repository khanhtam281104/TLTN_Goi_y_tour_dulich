package com.tltn.tour.repository;

import com.tltn.tour.model.TripPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TripPlanRepository extends JpaRepository<TripPlan, Long> {
    List<TripPlan> findAllByUserId(Long userId);
}
