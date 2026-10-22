package com.vaishali.core.education;

import com.vaishali.core.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One degree / school entry on the recruiter page. */
@Entity
@Table(name = "education")
@Getter
@Setter
@NoArgsConstructor
public class Education extends BaseEntity {

    @NotBlank
    @Size(max = 150)
    private String degree;

    @NotBlank
    @Size(max = 150)
    private String school;

    @Size(max = 150)
    private String place;

    /** e.g. "2021 – 2025" */
    @Size(max = 60)
    private String period;

    /** e.g. "CGPA 8.4 / 10" */
    @Size(max = 60)
    private String score;
}
