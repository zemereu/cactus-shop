package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerLoginDTO(
        @Size(max = 255)
        @NotBlank(message = "Emailul este obligatoriu.")
        String email,

        @Size(max = 72)
        @NotBlank(message = "Parola este obligatorie.")
        String password
) {}