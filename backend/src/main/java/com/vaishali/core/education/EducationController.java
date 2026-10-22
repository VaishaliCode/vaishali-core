package com.vaishali.core.education;

import com.vaishali.core.common.CrudController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/education")
public class EducationController extends CrudController<Education> {
    public EducationController(EducationService service) {
        super(service);
    }
}
