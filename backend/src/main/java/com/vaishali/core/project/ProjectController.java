package com.vaishali.core.project;

import com.vaishali.core.common.CrudController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController extends CrudController<Project> {
    public ProjectController(ProjectService service) {
        super(service);
    }
}