package com.tltn.tour.controller;

import com.tltn.tour.model.SystemLog;
import com.tltn.tour.model.Tour;
import com.tltn.tour.model.TourBooking;
import com.tltn.tour.model.User;
import com.tltn.tour.repository.SystemLogRepository;
import com.tltn.tour.repository.TourBookingRepository;
import com.tltn.tour.repository.TourRepository;
import com.tltn.tour.service.UserService;
import com.tltn.tour.service.TourService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private UserService userService;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private TourService tourService;

    @Autowired
    private TourBookingRepository tourBookingRepository;

    @Autowired
    private SystemLogRepository systemLogRepository;

    private void logActivity(String action, String details, String username) {
        try {
            SystemLog log = new SystemLog();
            log.setAction(action);
            log.setDetails(details);
            log.setUsername(username);
            log.setTimestamp(LocalDateTime.now());
            systemLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to log: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody TourBooking booking) {
        try {
            if (booking.getTourId() == null) {
                throw new IllegalArgumentException("Không tìm thấy thông tin Tour");
            }
            Tour tour = tourService.getTourById(booking.getTourId());
            if (tour == null) {
                throw new IllegalArgumentException("Tour du lịch không tồn tại");
            }

            if (token != null && token.startsWith("Bearer ")) {
                try {
                    User user = userService.getProfile(token);
                    booking.setUserId(user.getId());
                } catch (Exception e) {
                    // Token is invalid/expired, treat as guest booking
                }
            }

            booking.setBookingDate(LocalDateTime.now());
            booking.setStatus("PENDING");

            TourBooking saved = tourBookingRepository.save(booking);
            
            String username = booking.getUserId() != null ? String.valueOf(booking.getUserId()) : "GUEST";
            logActivity("CREATE_BOOKING", "Đặt Tour thành công. Mã đơn: " + saved.getId() + ", Tour: " + tour.getTitle(), username);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(@RequestHeader("Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Token không hợp lệ");
            }
            User user = userService.getProfile(token);
            List<TourBooking> bookings = tourBookingRepository.findAllByUserIdOrderByBookingDateDesc(user.getId());
            
            List<Map<String, Object>> response = new ArrayList<>();
            for (TourBooking booking : bookings) {
                Map<String, Object> item = new HashMap<>();
                item.put("booking", booking);
                item.put("tour", tourService.getTourById(booking.getTourId()));
                response.add(item);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
}
