package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerUpdateDTO(
        @NotBlank(message = "Adresa este obligatorie.")
        @Size(
                max = 255,
                message = "Adresa poate avea cel mult 255 de caractere.")
        String address
) {}