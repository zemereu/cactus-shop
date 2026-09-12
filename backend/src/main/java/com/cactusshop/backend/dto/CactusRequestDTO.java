package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CactusRequestDTO(
        @NotBlank(message = "Numele produsului este obligatoriu.") String name,
        @NotNull(message = "Prețul este obligatoriu.")
        @Positive(message = "Prețul trebuie să fie mai mare decât 0.") BigDecimal price,
        @NotBlank(message = "Tipul de produs (Plantă/Semințe) este obligatoriu.") String productType,
        @NotBlank(message = "Categoria principală (Cactuși/Suculente) este obligatorie.") String mainCategory,
        @NotBlank(message = "Genul (subcategoria) este obligatoriu.") String category,
        String description,
        String imageUrl,
        Integer stock
) {}