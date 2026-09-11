package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CustomerRegisterDTO {

    @NotBlank(message = "Numele este obligatoriu.")
    private String name;

    @NotBlank(message = "Emailul este obligatoriu.")
    @Email(message = "Adresa de email nu este validă.")
    private String email;

    @NotBlank(message = "Parola este obligatorie.")
    @Size(min = 8, message = "Parola trebuie să aibă cel puțin 8 caractere.")
    private String password;

    @NotBlank(message = "Adresa este obligatorie.")
    private String address;

    public CustomerRegisterDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}