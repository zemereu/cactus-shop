package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Customer c where c.email = :email")
    Optional<Customer> findLockedByEmail(
            @org.springframework.data.repository.query.Param("email") String email);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<Customer> findByPasswordResetHash(String hash);

    boolean existsByEmail(String email);

    Optional<Customer> findByVerificationToken(String verificationToken);
}