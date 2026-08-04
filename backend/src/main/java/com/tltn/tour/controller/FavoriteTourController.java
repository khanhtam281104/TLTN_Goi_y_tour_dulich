package com.tltn.tour.controller;

import com.tltn.tour.model.Tour;
import com.tltn.tour.service.FavoriteTourService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = "*")
public class FavoriteTourController {

    @Autowired
    private FavoriteTourService favoriteTourService;

    @PostMapping("/toggle/{tourId}")
    public ResponseEntity<?> toggleFavorite(
            @RequestHeader("Authorization") String token,
            @PathVariable Long tourId) {
        try {
            boolean status = favoriteTourService.toggleFavorite(token, tourId);
            Map<String, Object> response = new HashMap<>();
            response.put("isFavorite", status);
            response.put("message", status ? "Đã thêm vào danh sách yêu thích!" : "Đã xóa khỏi danh sách yêu thích!");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/check/{tourId}")
    public ResponseEntity<?> checkFavorite(
            @RequestHeader("Authorization") String token,
            @PathVariable Long tourId) {
        try {
            boolean isFav = favoriteTourService.isFavorite(token, tourId);
            Map<String, Object> response = new HashMap<>();
            response.put("isFavorite", isFav);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("isFavorite", false);
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping
    public ResponseEntity<?> getFavoriteTours(@RequestHeader("Authorization") String token) {
        try {
            List<Tour> favorites = favoriteTourService.getFavoriteTours(token);
            return ResponseEntity.ok(favorites);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Lỗi máy chủ: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
