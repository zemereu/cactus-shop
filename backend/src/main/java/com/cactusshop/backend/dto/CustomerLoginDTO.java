package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CustomerLoginDTO {

    @NotBlank(message = "Emailul este obligatoriu.")
    private String email;

    @NotBlank(message = "Parola este obligatorie.")
    private String password;

    public CustomerLoginDTO() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}