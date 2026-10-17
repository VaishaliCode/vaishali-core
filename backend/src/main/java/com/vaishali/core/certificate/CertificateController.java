package com.vaishali.core.certificate;

import com.vaishali.core.common.CrudController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController extends CrudController<Certificate> {
    public CertificateController(CertificateService service) {
        super(service);
    }
}