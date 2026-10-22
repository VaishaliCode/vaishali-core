package com.vaishali.core.profile;

import com.vaishali.core.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * The "about me" details shown on the recruiter page (/recruiter).
 * Keep exactly ONE profile record — the website uses the first one (lowest display order).
 */
@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
public class Profile extends BaseEntity {

    @NotBlank
    @Size(max = 60)
    private String firstName;

    @NotBlank
    @Size(max = 60)
    private String lastName;

    /** e.g. "Backend Developer · Java · Spring Boot · PostgreSQL" */
    @Size(max = 200)
    private String headline;

    @Size(max = 120)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String summary;

    /** e.g. "Backend Developer / Software Engineer roles" */
    @Size(max = 200)
    private String seeking;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_achievements", joinColumns = @JoinColumn(name = "profile_id"))
    @OrderColumn(name = "position")
    @Column(name = "achievement", length = 500)
    private List<String> achievements = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_languages", joinColumns = @JoinColumn(name = "profile_id"))
    @OrderColumn(name = "position")
    @Column(name = "language", length = 60)
    private List<String> languages = new ArrayList<>();
}
