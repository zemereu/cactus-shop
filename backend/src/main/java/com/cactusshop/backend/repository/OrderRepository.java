package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findLockedById(@Param("id") Long id);

    @Query("""
            select count(o) > 0
            from Order o join o.quantities q
            where o.customer.id = :customerId
              and key(q) = :cactusId
              and o.status in ('Plătită - în pregătire', 'Expediată', 'Livrată')
            """)
    boolean hasPurchased(
            @Param("customerId") Long customerId,
            @Param("cactusId") Long cactusId);

    Optional<Order> findByOrderToken(String orderToken);

    Optional<Order> findByIdempotencyKey(UUID idempotencyKey);

    List<Order> findByCustomer_IdOrderByIdDesc(Long customerId);
}