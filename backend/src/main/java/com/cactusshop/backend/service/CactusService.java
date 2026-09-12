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

    public List<Cactus> getCacti(String productType, String mainCategory, String category, String search) {
        if (productType == null || productType.isBlank() || mainCategory == null || mainCategory.isBlank()) {
            return cactusRepository.findByNameContainingIgnoreCase(search);
        }

        if (category.equals("Toți")) {
            return cactusRepository.findByProductTypeAndMainCategoryAndNameContainingIgnoreCase(
                    productType, mainCategory, search);
        }

        return cactusRepository.findByProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
                productType, mainCategory, category, search);
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

    public void deleteCactus(Long id) {
        cactusRepository.deleteById(id);
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