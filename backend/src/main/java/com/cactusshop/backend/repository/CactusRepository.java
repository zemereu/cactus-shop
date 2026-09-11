package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Cactus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CactusRepository extends JpaRepository<Cactus, Long> {

    // Filtrare completă: tip produs + categorie principală + gen + text
    List<Cactus> findByProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String category, String name);

    // Filtrare: tip produs + categorie principală + text (toate genurile, "Toți")
    List<Cactus> findByProductTypeAndMainCategoryAndNameContainingIgnoreCase(
            String productType, String mainCategory, String name);

    // Căutare generală, fără filtrare (păstrat pentru compatibilitate)
    List<Cactus> findByNameContainingIgnoreCase(String name);
}