package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerUpdateDTO(
        @NotBlank(message = "Adresa este obligatorie.")
        @Size(
                max = 255,
                message = "Adresa poate avea cel mult 255 de caractere.")
        String address,
        @Size(max = 100) @jakarta.validation.constraints.Pattern(regexp = ".*\\S.*") String firstName,
        @Size(max = 100) @jakarta.validation.constraints.Pattern(regexp = ".*\\S.*") String lastName,
        @Size(max = 30) @jakarta.validation.constraints.Pattern(regexp = "[+0-9() .-]*") String phone,
        @jakarta.validation.constraints.Pattern(regexp = "|Dl\\.|Dna\\.") String salutation
) {
    @jakarta.validation.constraints.AssertTrue(message = "Completează prenumele și numele împreună.")
    public boolean isNameComplete() { return (firstName == null) == (lastName == null); }
}