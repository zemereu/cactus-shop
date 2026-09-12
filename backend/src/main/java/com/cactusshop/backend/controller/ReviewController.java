package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.ReviewRequestDTO;
import com.cactusshop.backend.dto.ReviewResponseDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.model.Review;
import com.cactusshop.backend.repository.CustomerRepository;
import com.cactusshop.backend.repository.ReviewRepository;
import com.cactusshop.backend.repository.CactusRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CactusRepository cactusRepository;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    // Doar clienți autentificați pot trimite o recenzie. Identitatea vine
    // din token (Authentication), nu dintr-un câmp trimis de client —
    // altfel oricine ar putea posta "în numele" altcuiva.
    @PostMapping
    public ResponseEntity<?> submitReview(Authentication authentication, @Valid @RequestBody ReviewRequestDTO request) {
        String email = authentication.getName();
        Customer customer = customerRepository.findByEmail(email).orElse(null);

        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cont inexistent.");
        }

        // Verifică dacă produsul există (dacă e recenzie de produs)
        if (request.cactusId() != null && !cactusRepository.existsById(request.cactusId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Produsul nu exista.");
        }

        // Verifică dacă clientul a lăsat deja o recenzie
        if (reviewRepository.existsByCustomerEmailAndCactusId(email, request.cactusId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Ai lasat deja o recenzie.");
        }

        Review review = new Review();
        review.setCustomerEmail(email);
        review.setCustomerName(customer.getName());
        review.setCactusId(request.cactusId());
        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        review.setApproved(false); // așteaptă aprobare din admin

        reviewRepository.save(review);
        return ResponseEntity.ok("Recenzia a fost trimisă și va apărea după aprobare.");
    }

    // Recenzii generale, publice, doar cele aprobate
    @GetMapping("/general")
    public List<ReviewResponseDTO> getGeneralReviews() {
        return reviewRepository.findByApprovedTrueAndCactusIdIsNullOrderByCreatedAtDesc()
                .stream().map(this::toResponseDTO).toList();
    }

    // Recenzii pentru un produs anume, publice, doar cele aprobate
    @GetMapping("/product/{cactusId}")
    public List<ReviewResponseDTO> getProductReviews(@PathVariable Long cactusId) {
        return reviewRepository.findByApprovedTrueAndCactusIdOrderByCreatedAtDesc(cactusId)
                .stream().map(this::toResponseDTO).toList();
    }

    // --- Admin: moderare ---

    @GetMapping("/pending")
    public List<Review> getPendingReviews() {
        return reviewRepository.findByApprovedFalseOrderByCreatedAtAsc();
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Recenzia nu a fost găsită.");
        }
        review.setApproved(true);
        reviewRepository.save(review);
        return ResponseEntity.ok().build();
    }

    // Folosit atât pentru respingerea unei recenzii în așteptare,
    // cât și pentru ștergerea uneia deja publicate, dacă e cazul.
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewRepository.deleteById(id);
    }

    private ReviewResponseDTO toResponseDTO(Review r) {
        return new ReviewResponseDTO(
                r.getId(), r.getCustomerName(), r.getRating(), r.getComment(),
                r.getCreatedAt().format(DATE_FORMAT));
    }
}