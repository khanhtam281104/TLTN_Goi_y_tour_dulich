package com.tltn.tour.repository;

import com.tltn.tour.model.FavoriteTour;
import com.tltn.tour.model.User;
import com.tltn.tour.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteTourRepository extends JpaRepository<FavoriteTour, Long> {
    List<FavoriteTour> findByUser(User user);
    Optional<FavoriteTour> findByUserAndTour(User user, Tour tour);
    boolean existsByUserAndTour(User user, Tour tour);
    void deleteByUserAndTour(User user, Tour tour);

    @Query("SELECT f.tour FROM FavoriteTour f WHERE f.user.id = :userId")
    List<Tour> findFavoriteToursByUserId(@Param("userId") Long userId);

    @Query("SELECT f FROM FavoriteTour f WHERE f.user.id = :userId AND f.tour.id = :tourId")
    Optional<FavoriteTour> findByUserIdAndTourId(@Param("userId") Long userId, @Param("tourId") Long tourId);

    @Query("SELECT COUNT(f) > 0 FROM FavoriteTour f WHERE f.user.id = :userId AND f.tour.id = :tourId")
    boolean existsByUserIdAndTourId(@Param("userId") Long userId, @Param("tourId") Long tourId);
}
