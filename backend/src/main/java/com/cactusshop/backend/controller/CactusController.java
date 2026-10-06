package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CactusRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.service.CactusService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cacti")
public class CactusController {

    @Autowired
    private CactusService cactusService;

    // Public — doar produse active, cu paginare
    @GetMapping
    public Page<Cactus> getCacti(
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String mainCategory,
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) java.math.BigDecimal priceMin,
            @RequestParam(required = false) java.math.BigDecimal priceMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name-asc") String sort,
            @RequestParam(required = false) List<Long> ids) {

        if (page < 0 || size < 1
                || (priceMin != null && priceMax != null
                && priceMin.compareTo(priceMax) > 0)) {
            throw new IllegalArgumentException(
                    "Paginare sau interval de preț invalid.");
        }

        Sort ordering = switch (sort) {
            case "name-asc", "favorites" -> Sort.by("name").ascending();
            case "name-desc" -> Sort.by("name").descending();
            case "price-asc" -> Sort.by("price").ascending();
            case "price-desc" -> Sort.by("price").descending();
            case "stock-desc" -> Sort.by("stock").descending();
            default -> throw new IllegalArgumentException("Sortare invalidă.");
        };

        Pageable pageable = PageRequest.of(
                page,
                Math.min(size, 50),
                ordering.and(Sort.by("id")));

        return cactusService.getActiveCacti(
                productType,
                mainCategory,
                category,
                search,
                priceMin,
                priceMax,
                ids,
                pageable);
    }

    // Public — un singur produs activ, după ID
    @GetMapping("/{id}")
    public ResponseEntity<Cactus> getCactusById(@PathVariable Long id) {
        return cactusService.getActiveById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Admin — toate produsele (inclusiv inactive)
    @GetMapping("/all")
    public List<Cactus> getAllCacti() {
        return cactusService.getAllCacti();
    }

    @PostMapping
    public ResponseEntity<Cactus> addCactus(
            @Valid @RequestBody CactusRequestDTO request) {
        Cactus saved = cactusService.addCactus(request);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void deleteCactus(@PathVariable Long id) {
        cactusService.deleteCactus(id);
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateCactus(@PathVariable Long id) {
        try {
            Cactus saved = cactusService.reactivateCactus(id);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> hardDeleteCactus(@PathVariable Long id) {
        try {
            cactusService.hardDeleteCactus(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCactus(
            @PathVariable Long id,
            @Valid @RequestBody CactusRequestDTO request) {
        try {
            Cactus saved = cactusService.updateCactus(id, request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}