package com.tltn.tour.controller;

import com.tltn.tour.dto.AuthDTOs;
import com.tltn.tour.model.User;
import com.tltn.tour.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthDTOs.RegisterRequest request) {
        try {
            User user = userService.register(request);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đăng ký tài khoản thành công!");
            response.put("username", user.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Đăng ký thất bại: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDTOs.LoginRequest request) {
        try {
            AuthDTOs.LoginResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Đăng nhập thất bại: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            userService.logout(token);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đăng xuất thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Lỗi khi đăng xuất: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> payload) {
        try {
            String credential = payload.get("credential");
            if (credential == null || credential.trim().isEmpty()) {
                throw new IllegalArgumentException("Credential không hợp lệ");
            }

            // Decode Google ID Token (JWT) payload
            String[] parts = credential.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Token Google không hợp lệ");
            }
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
            
            // Extract fields from JSON
            String email = extractJsonField(payloadJson, "email");
            String name = extractJsonField(payloadJson, "name");
            String sub = extractJsonField(payloadJson, "sub");

            if (email == null || email.trim().isEmpty()) {
                throw new IllegalArgumentException("Không thể trích xuất email từ token Google");
            }

            // Call userService to authenticate or register the Google user
            AuthDTOs.LoginResponse response = userService.loginWithGoogle(email, name, sub);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Đăng nhập Google thất bại: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    private String extractJsonField(String json, String field) {
        String pattern = "\"" + field + "\"\\s*:\\s*\"([^\"]+)\"";
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
        java.util.regex.Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }
}
