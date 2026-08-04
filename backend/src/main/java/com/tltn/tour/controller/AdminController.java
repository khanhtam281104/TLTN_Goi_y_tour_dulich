package com.tltn.tour.controller;

import com.tltn.tour.model.SystemLog;
import com.tltn.tour.model.Tour;
import com.tltn.tour.model.User;
import com.tltn.tour.model.TourBooking;
import com.tltn.tour.repository.SystemLogRepository;
import com.tltn.tour.repository.TourRepository;
import com.tltn.tour.repository.UserRepository;
import com.tltn.tour.repository.TourBookingRepository;
import com.tltn.tour.service.UserService;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private SystemLogRepository systemLogRepository;

    @Autowired
    private TourBookingRepository tourBookingRepository;

    private User validateAdmin(String tokenHeader) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Mã xác thực Token không hợp lệ");
        }
        User user = userService.getProfile(tokenHeader);
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new SecurityException("Bạn không có quyền truy cập chức năng Admin");
        }
        return user;
    }

    private void logActivity(String action, String details, String username) {
        try {
            SystemLog log = new SystemLog();
            log.setAction(action);
            log.setDetails(details);
            log.setUsername(username);
            log.setTimestamp(LocalDateTime.now());
            systemLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to save log: " + e.getMessage());
        }
    }

    // --- SYSTEM LOGS ---
    @GetMapping("/logs")
    public ResponseEntity<?> getSystemLogs(@RequestHeader("Authorization") String token) {
        try {
            validateAdmin(token);
            List<SystemLog> logs = systemLogRepository.findAllByOrderByTimestampDesc();
            return ResponseEntity.ok(logs);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    // --- USER MANAGEMENT ---
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String token) {
        try {
            validateAdmin(token);
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            User admin = validateAdmin(token);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

            if (user.getId().equals(admin.getId())) {
                throw new IllegalArgumentException("Bạn không thể tự thay đổi quyền của chính mình");
            }

            String newRole = body.get("role");
            if (!"USER".equalsIgnoreCase(newRole) && !"ADMIN".equalsIgnoreCase(newRole)) {
                throw new IllegalArgumentException("Vai trò không hợp lệ");
            }

            user.setRole(newRole.toUpperCase());
            userRepository.save(user);

            logActivity("UPDATE_USER_ROLE", "Thay đổi quyền của user " + user.getUsername() + " thành " + user.getRole(), admin.getUsername());

            return ResponseEntity.ok(Map.of("message", "Cập nhật vai trò thành công!"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            User admin = validateAdmin(token);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

            if (user.getId().equals(admin.getId())) {
                throw new IllegalArgumentException("Bạn không thể tự xóa tài khoản của chính mình");
            }

            userRepository.delete(user);
            logActivity("DELETE_USER", "Xóa tài khoản người dùng: " + user.getUsername(), admin.getUsername());

            return ResponseEntity.ok(Map.of("message", "Xóa người dùng thành công!"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- TOUR MANAGEMENT ---
    @PostMapping("/tours")
    public ResponseEntity<?> createTour(
            @RequestHeader("Authorization") String token,
            @RequestBody Tour tour) {
        try {
            User admin = validateAdmin(token);
            if (tour.getTitle() == null || tour.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Tên tour không được để trống");
            }

            Tour saved = tourRepository.save(tour);
            logActivity("CREATE_TOUR", "Tạo mới Tour ID " + saved.getId() + ": " + saved.getTitle(), admin.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/tours/{id}")
    public ResponseEntity<?> updateTour(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody Tour tourDetails) {
        try {
            User admin = validateAdmin(token);
            Tour tour = tourRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Tour"));

            tour.setTitle(tourDetails.getTitle());
            tour.setPrice(tourDetails.getPrice());
            tour.setDuration(tourDetails.getDuration());
            tour.setLocation(tourDetails.getLocation());
            tour.setCategory(tourDetails.getCategory());
            tour.setImageUrl(tourDetails.getImageUrl());
            tour.setTourUrl(tourDetails.getTourUrl());
            tour.setTags(tourDetails.getTags());
            tour.setDescription(tourDetails.getDescription());
            tour.setDepartureDates(tourDetails.getDepartureDates());

            Tour updated = tourRepository.save(tour);
            logActivity("UPDATE_TOUR", "Cập nhật Tour ID " + updated.getId() + ": " + updated.getTitle(), admin.getUsername());

            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/tours/{id}")
    public ResponseEntity<?> deleteTour(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            User admin = validateAdmin(token);
            Tour tour = tourRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Tour"));

            tourRepository.delete(tour);
            logActivity("DELETE_TOUR", "Xóa Tour ID " + id + ": " + tour.getTitle(), admin.getUsername());

            return ResponseEntity.ok(Map.of("message", "Xóa tour thành công!"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- BOOKING MANAGEMENT (Admin) ---
    @GetMapping("/bookings")
    public ResponseEntity<?> getAllBookings(@RequestHeader("Authorization") String token) {
        try {
            validateAdmin(token);
            List<TourBooking> bookings = tourBookingRepository.findAllByOrderByBookingDateDesc();
            List<Map<String, Object>> response = new ArrayList<>();
            for (TourBooking booking : bookings) {
                Map<String, Object> item = new HashMap<>();
                item.put("booking", booking);
                item.put("tour", tourRepository.findById(booking.getTourId()).orElse(null));
                response.add(item);
            }
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            User admin = validateAdmin(token);
            TourBooking booking = tourBookingRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt tour"));

            String status = body.get("status");
            if (!"PENDING".equalsIgnoreCase(status) && !"CONFIRMED".equalsIgnoreCase(status) && !"CANCELLED".equalsIgnoreCase(status)) {
                throw new IllegalArgumentException("Trạng thái không hợp lệ");
            }

            booking.setStatus(status.toUpperCase());
            tourBookingRepository.save(booking);

            logActivity("UPDATE_BOOKING_STATUS", "Cập nhật đơn đặt tour #" + booking.getId() + " thành " + booking.getStatus(), admin.getUsername());

            return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái đơn thành công!"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
