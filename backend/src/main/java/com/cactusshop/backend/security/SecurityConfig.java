package com.cactusshop.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(
                        org.springframework.security.config.http.SessionCreationPolicy.STATELESS
                ))
                .authorizeHttpRequests(auth -> auth
                        // Fisiere statice.
                        .requestMatchers(
                                "/", "/*.html", "/dist/**", "/images/**",
                                "/favicon.ico", "/sitemap.xml", "/robots.txt"
                        ).permitAll()

                        // Autentificare.
                        .requestMatchers(HttpMethod.GET, "/api/auth/me")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/logout").permitAll()
                        .requestMatchers(
                                "/api/customers/register",
                                "/api/customers/login"
                        ).permitAll()
                        .requestMatchers("/api/customers/logout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/customers/verify")
                        .permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/customers/resend-verification"
                        ).hasRole("CUSTOMER")

                        // Catalog public.
                        .requestMatchers(HttpMethod.GET, "/api/cacti").permitAll()

                        // Regula pentru "all" trebuie sa fie inainte de "/{id}".
                        .requestMatchers(HttpMethod.GET, "/api/cacti/all")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/cacti/{id}")
                        .permitAll()

                        // Comenzi publice si comenzile clientului autentificat.
                        .requestMatchers(HttpMethod.POST, "/api/orders")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/lookup")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/my")
                        .hasRole("CUSTOMER")

                        .requestMatchers(HttpMethod.GET, "/api/categories")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/general")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/product/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/images/**")
                        .permitAll()

                        // Client.
                        .requestMatchers(HttpMethod.GET, "/api/customers/me")
                        .hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.PUT, "/api/customers/me")
                        .hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/reviews")
                        .hasRole("CUSTOMER")

                        // Admin.
                        .requestMatchers(HttpMethod.POST, "/api/cacti")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/images/upload")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/cacti/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/cacti/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/categories")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/orders")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/pending")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/reviews/**")
                        .hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}