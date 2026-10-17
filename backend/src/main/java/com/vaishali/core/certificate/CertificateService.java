package com.vaishali.core.certificate;

import com.vaishali.core.common.CrudService;
import org.springframework.stereotype.Service;

@Service
public class CertificateService extends CrudService<Certificate> {
    public CertificateService(CertificateRepository repository) {
        super(repository, "Certificate");
    }
}