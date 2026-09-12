package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Recenzii generale despre magazin, aprobate, cele mai noi primele
    List<Review> findByApprovedTrueAndCactusIdIsNullOrderByCreatedAtDesc();

    // Recenzii pentru un produs anume, aprobate
    List<Review> findByApprovedTrueAndCactusIdOrderByCreatedAtDesc(Long cactusId);

    // Recenzii care așteaptă aprobare din admin
    List<Review> findByApprovedFalseOrderByCreatedAtAsc();
}