package com.vaishali.core.link;

import com.vaishali.core.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "social_links")
@Getter
@Setter
@NoArgsConstructor
public class SocialLink extends BaseEntity {

    @NotBlank
    @Size(max = 40)
    private String label;

    @NotBlank
    @Size(max = 300)
    private String url;
}