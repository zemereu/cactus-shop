package com.cactusshop.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_review_approved", columnList = "approved"),
        @Index(name = "idx_review_cactus", columnList = "cactusId")
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Identitatea reală a autorului — vine din JWT, nu din ce trimite clientul,
    // ca nimeni să nu poată posta o recenzie "în numele" altcuiva.
    private String customerEmail;

    // Numele afișat public lângă recenzie (copiat din contul clientului la creare)
    private String customerName;

    // null = recenzie generală despre magazin; altfel = recenzie pentru un produs anume
    private Long cactusId;

    private int rating; // 1-5

    @Column(length = 1000)
    private String comment;

    // Recenzia nu e vizibilă public până nu e aprobată din admin
    private boolean approved = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Review() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Long getCactusId() { return cactusId; }
    public void setCactusId(Long cactusId) { this.cactusId = cactusId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}