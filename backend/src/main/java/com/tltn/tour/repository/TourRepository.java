package com.tltn.tour.repository;

import com.tltn.tour.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TourRepository extends JpaRepository<Tour, Long> {

    Optional<Tour> findByTourUrl(String tourUrl);

    @Query("SELECT t FROM Tour t WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR LOWER(REPLACE(t.title, ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%')) OR LOWER(REPLACE(t.location, ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%'))) AND " +
            "(:category IS NULL OR :category = '' OR t.category = :category) AND " +
            "(:location IS NULL OR :location = '' OR t.location = :location) AND " +
            "(:maxPrice IS NULL OR t.price <= :maxPrice)")
    List<Tour> findToursFiltered(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("location") String location,
            @Param("maxPrice") Long maxPrice);

    @Query("SELECT DISTINCT t.location FROM Tour t WHERE t.location IS NOT NULL AND t.location != 'Khác' ORDER BY t.location ASC")
    List<String> findUniqueLocations();
}
