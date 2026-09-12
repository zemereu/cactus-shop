package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Cactus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CactusRepository extends JpaRepository<Cactus, Long> {

    // --- Filtre publice cu paginare (doar produse active) ---

    Page<Cactus> findByActiveTrueAndProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String category, String name, Pageable pageable);

    Page<Cactus> findByActiveTrueAndProductTypeAndMainCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String name, Pageable pageable);

    Page<Cactus> findByActiveTrueAndNameContainingIgnoreCase(String name, Pageable pageable);

    // --- Filtre admin (toate produsele, fără paginare) ---

    List<Cactus> findByProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String category, String name);

    List<Cactus> findByProductTypeAndMainCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String name);

    List<Cactus> findByNameContainingIgnoreCase(String name);
}