package com.tltn.tour.controller;

import com.tltn.tour.model.Feedback;
import com.tltn.tour.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedbacks")
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @PostMapping
    public ResponseEntity<?> createFeedback(@RequestBody Feedback feedback) {
        try {
            if (feedback.getFullName() == null || feedback.getFullName().trim().isEmpty() ||
                feedback.getContent() == null || feedback.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ Họ tên và Nội dung góp ý."));
            }
            feedback.setCreatedAt(LocalDateTime.now());
            Feedback saved = feedbackRepository.save(feedback);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllFeedbacks() {
        try {
            List<Feedback> feedbacks = feedbackRepository.findAllByOrderByCreatedAtDesc();
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
