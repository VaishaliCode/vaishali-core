package com.vaishali.core.education;

import com.vaishali.core.common.CrudService;
import org.springframework.stereotype.Service;

@Service
public class EducationService extends CrudService<Education> {
    public EducationService(EducationRepository repository) {
        super(repository, "Education");
    }
}
