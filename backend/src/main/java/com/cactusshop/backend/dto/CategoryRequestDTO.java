package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequestDTO(
        @NotBlank(message = "Numele subcategoriei este obligatoriu.")
        @Size(max = 255)
        String name,

        @NotBlank(message = "Categoria principală este obligatorie.")
        @Pattern(
                regexp = "Cactuși|Suculente",
                message = "Categoria principală trebuie să fie Cactuși sau Suculente.")
        String mainCategory
) {}