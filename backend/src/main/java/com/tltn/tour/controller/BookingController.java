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

import com.tltn.tour.config.VNPayConfig;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

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

    @Autowired
    private VNPayConfig vnpayConfig;

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

    @GetMapping("/vnpay-url")
    public ResponseEntity<?> getVNPayUrl(
            @RequestParam("bookingIds") String bookingIdsStr,
            HttpServletRequest request) {
        try {
            if (bookingIdsStr == null || bookingIdsStr.trim().isEmpty()) {
                throw new IllegalArgumentException("Mã đơn đặt tour không hợp lệ");
            }

            String[] idArr = bookingIdsStr.split("-");
            long totalAmount = 0;

            for (String idStr : idArr) {
                Long bookingId = Long.parseLong(idStr.trim());
                Optional<TourBooking> bookingOpt = tourBookingRepository.findById(bookingId);
                if (bookingOpt.isEmpty()) {
                    throw new IllegalArgumentException("Không tìm thấy đơn đặt tour mã #" + bookingId);
                }
                TourBooking booking = bookingOpt.get();
                Tour tour = tourService.getTourById(booking.getTourId());
                if (tour == null) {
                    throw new IllegalArgumentException("Tour của đơn hàng #" + bookingId + " không tồn tại");
                }
                totalAmount += tour.getPrice() * booking.getNumberOfGuests();
            }

            if (totalAmount <= 0) {
                throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0 đ");
            }

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", "2.1.0");
            vnp_Params.put("vnp_Command", "pay");
            vnp_Params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
            vnp_Params.put("vnp_Amount", String.valueOf(totalAmount * 100)); // VNPay uses cents (multiplied by 100)
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", bookingIdsStr);
            vnp_Params.put("vnp_OrderInfo", "Thanh toan don dat tour " + bookingIdsStr);
            vnp_Params.put("vnp_OrderType", "other");
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
            vnp_Params.put("vnp_IpAddr", VNPayConfig.getIpAddress(request));

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            for (String fieldName : fieldNames) {
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    String encodedName = URLEncoder.encode(fieldName, StandardCharsets.UTF_8.toString());
                    String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString());

                    if (hashData.length() > 0) {
                        hashData.append('&');
                    }
                    hashData.append(fieldName).append('=').append(encodedValue);

                    if (query.length() > 0) {
                        query.append('&');
                    }
                    query.append(encodedName).append('=').append(encodedValue);
                }
            }
            String queryUrl = query.toString();
            String vnp_SecureHash = VNPayConfig.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
            String paymentUrl = vnpayConfig.getVnpUrl() + "?" + queryUrl + "&vnp_SecureHash=" + vnp_SecureHash;

            return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
