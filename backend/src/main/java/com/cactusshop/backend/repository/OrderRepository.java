package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderToken(String orderToken);
    Optional<Order> findByIdempotencyKey(UUID idempotencyKey);
    List<Order> findByCustomer_IdOrderByIdDesc(Long customerId);
}