package com.tltn.tour.repository;

import com.tltn.tour.model.ItineraryDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItineraryDayRepository extends JpaRepository<ItineraryDay, Long> {
    List<ItineraryDay> findAllByTripPlanIdOrderByDayNumberAsc(Long tripPlanId);
}
