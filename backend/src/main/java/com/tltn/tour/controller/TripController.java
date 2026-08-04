package com.tltn.tour.controller;

import com.tltn.tour.model.ItineraryDay;
import com.tltn.tour.model.TripExpense;
import com.tltn.tour.model.TripPlan;
import com.tltn.tour.model.User;
import com.tltn.tour.repository.TripExpenseRepository;
import com.tltn.tour.repository.TripPlanRepository;
import com.tltn.tour.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    @Autowired
    private UserService userService;

    @Autowired
    private TripPlanRepository tripPlanRepository;

    @Autowired
    private TripExpenseRepository tripExpenseRepository;

    private User validateUser(String tokenHeader) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Mã xác thực Token không hợp lệ");
        }
        return userService.getProfile(tokenHeader);
    }

    @GetMapping
    public ResponseEntity<?> getMyTrips(@RequestHeader("Authorization") String token) {
        try {
            User user = validateUser(token);
            List<TripPlan> trips = tripPlanRepository.findAllByUserId(user.getId());
            return ResponseEntity.ok(trips);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createTrip(
            @RequestHeader("Authorization") String token,
            @RequestBody TripPlan tripPlan) {
        try {
            User user = validateUser(token);
            tripPlan.setUserId(user.getId());
            
            // Set bidirectional fields or ensure parent relationship is set if needed
            if (tripPlan.getItineraryDays() != null) {
                for (ItineraryDay day : tripPlan.getItineraryDays()) {
                    day.setTripPlanId(tripPlan.getId());
                }
            } else {
                tripPlan.setItineraryDays(new ArrayList<>());
            }

            TripPlan saved = tripPlanRepository.save(tripPlan);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTripDetails(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            User user = validateUser(token);
            TripPlan trip = tripPlanRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến đi"));

            if (!trip.getUserId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền truy cập thông tin này"));
            }

            List<TripExpense> expenses = tripExpenseRepository.findAllByTripPlanIdOrderByDateAsc(id);

            Map<String, Object> response = new HashMap<>();
            response.put("tripPlan", trip);
            response.put("expenses", expenses);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrip(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody TripPlan details) {
        try {
            User user = validateUser(token);
            TripPlan trip = tripPlanRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến đi"));

            if (!trip.getUserId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền chỉnh sửa thông tin này"));
            }

            trip.setTitle(details.getTitle());
            trip.setDestination(details.getDestination());
            trip.setStartDate(details.getStartDate());
            trip.setEndDate(details.getEndDate());

            // Clear old itinerary days and insert new ones
            trip.getItineraryDays().clear();
            if (details.getItineraryDays() != null) {
                for (ItineraryDay day : details.getItineraryDays()) {
                    day.setTripPlanId(trip.getId());
                    trip.getItineraryDays().add(day);
                }
            }

            TripPlan updated = tripPlanRepository.save(trip);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTrip(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            User user = validateUser(token);
            TripPlan trip = tripPlanRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến đi"));

            if (!trip.getUserId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền xóa chuyến đi này"));
            }

            // Delete associated expenses
            tripExpenseRepository.deleteAllByTripPlanId(id);

            // Delete trip plan (Cascade will delete itinerary days)
            tripPlanRepository.delete(trip);

            return ResponseEntity.ok(Map.of("message", "Xóa kế hoạch chuyến đi thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- EXPENSE MANAGEMENT ---

    @PostMapping("/{id}/expenses")
    public ResponseEntity<?> addExpense(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody TripExpense expense) {
        try {
            User user = validateUser(token);
            TripPlan trip = tripPlanRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến đi"));

            if (!trip.getUserId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền thêm chi phí cho chuyến đi này"));
            }

            expense.setTripPlanId(id);
            TripExpense saved = tripExpenseRepository.save(expense);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/expenses/{expenseId}")
    public ResponseEntity<?> deleteExpense(
            @RequestHeader("Authorization") String token,
            @PathVariable Long expenseId) {
        try {
            User user = validateUser(token);
            TripExpense expense = tripExpenseRepository.findById(expenseId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoản chi tiêu"));

            TripPlan trip = tripPlanRepository.findById(expense.getTripPlanId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến đi liên quan"));

            if (!trip.getUserId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền xóa chi phí này"));
            }

            tripExpenseRepository.delete(expense);
            return ResponseEntity.ok(Map.of("message", "Xóa khoản chi tiêu thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
