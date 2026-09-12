package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.CactusRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.repository.CactusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CactusService {

    @Autowired
    private CactusRepository cactusRepository;

    // Produse active — pentru magazin (clienți)
    public List<Cactus> getActiveCacti(String productType, String mainCategory, String category, String search) {
        if (productType == null || productType.isBlank() || mainCategory == null || mainCategory.isBlank()) {
            return cactusRepository.findByActiveTrueAndNameContainingIgnoreCase(search);
        }

        if (category.equals("Toți")) {
            return cactusRepository.findByActiveTrueAndProductTypeAndMainCategoryAndNameContainingIgnoreCase(
                    productType, mainCategory, search);
        }

        return cactusRepository.findByActiveTrueAndProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
                productType, mainCategory, category, search);
    }

    // Toate produsele — pentru admin
    public List<Cactus> getAllCacti() {
        return cactusRepository.findAll();
    }

    public Cactus addCactus(CactusRequestDTO request) {
        Cactus cactus = new Cactus();
        cactus.setName(request.name().trim());
        cactus.setPrice(request.price());
        cactus.setProductType(request.productType().trim());
        cactus.setMainCategory(request.mainCategory().trim());
        cactus.setCategory(request.category().trim());
        cactus.setDescription(request.description() != null ? request.description().trim() : "");
        cactus.setImageUrl(request.imageUrl() != null ? request.imageUrl().trim() : "");
        cactus.setStock(request.stock() != null ? request.stock() : 0);

        return cactusRepository.save(cactus);
    }

    // Soft-delete: dezactivează produsul în loc să-l șteargă
    public void deleteCactus(Long id) {
        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produsul nu a fost găsit."));
        cactus.setActive(false);
        cactusRepository.save(cactus);
    }

    public Cactus reactivateCactus(Long id) {
        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produsul nu a fost găsit."));
        cactus.setActive(true);
        return cactusRepository.save(cactus);
    }

    public void hardDeleteCactus(Long id) {
        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produsul nu a fost găsit."));
        if (cactus.isActive()) {
            throw new IllegalStateException("Dezactiveaza produsul inainte de a-l sterge definitiv.");
        }
        cactusRepository.delete(cactus);
    }

    public Cactus updateCactus(Long id, CactusRequestDTO request) {
        Cactus cactus = cactusRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produsul nu a fost găsit."));

        cactus.setName(request.name().trim());
        cactus.setPrice(request.price());
        cactus.setProductType(request.productType().trim());
        cactus.setMainCategory(request.mainCategory().trim());
        cactus.setCategory(request.category().trim());
        cactus.setDescription(request.description() != null ? request.description().trim() : "");
        cactus.setImageUrl(request.imageUrl() != null ? request.imageUrl().trim() : "");
        cactus.setStock(request.stock() != null ? request.stock() : 0);

        return cactusRepository.save(cactus);
    }
}