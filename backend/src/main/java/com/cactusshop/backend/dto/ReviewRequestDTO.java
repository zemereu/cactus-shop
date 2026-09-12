package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequestDTO(
        @Min(value = 1, message = "Nota trebuie să fie între 1 și 5.")
        @Max(value = 5, message = "Nota trebuie să fie între 1 și 5.") int rating,
        @NotBlank(message = "Comentariul este obligatoriu.")
        @Size(max = 1000, message = "Comentariul poate avea cel mult 1000 de caractere.") String comment,
        Long cactusId // null = recenzie generală despre magazin
) {}