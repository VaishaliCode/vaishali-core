package com.vaishali.core.skill;

import com.vaishali.core.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "skills")
@Getter
@Setter
@NoArgsConstructor
public class Skill extends BaseEntity {

    @NotBlank
    @Size(max = 60)
    private String name;

    /** e.g. LANGUAGE, FRAMEWORK, DATABASE, TOOL, CORE, CONCEPT, FRONTEND */
    @NotBlank
    @Size(max = 30)
    private String category;

    @Min(0)
    @Max(100)
    private int proficiency;
}