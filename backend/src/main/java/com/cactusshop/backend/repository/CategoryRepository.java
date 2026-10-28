package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameAndMainCategory(String name, String mainCategory);

    @Lock(LockModeType.PESSIMISTIC_READ)
    Optional<Category> findByNameAndMainCategory(String name, String mainCategory);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Category c where c.id = :id")
    Optional<Category> findLockedById(@Param("id") Long id);

    List<Category> findByMainCategory(String mainCategory);
}