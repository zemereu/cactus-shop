package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CactusRequestDTO(
        @NotBlank(message = "Numele produsului este obligatoriu.")
        @Size(max = 255, message = "Câmpul name poate avea cel mult 255 de caractere.")
        String name,

        @NotNull(message = "Prețul este obligatoriu.")
        @Positive(message = "Prețul trebuie să fie mai mare decât 0.")
        @Digits(integer = 8, fraction = 2)
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
        @Size(max = 255, message = "Câmpul category poate avea cel mult 255 de caractere.")
        String category,

        @Size(max = 255, message = "Câmpul description poate avea cel mult 255 de caractere.")
        String description,
        @Size(max = 1000, message = "Câmpul imageUrl poate avea cel mult 1000 de caractere.")
        String imageUrl,

        @Min(value = 0, message = "Stocul nu poate fi negativ.")
        Integer stock,

        @Size(max = 255, message = "Câmpul location poate avea cel mult 255 de caractere.")
        String location,
        Boolean hybrid,

        @Min(value = 0, message = "Versiunea produsului nu poate fi negativă.")
        Long version
) {}
