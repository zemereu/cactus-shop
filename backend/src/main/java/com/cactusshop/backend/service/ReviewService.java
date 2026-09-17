package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.ReviewRequestDTO;
import com.cactusshop.backend.dto.ReviewResponseDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.model.Review;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.CustomerRepository;
import com.cactusshop.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CactusRepository cactusRepository;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    public String submitReview(String email, ReviewRequestDTO request) {
        Customer customer = customerRepository.findByEmail(email).orElse(null);
        if (customer == null) {
            throw new IllegalArgumentException("Cont inexistent.");
        }

        if (request.cactusId() != null && !cactusRepository.existsById(request.cactusId())) {
            throw new IllegalArgumentException("Produsul nu exista.");
        }

        if (reviewRepository.existsByCustomerEmailAndCactusId(email, request.cactusId())) {
            throw new IllegalStateException("Ai lasat deja o recenzie.");
        }

        Review review = new Review();
        review.setCustomerEmail(email);
        review.setCustomerName(customer.getName());
        review.setCactusId(request.cactusId());
        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        review.setApproved(false);

        reviewRepository.save(review);
        return "Recenzia a fost trimisa si va aparea dupa aprobare.";
    }

    public List<ReviewResponseDTO> getGeneralReviews() {
        return reviewRepository.findByApprovedTrueAndCactusIdIsNullOrderByCreatedAtDesc()
                .stream().map(this::toResponseDTO).toList();
    }

    public List<ReviewResponseDTO> getProductReviews(Long cactusId) {
        return reviewRepository.findByApprovedTrueAndCactusIdOrderByCreatedAtDesc(cactusId)
                .stream().map(this::toResponseDTO).toList();
    }

    public List<Review> getPendingReviews() {
        return reviewRepository.findByApprovedFalseOrderByCreatedAtAsc();
    }

    public void approveReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recenzia nu a fost gasita."));
        review.setApproved(true);
        reviewRepository.save(review);
    }

    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }

    private ReviewResponseDTO toResponseDTO(Review r) {
        return new ReviewResponseDTO(
                r.getId(), r.getCustomerName(), r.getRating(), r.getComment(),
                r.getCreatedAt().format(DATE_FORMAT));
    }
}