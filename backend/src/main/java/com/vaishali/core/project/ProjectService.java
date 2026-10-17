package com.vaishali.core.project;

import com.vaishali.core.common.CrudService;
import org.springframework.stereotype.Service;

@Service
public class ProjectService extends CrudService<Project> {
    public ProjectService(ProjectRepository repository) {
        super(repository, "Project");
    }
}