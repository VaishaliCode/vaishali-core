package com.vaishali.core.skill;

import com.vaishali.core.common.CrudService;
import org.springframework.stereotype.Service;

@Service
public class SkillService extends CrudService<Skill> {
    public SkillService(SkillRepository repository) {
        super(repository, "Skill");
    }
}