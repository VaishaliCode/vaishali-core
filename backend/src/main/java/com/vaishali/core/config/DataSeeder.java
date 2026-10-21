package com.vaishali.core.config;

import com.vaishali.core.certificate.Certificate;
import com.vaishali.core.certificate.CertificateRepository;
import com.vaishali.core.link.SocialLink;
import com.vaishali.core.link.SocialLinkRepository;
import com.vaishali.core.project.Project;
import com.vaishali.core.project.ProjectRepository;
import com.vaishali.core.skill.Skill;
import com.vaishali.core.skill.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProjectRepository projects;
    private final CertificateRepository certificates;
    private final SkillRepository skills;
    private final SocialLinkRepository links;

    @Override
    public void run(String... args) {
        if (projects.count() == 0) seedProjects();
        if (certificates.count() == 0) seedCertificates();
        if (skills.count() == 0) seedSkills();
        if (links.count() == 0) seedLinks();
    }

    private void seedProjects() {
        Project vibe = new Project();
        vibe.setDisplayOrder(1);
        vibe.setFeatured(true);
        vibe.setTitle("VibeLang");
        vibe.setTagline("A custom programming language & interpreter, built from scratch in Java");
        vibe.setDescription("A full language pipeline — lexer, parser, AST and tree-walking interpreter — "
                + "with lexical scoping, control flow and a web playground to run .vibe programs.");
        vibe.setTechStack(List.of("Java", "Spring Boot", "React"));
        vibe.setHighlights(List.of(
                "Lexer → Parser → AST → Interpreter → Runtime pipeline",
                "Operator precedence and short-circuit evaluation",
                "Runtime error handling, nested scopes, loops, conditionals and I/O",
                "Spring Boot + React web playground for executing .vibe programs"));
        vibe.setGithubUrl("https://github.com/VaishaliCode");

        Project tracker = new Project();
        tracker.setDisplayOrder(2);
        tracker.setFeatured(true);
        tracker.setTitle("Smart Revision Tracker");
        tracker.setTagline("AI-based learning system with spaced-repetition scheduling");
        tracker.setDescription("REST backend that tracks subjects, topics and revision logs, "
                + "schedules personalised revisions with spaced repetition and reports performance analytics.");
        tracker.setTechStack(List.of("Java", "Spring Boot", "PostgreSQL", "JPA / Hibernate"));
        tracker.setHighlights(List.of(
                "REST APIs for subjects, topics, revision logs and performance tracking",
                "Spaced repetition for personalised revision scheduling",
                "PostgreSQL schema via JPA/Hibernate with validation and exception handling",
                "Controller–Service–Repository architecture with performance analytics"));
        tracker.setGithubUrl("https://github.com/VaishaliCode");

        projects.saveAll(List.of(vibe, tracker));
    }

    private void seedCertificates() {
        certificates.saveAll(List.of(
                cert(1, "Introduction to Cloud Computing", "IBM · Coursera"),
                cert(2, "Java", "HackerRank"),
                cert(3, "The Bits and Bytes of Computer Networking", "Google · Coursera"),
                cert(4, "SQL (Intermediate)", "HackerRank")));
    }

    private void seedSkills() {
        String[][] data = {
                {"Java", "LANGUAGE"},
                {"Spring Boot", "FRAMEWORK"}, {"Spring MVC", "FRAMEWORK"},
                {"Hibernate", "FRAMEWORK"}, {"Spring Data JPA", "FRAMEWORK"},
                {"PostgreSQL", "DATABASE"}, {"MySQL", "DATABASE"},
                {"Maven", "TOOL"}, {"Git & GitHub", "TOOL"}, {"Docker", "TOOL"},
                {"Linux", "TOOL"}, {"Postman", "TOOL"},
                {"Data Structures & Algorithms", "CORE"}, {"DBMS", "CORE"},
                {"Operating Systems", "CORE"}, {"Computer Networks", "CORE"},
                {"Cloud Computing", "CORE"},
                {"OOP", "CONCEPT"}, {"REST APIs & JWT", "CONCEPT"},
                {"System Design (basic)", "CONCEPT"},
                {"HTML / CSS / Bootstrap", "FRONTEND"},
        };
        int order = 1;
        for (String[] row : data) {
            Skill s = new Skill();
            s.setName(row[0]);
            s.setCategory(row[1]);
            s.setDisplayOrder(order++);
            skills.save(s);
        }
    }

    private void seedLinks() {
        links.saveAll(List.of(
                link(1, "GitHub", "https://github.com/VaishaliCode"),
                link(2, "LinkedIn", "https://www.linkedin.com/in/vaishali-muley-614765248"),
                link(3, "Email", "mailto:vaishali.muley30112003@gmail.com")));
    }

    private Certificate cert(int order, String title, String issuer) {
        Certificate c = new Certificate();
        c.setDisplayOrder(order);
        c.setTitle(title);
        c.setIssuer(issuer);
        return c;
    }

    private SocialLink link(int order, String label, String url) {
        SocialLink l = new SocialLink();
        l.setDisplayOrder(order);
        l.setLabel(label);
        l.setUrl(url);
        return l;
    }
}