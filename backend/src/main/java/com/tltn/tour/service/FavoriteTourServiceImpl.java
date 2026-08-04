package com.tltn.tour.service;

import com.tltn.tour.model.FavoriteTour;
import com.tltn.tour.model.Tour;
import com.tltn.tour.model.User;
import com.tltn.tour.repository.FavoriteTourRepository;
import com.tltn.tour.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FavoriteTourServiceImpl implements FavoriteTourService {

    @Autowired
    private FavoriteTourRepository favoriteTourRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserService userService;

    @Override
    public boolean toggleFavorite(String token, Long tourId) {
        User user = userService.getProfile(token);
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tour du lịch với ID: " + tourId));

        Optional<FavoriteTour> existing = favoriteTourRepository.findByUserIdAndTourId(user.getId(), tourId);
        if (existing.isPresent()) {
            favoriteTourRepository.delete(existing.get());
            return false; // Removed from favorites
        } else {
            FavoriteTour favoriteTour = new FavoriteTour();
            favoriteTour.setUser(user);
            favoriteTour.setTour(tour);
            favoriteTourRepository.save(favoriteTour);
            return true; // Added to favorites
        }
    }

    @Override
    public boolean isFavorite(String token, Long tourId) {
        try {
            User user = userService.getProfile(token);
            return favoriteTourRepository.existsByUserIdAndTourId(user.getId(), tourId);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<Tour> getFavoriteTours(String token) {
        User user = userService.getProfile(token);
        return favoriteTourRepository.findFavoriteToursByUserId(user.getId());
    }
}
