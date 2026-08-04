package com.tltn.tour.repository;

import com.tltn.tour.model.TripExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TripExpenseRepository extends JpaRepository<TripExpense, Long> {
    List<TripExpense> findAllByTripPlanIdOrderByDateAsc(Long tripPlanId);
    void deleteAllByTripPlanId(Long tripPlanId);
}
