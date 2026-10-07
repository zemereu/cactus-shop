package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameAndMainCategory(String name, String mainCategory);

    List<Category> findByMainCategory(String mainCategory);
}