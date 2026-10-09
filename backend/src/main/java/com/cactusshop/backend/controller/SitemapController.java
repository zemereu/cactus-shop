package com.cactusshop.backend.controller;

import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.repository.CactusRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class SitemapController {

    @org.springframework.beans.factory.annotation.Value("${app.public-url}")
    private String publicUrl;

    @Autowired
    private CactusRepository cactusRepository;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap(HttpServletRequest request) {
        String base = publicUrl.replaceAll("/+$", "");

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        String[] pages = {
                "", "shop.html", "reviews.html",
                "orders.html", "account.html", "terms.html"
        };

        for (String page : pages) {
            xml.append("  <url><loc>")
                    .append(base).append("/").append(page)
                    .append("</loc></url>\n");
        }

        List<Cactus> products = cactusRepository.findByActiveTrue();

        for (Cactus product : products) {
            xml.append("  <url><loc>")
                    .append(base)
                    .append("/product.html?id=")
                    .append(product.getId())
                    .append("</loc></url>\n");
        }

        xml.append("</urlset>");
        return xml.toString();
    }
}