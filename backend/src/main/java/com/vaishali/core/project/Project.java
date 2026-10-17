package com.vaishali.core.project;

import com.vaishali.core.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project extends BaseEntity {

    @NotBlank
    @Size(max = 120)
    private String title;

    @Size(max = 200)
    private String tagline;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_tech", joinColumns = @JoinColumn(name = "project_id"))
    @OrderColumn(name = "position")
    @Column(name = "tech", length = 60)
    private List<String> techStack = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_highlights", joinColumns = @JoinColumn(name = "project_id"))
    @OrderColumn(name = "position")
    @Column(name = "highlight", length = 500)
    private List<String> highlights = new ArrayList<>();

    private String githubUrl;
    private String liveUrl;
    private String imageUrl;
    private boolean featured;
}