package com.tltn.tour.controller;

import com.tltn.tour.model.Tour;
import com.tltn.tour.service.TourService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tours")
@CrossOrigin(origins = "*") // Allow requests from all origins (CORS)
public class TourController {

    @Autowired
    private TourService tourService;

    @GetMapping
    public ResponseEntity<List<Tour>> getTours(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long maxPrice) {
        
        List<Tour> tours = tourService.getAllTours(keyword, category, location, maxPrice);
        return ResponseEntity.ok(tours);
    }

    @GetMapping("/locations")
    public ResponseEntity<List<String>> getLocations() {
        List<String> locations = tourService.getUniqueLocations();
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<Tour>> getRecommendations(
            @RequestParam(defaultValue = "6") int limit,
            @RequestHeader(value = "Authorization", required = false) String token) {
        List<Tour> recommendations = tourService.getPersonalizedRecommendations(token, limit);
        return ResponseEntity.ok(recommendations);
    }

    @PostMapping("/sync")
    public ResponseEntity<?> syncTours(@RequestBody List<Tour> tours) {
        return ResponseEntity.ok(tourService.syncTours(tours));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tour> getTourById(@PathVariable Long id) {
        Tour tour = tourService.getTourById(id);
        if (tour == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tour);
    }
}

