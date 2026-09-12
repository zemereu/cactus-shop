package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CactusRequestDTO(
        @NotBlank(message = "Numele produsului este obligatoriu.") String name,
        @Positive(message = "Prețul trebuie să fie mai mare decât 0.") double price,
        @NotBlank(message = "Tipul de produs (Plantă/Semințe) este obligatoriu.") String productType,
        @NotBlank(message = "Categoria principală (Cactuși/Suculente) este obligatorie.") String mainCategory,
        @NotBlank(message = "Genul (subcategoria) este obligatoriu.") String category,
        String description,
        String imageUrl,
        Integer stock
) {}