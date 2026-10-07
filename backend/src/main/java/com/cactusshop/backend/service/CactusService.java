package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.CactusRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CactusService {

    @Autowired
    private CactusRepository cactusRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private void validateCategory(CactusRequestDTO request) {
        if (!categoryRepository.existsByNameAndMainCategory(
                request.category().trim(),
                request.mainCategory().trim())) {

            throw new IllegalArgumentException(
                    "Genul nu există în categoria principală selectată.");
        }
    }

    public Optional<Cactus> getActiveById(Long id) {
        return cactusRepository.findById(id).filter(Cactus::isActive);
    }

    public Page<Cactus> getActiveCacti(
            String productType,
            String mainCategory,
            String category,
            String search,
            java.math.BigDecimal priceMin,
            java.math.BigDecimal priceMax,
            List<Long> ids,
            Pageable pageable) {

        return cactusRepository.findAll(
                (org.springframework.data.jpa.domain.Specification<Cactus>)
                        (root, query, cb) -> {

                            var filters =
                                    new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

                            filters.add(cb.isTrue(root.get("active")));

                            if (productType != null && !productType.isBlank()) {
                                filters.add(cb.equal(root.get("productType"), productType));
                            }

                            if (mainCategory != null && !mainCategory.isBlank()) {
                                filters.add(cb.equal(root.get("mainCategory"), mainCategory));
                            }

                            if (category != null && !category.isBlank()
                                    && !category.equals("Toți")) {
                                filters.add(cb.equal(root.get("category"), category));
                            }

                            if (search != null && !search.isBlank()) {
                                String literal = search.toLowerCase(java.util.Locale.ROOT)
                                        .replace("!", "!!")
                                        .replace("%", "!%")
                                        .replace("_", "!_");

                                filters.add(cb.like(
                                        cb.lower(root.get("name")),
                                        "%" + literal + "%",
                                        '!'));
                            }

                            if (priceMin != null) {
                                filters.add(cb.greaterThanOrEqualTo(
                                        root.get("price"), priceMin));
                            }

                            if (priceMax != null) {
                                filters.add(cb.lessThanOrEqualTo(
                                        root.get("price"), priceMax));
                            }

                            if (ids != null) {
                                filters.add(ids.isEmpty()
                                        ? cb.disjunction()
                                        : root.get("id").in(ids));
                            }

                            return cb.and(
                                    filters.toArray(jakarta.persistence.criteria.Predicate[]::new));
                        }, pageable);
    }

    public List<Cactus> getAllCacti() {
        return cactusRepository.findAll();
    }

    public Cactus addCactus(CactusRequestDTO request) {
        validateCategory(request);

        Cactus cactus = new Cactus();
        cactus.setName(request.name().trim());
        cactus.setPrice(request.price());
        cactus.setProductType(request.productType().trim());
        cactus.setMainCategory(request.mainCategory().trim());
        cactus.setCategory(request.category().trim());
        cactus.setDescription(
                request.description() != null ? request.description().trim() : "");
        cactus.setImageUrl(
                request.imageUrl() != null ? request.imageUrl().trim() : "");
        cactus.setStock(request.stock() != null ? request.stock() : 0);

        return cactusRepository.save(cactus);
    }

    public void deleteCactus(Long id) {
        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Produsul nu a fost găsit."));

        cactus.setActive(false);
        cactusRepository.save(cactus);
    }

    public Cactus reactivateCactus(Long id) {
        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Produsul nu a fost găsit."));

        cactus.setActive(true);
        return cactusRepository.save(cactus);
    }

    public void hardDeleteCactus(Long id) {
        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Produsul nu a fost găsit."));

        if (cactus.isActive()) {
            throw new IllegalStateException(
                    "Dezactiveaza produsul inainte de a-l sterge definitiv.");
        }

        cactusRepository.delete(cactus);
    }

    public Cactus updateCactus(Long id, CactusRequestDTO request) {
        validateCategory(request);

        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Produsul nu a fost găsit."));

        cactus.setName(request.name().trim());
        cactus.setPrice(request.price());
        cactus.setProductType(request.productType().trim());
        cactus.setMainCategory(request.mainCategory().trim());
        cactus.setCategory(request.category().trim());
        cactus.setDescription(
                request.description() != null ? request.description().trim() : "");
        cactus.setImageUrl(
                request.imageUrl() != null ? request.imageUrl().trim() : "");
        cactus.setStock(request.stock() != null ? request.stock() : 0);

        return cactusRepository.save(cactus);
    }
}