package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRegisterDTO(
        @NotBlank(message = "Numele este obligatoriu.")
        @Size(
                max = 255,
                message = "Numele poate avea cel mult 255 de caractere.")
        String name,

        @NotBlank(message = "Emailul este obligatoriu.")
        @Email(message = "Adresa de email nu este validă.")
        @Size(
                max = 255,
                message = "Emailul poate avea cel mult 255 de caractere.")
        String email,

        @NotBlank(message = "Parola este obligatorie.")
        @Size(
                min = 8,
                message = "Parola trebuie să aibă cel puțin 8 caractere.")
        String password,

        @NotBlank(message = "Adresa este obligatorie.")
        @Size(
                max = 255,
                message = "Adresa poate avea cel mult 255 de caractere.")
        String address
) {}