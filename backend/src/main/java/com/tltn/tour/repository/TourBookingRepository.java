package com.tltn.tour.repository;

import com.tltn.tour.model.TourBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TourBookingRepository extends JpaRepository<TourBooking, Long> {
    List<TourBooking> findAllByUserIdOrderByBookingDateDesc(Long userId);
    List<TourBooking> findAllByOrderByBookingDateDesc();
}
