package com.tltn.tour.service;

import com.tltn.tour.model.Tour;
import java.util.List;
import java.util.Map;

public interface TourService {
    List<Tour> getAllTours(String keyword, String category, String location, Long maxPrice);
    List<String> getUniqueLocations();
    List<Tour> getRecommendations(int limit);
    List<Tour> getPersonalizedRecommendations(String token, int limit);
    void seedDatabase();
    Map<String, Object> syncTours(List<Tour> tours);
    Tour getTourById(Long id);
}

