package com.tltn.tour.controller;

import com.tltn.tour.config.VNPayConfig;
import com.tltn.tour.model.TourBooking;
import com.tltn.tour.model.SystemLog;
import com.tltn.tour.repository.SystemLogRepository;
import com.tltn.tour.repository.TourBookingRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private VNPayConfig vnpayConfig;

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

    @GetMapping("/vnpay-callback")
    public ResponseEntity<?> vnpayCallback(HttpServletRequest request) {
        try {
            Map<String, String> fields = new HashMap<>();
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
                String fieldName = params.nextElement();
                String fieldValue = request.getParameter(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    fields.put(fieldName, fieldValue);
                }
            }

            String vnp_SecureHash = request.getParameter("vnp_SecureHash");
            if (fields.containsKey("vnp_SecureHashType")) {
                fields.remove("vnp_SecureHashType");
            }
            if (fields.containsKey("vnp_SecureHash")) {
                fields.remove("vnp_SecureHash");
            }

            // Sort parameters to rebuild hash data
            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            for (String fieldName : fieldNames) {
                String fieldValue = fields.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString());
                    if (hashData.length() > 0) {
                        hashData.append('&');
                    }
                    hashData.append(fieldName).append('=').append(encodedValue);
                }
            }

            String signValue = VNPayConfig.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
            if (signValue.equalsIgnoreCase(vnp_SecureHash)) {
                String bookingIdsStr = request.getParameter("vnp_TxnRef");
                String responseCode = request.getParameter("vnp_ResponseCode");

                if (bookingIdsStr == null || bookingIdsStr.trim().isEmpty()) {
                    throw new IllegalArgumentException("Không tìm thấy thông tin mã giao dịch vnp_TxnRef");
                }

                String[] idArr = bookingIdsStr.split("-");
                if ("00".equals(responseCode)) {
                    // Update status for all matching bookings
                    for (String idStr : idArr) {
                        Long bookingId = Long.parseLong(idStr.trim());
                        Optional<TourBooking> bookingOpt = tourBookingRepository.findById(bookingId);
                        if (bookingOpt.isPresent()) {
                            TourBooking booking = bookingOpt.get();
                            booking.setStatus("CONFIRMED"); // Mark as confirmed payment
                            tourBookingRepository.save(booking);
                            
                            String userStr = booking.getUserId() != null ? String.valueOf(booking.getUserId()) : "GUEST";
                            logActivity("VNPAY_PAID", "Thanh toán VNPay thành công cho đơn đặt tour #" + bookingId, userStr);
                        }
                    }
                    return ResponseEntity.ok(Map.of(
                        "status", "SUCCESS",
                        "message", "Thanh toán giao dịch VNPay cho đơn hàng [" + bookingIdsStr + "] thành công!"
                    ));
                } else {
                    return ResponseEntity.ok(Map.of(
                        "status", "FAILED",
                        "message", "Giao dịch VNPay thất bại hoặc bị hủy bỏ. Mã phản hồi: " + responseCode
                    ));
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "INVALID_SIGNATURE",
                    "message", "Chữ ký bảo mật VNPay không chính xác hoặc dữ liệu bị thay đổi."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "Có lỗi xảy ra: " + e.getMessage()
            ));
        }
    }
}
