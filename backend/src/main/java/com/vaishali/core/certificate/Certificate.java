package com.vaishali.core.certificate;

import com.vaishali.core.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "certificates")
@Getter
@Setter
@NoArgsConstructor
public class Certificate extends BaseEntity {

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    @Size(max = 120)
    private String issuer;

    private LocalDate issuedOn;
    private String credentialUrl;
    private String imageUrl;
}