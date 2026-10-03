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

    @Autowired
    private CactusRepository cactusRepository;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap(HttpServletRequest request) {
        String base = request.getScheme() + "://" + request.getServerName();
        if (request.getServerPort() != 80 && request.getServerPort() != 443) {
            base += ":" + request.getServerPort();
        }

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Pagini statice
        String[] pages = {"", "shop.html", "recenzii.html", "comenzi.html", "cont.html", "termeni.html"};
        for (String page : pages) {
            xml.append("  <url><loc>").append(base).append("/").append(page).append("</loc></url>\n");
        }

        // Pagini produse active
        List<Cactus> products = cactusRepository.findByActiveTrue();
        for (Cactus p : products) {
            xml.append("  <url><loc>").append(base).append("/produs.html?id=").append(p.getId()).append("</loc></url>\n");
        }

        xml.append("</urlset>");
        return xml.toString();
    }
}