package com.tltn.tour.service;

import com.tltn.tour.model.Tour;
import java.util.List;

public interface FavoriteTourService {
    boolean toggleFavorite(String token, Long tourId);
    boolean isFavorite(String token, Long tourId);
    List<Tour> getFavoriteTours(String token);
}
