package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.ReviewRequestDTO;
import com.cactusshop.backend.dto.ReviewResponseDTO;
import com.cactusshop.backend.model.Review;
import com.cactusshop.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> submitReview(Authentication authentication, @Valid @RequestBody ReviewRequestDTO request) {
        try {
            String message = reviewService.submitReview(authentication.getName(), request);
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/general")
    public List<ReviewResponseDTO> getGeneralReviews() {
        return reviewService.getGeneralReviews();
    }

    @GetMapping("/product/{cactusId}")
    public List<ReviewResponseDTO> getProductReviews(@PathVariable Long cactusId) {
        return reviewService.getProductReviews(cactusId);
    }

    @GetMapping("/pending")
    public List<Review> getPendingReviews() {
        return reviewService.getPendingReviews();
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long id) {
        try {
            reviewService.approveReview(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
    }
}