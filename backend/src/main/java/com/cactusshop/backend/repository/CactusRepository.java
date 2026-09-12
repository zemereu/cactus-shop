package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Cactus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CactusRepository extends JpaRepository<Cactus, Long> {

    // --- Filtre publice (doar produse active) ---

    List<Cactus> findByActiveTrueAndProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String category, String name);

    List<Cactus> findByActiveTrueAndProductTypeAndMainCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String name);

    List<Cactus> findByActiveTrueAndNameContainingIgnoreCase(String name);

    // --- Filtre admin (toate produsele, inclusiv inactive) ---

    List<Cactus> findByProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String category, String name);

    List<Cactus> findByProductTypeAndMainCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String name);

    List<Cactus> findByNameContainingIgnoreCase(String name);
}