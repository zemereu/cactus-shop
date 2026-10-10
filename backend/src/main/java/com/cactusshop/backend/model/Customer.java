package com.cactusshop.backend.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String passwordHash;
    private String address;
    private boolean verified = false;

    @Column(unique = true)
    private String verificationToken = UUID.randomUUID().toString();

    private java.time.Instant verificationExpiresAt;
    private java.time.Instant emailVerifiedAt;

    public Customer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public boolean isVerified() {
        return verified && emailVerifiedAt != null;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public void markEmailVerified() {
        verified = true;
        emailVerifiedAt = java.time.Instant.now();
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }

    public java.time.Instant getVerificationExpiresAt() {
        return verificationExpiresAt;
    }

    public void setVerificationExpiresAt(java.time.Instant value) {
        verificationExpiresAt = value;
    }
}