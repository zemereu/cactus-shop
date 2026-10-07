package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CactusRequestDTO(
        @NotBlank(message = "Numele produsului este obligatoriu.")
        String name,

        @NotNull(message = "Prețul este obligatoriu.")
        @Positive(message = "Prețul trebuie să fie mai mare decât 0.")
        BigDecimal price,

        @NotBlank(message = "Tipul de produs (Plante/Semințe) este obligatoriu.")
        @Pattern(
                regexp = "Plante|Semințe",
                message = "Tipul trebuie să fie Plante sau Semințe.")
        String productType,

        @NotBlank(message = "Categoria principală (Cactuși/Suculente) este obligatorie.")
        @Pattern(
                regexp = "Cactuși|Suculente",
                message = "Categoria principală trebuie să fie Cactuși sau Suculente.")
        String mainCategory,

        @NotBlank(message = "Genul (subcategoria) este obligatoriu.")
        String category,

        String description,
        String imageUrl,

        @Min(value = 0, message = "Stocul nu poate fi negativ.")
        Integer stock,

        String location
) {}