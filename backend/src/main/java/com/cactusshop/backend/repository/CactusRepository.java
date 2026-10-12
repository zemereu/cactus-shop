package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Cactus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CactusRepository
        extends JpaRepository<Cactus, Long>, JpaSpecificationExecutor<Cactus> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cactus c where c.id in :ids order by c.id")
    List<Cactus> findAllForOrder(@Param("ids") Collection<Long> ids);

    @Modifying
    @Query("""
            UPDATE Cactus c
            SET c.stock = c.stock - :quantity,
                c.version = c.version + 1
            WHERE c.id = :id
              AND c.active = true
              AND c.stock >= :quantity
            """)
    int decrementStock(
            @Param("id") Long id,
            @Param("quantity") int quantity);

    @Modifying
    @Query("""
            UPDATE Cactus c
            SET c.stock = c.stock + :quantity,
                c.version = c.version + 1
            WHERE c.id = :id
            """)
    int restoreStock(
            @Param("id") Long id,
            @Param("quantity") int quantity);

    List<Cactus> findByActiveTrue();

    boolean existsByCategoryAndMainCategory(String category, String mainCategory);
}