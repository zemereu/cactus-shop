package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRegisterDTO(
        @NotBlank(message = "Numele este obligatoriu.") String name,
        @NotBlank(message = "Emailul este obligatoriu.")
        @Email(message = "Adresa de email nu este validă.") String email,
        @NotBlank(message = "Parola este obligatorie.")
        @Size(min = 8, message = "Parola trebuie să aibă cel puțin 8 caractere.") String password,
        @NotBlank(message = "Adresa este obligatorie.") String address
) {}