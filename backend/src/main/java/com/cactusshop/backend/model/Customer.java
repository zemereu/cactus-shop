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
    @Column(length = 100)
    private String firstName;
    @Column(length = 100)
    private String lastName;
    @Column(length = 30)
    private String phone;
    @Column(length = 4)
    private String salutation;

    public String getFirstName() { return firstName == null ? (name == null ? "" : name) : firstName; }
    public String getLastName() { return lastName == null ? "" : lastName; }
    public String getPhone() { return phone == null ? "" : phone; }
    public String getSalutation() { return salutation == null ? "" : salutation; }
    public void setPhone(String value) { phone = value; }
    public void setSalutation(String value) { salutation = value; }
    public void setPersonalName(String first, String last) {
        firstName = first.trim();
        lastName = last.trim();
        name = firstName + " " + lastName;
    }

    @Column(unique = true)
    private String email;

    private String passwordHash;
    private String address;

    private boolean verified = false;

    @Column(unique = true)
    private String verificationToken = UUID.randomUUID().toString();

    private java.time.Instant verificationExpiresAt;
    private java.time.Instant emailVerifiedAt;

    public java.time.Instant getVerificationExpiresAt() {
        return verificationExpiresAt;
    }

    public void setVerificationExpiresAt(java.time.Instant value) {
        verificationExpiresAt = value;
    }

    public void markEmailVerified() {
        verified = true;
        emailVerifiedAt = java.time.Instant.now();
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(unique = true, length = 64)
    private String passwordResetHash;

    private java.time.Instant passwordResetExpiresAt;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long sessionVersion;

    public String getPasswordResetHash() {
        return passwordResetHash;
    }

    public void setPasswordResetHash(String value) {
        passwordResetHash = value;
    }

    public java.time.Instant getPasswordResetExpiresAt() {
        return passwordResetExpiresAt;
    }

    public void setPasswordResetExpiresAt(java.time.Instant value) {
        passwordResetExpiresAt = value;
    }

    public long getSessionVersion() {
        return sessionVersion;
    }

    public void invalidateSessions() {
        sessionVersion++;
    }

    public Customer() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isVerified() {
        return verified && emailVerifiedAt != null;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }
}